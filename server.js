const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the current directory as static files (index.html is here), but no default index
app.use(express.static(__dirname, { index: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index_online.html');
});

const FINISH = 27;
const WIN_TC = 100;

const boardData = [ /* Copied precisely to have server-side logic if needed, but actually the server only needs logic when gaining credits or moving. Let's keep data on both sides if we want. For now, since client handles animations and modals, server just acts as state sync. */ ];

// Rooms state
const ROOMS = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', (playerName) => {
    const code = generateRoomCode();
    ROOMS[code] = {
      id: code,
      players: [],
      curP: 0,
      isPlaying: false,
      hostName: playerName || "Chủ phòng"
    };
    socket.join(code);
    socket.emit('room_created', code);
  });

  socket.on('join_room', ({ code, playerName }) => {
    code = code.toUpperCase();
    const room = ROOMS[code];
    if (!room) {
      return socket.emit('error_msg', 'Phòng không tồn tại!');
    }
    if (room.isPlaying) {
      return socket.emit('error_msg', 'Phòng đã bắt đầu chơi!');
    }
    if (room.players.length >= 4) {
      return socket.emit('error_msg', 'Phòng đã đầy (Tối đa 4 người)!');
    }

    const pIndex = room.players.length + 1; // 1, 2, 3, 4
    const names = ["P1 Xanh", "P2 Đỏ", "P3 Biển", "P4 Vàng"];
    const classes = ["frog-p1", "frog-p2", "frog-p3", "frog-p4"];

    const newPlayer = {
      id: pIndex,
      sid: socket.id,
      nm: playerName || names[pIndex - 1],
      cls: classes[pIndex - 1],
      pos: 0,
      cr: 0,
      turns: 0,
      skipTurns: 0
    };

    room.players.push(newPlayer);
    socket.join(code);
    socket.roomId = code;
    socket.playerId = pIndex;
    
    // Broadcast lobby update
    io.to(code).emit('lobby_update', room.players);
  });

  // Rejoin: when a player refreshes during an active game
  socket.on('rejoin_room', ({ code, playerName }) => {
    code = code.toUpperCase();
    const room = ROOMS[code];
    if (!room) {
      return socket.emit('error_msg', 'Phòng không tồn tại hoặc đã kết thúc!');
    }

    // Find the player by name
    const player = room.players.find(p => p.nm === playerName);
    if (!player) {
      return socket.emit('error_msg', 'Không tìm thấy tên của bạn trong phòng!');
    }

    // Update socket references
    player.sid = socket.id;
    socket.join(code);
    socket.roomId = code;
    socket.playerId = player.id;

    console.log(`[Rejoin] ${playerName} rejoined room ${code} as P${player.id}`);

    if (room.isPlaying) {
      // Game is in progress — send full state to the reconnecting player
      socket.emit('rejoin_state', {
        players: room.players,
        curP: room.curP,
        myPlayerId: player.id
      });
    } else {
      // Still in lobby
      io.to(code).emit('lobby_update', room.players);
    }
  });

  socket.on('start_game', () => {
    const room = ROOMS[socket.roomId];
    if (room && room.players.length > 0) {
      room.isPlaying = true;
      io.to(socket.roomId).emit('game_started', {
        players: room.players,
        curP: room.curP
      });
    }
  });

  socket.on('roll_dice', () => {
    const room = ROOMS[socket.roomId];
    if (!room || !room.isPlaying) return;
    if (room.players[room.curP].sid !== socket.id) {
       // Not their turn
       return;
    }
    const roll = Math.floor(Math.random() * 6) + 1;
    room.players[room.curP].turns++;

    // Inform everyone about the roll
    io.to(socket.roomId).emit('dice_rolled', {
      roll: roll,
      pid: room.players[room.curP].id
    });
  });

  socket.on('player_move_complete', (newPos) => {
    const room = ROOMS[socket.roomId];
    if (!room) return;
    // Find the player by its socket ID instead of assuming curP
    const p = room.players.find(x => x.sid === socket.id);
    if (p) p.pos = newPos;
    io.to(socket.roomId).emit('update_player_state', room.players);
  });

  socket.on('sync_credits', ({ cr, mv }) => {
    const room = ROOMS[socket.roomId];
    if (!room) return;
    const p = room.players.find(x => x.sid === socket.id);
    if (p) {
      p.cr = Math.max(0, p.cr + cr);
      io.to(socket.roomId).emit('update_player_state', room.players);
      if(mv !== 0) {
        io.to(socket.roomId).emit('force_move', { pid: p.id, mv: mv });
      }
    }
  });
  
  socket.on('sync_force_move_complete', () => {
    nextTurn(socket.roomId);
  });

  socket.on('game_won', () => {
    const room = ROOMS[socket.roomId];
    if(room) {
      io.to(socket.roomId).emit('end_game', room.players[room.curP]);
      delete ROOMS[socket.roomId];
    }
  });

  socket.on('draw_chance', (idx) => {
    io.to(socket.roomId).emit('show_chance', idx);
  });

  socket.on('draw_quiz', (idx) => {
    io.to(socket.roomId).emit('show_quiz', idx);
  });

  socket.on('quiz_result', (data) => {
    io.to(socket.roomId).emit('show_quiz_outcome', data);
  });

  socket.on('request_force_move', ({ pid, mv, jail }) => {
    const room = ROOMS[socket.roomId];
    if (!room) return;
    const p = room.players.find(x => x.id === pid);
    if (p) {
      if (jail) p.skipTurns = 2;
      io.to(socket.roomId).emit('sync_force_move', { pid, mv });
    }
  });

  function nextTurn(code) {
    const room = ROOMS[code];
    if (!room) return;
    
    let nextP = (room.curP + 1) % room.players.length;
    let safeguard = 0;
    while (room.players[nextP].skipTurns > 0 && safeguard < room.players.length) {
      room.players[nextP].skipTurns--;
      console.log(`[Jail] Skipping Player ${room.players[nextP].id} (${room.players[nextP].nm}), remaining skipTurns: ${room.players[nextP].skipTurns}`);
      io.to(code).emit('update_player_state', room.players);
      nextP = (nextP + 1) % room.players.length;
      safeguard++;
    }
    
    room.curP = nextP;
    io.to(code).emit('turn_advanced', room.curP);
  }

  socket.on('set_skip_turns', ({ pid, turns }) => {
    const room = ROOMS[socket.roomId];
    if (!room) return;
    const p = room.players.find(x => x.id === pid);
    if (p) {
      p.skipTurns = turns;
      console.log(`[Jail] Player ${p.id} (${p.nm}) jailed for ${turns} turns`);
    }
    io.to(socket.roomId).emit('update_player_state', room.players);
  });

  socket.on('pay_jail_fine', (fine) => {
    const room = ROOMS[socket.roomId];
    if (!room) return;
    const p = room.players[room.curP];
    if (p && p.cr >= fine && p.skipTurns > 0) {
      p.cr -= fine;
      p.skipTurns = 0;
      io.to(socket.roomId).emit('update_player_state', room.players);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const room = ROOMS[socket.roomId];
    if (room && !room.isPlaying) {
      // Remove from lobby
      room.players = room.players.filter(p => p.sid !== socket.id);
      io.to(socket.roomId).emit('lobby_update', room.players);
      if(room.players.length === 0) delete ROOMS[socket.roomId];
    }
  });
});

const PORT = process.env.PORT || 5051;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
