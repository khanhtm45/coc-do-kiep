# 🐸 Hành Trình Độ Kiếp Của Cóc | MLN111 FPT University

Một trò chơi Boardgame trực tuyến (Multiplayer) mô phỏng hành trình học tập môn **Triết học Mác-Lênin (MLN111)** tại Đại học FPT. Game giúp người chơi hiểu về các quy luật Triết học (Lượng-Chất, Nguyên nhân-Kết quả) thông qua các tình huống thực tế của sinh viên.

---

## 🔗 Live Demo
Bạn có thể xem trước bản chơi đơn (Offline) ngay tại đây:
👉 **[https://khanhtm45.github.io/coc-do-kiep/](https://khanhtm45.github.io/coc-do-kiep/)**

*(Lưu ý: Để chơi Online với bạn bè, bạn cần sử dụng link Render sau khi Deploy thành công ở Bước 2 bên dưới).*

---

## 🚀 Hướng dẫn Deployment (Lên Online)

Vì đây là trò chơi Multiplayer sử dụng **Node.js** và **Socket.io**, bạn không thể dùng GitHub Pages. Tôi khuyên bạn nên sử dụng **Render.com** (Miễn phí và cực kỳ dễ dùng).

### Bước 1: Đưa code lên GitHub
1. Truy cập [github.com](https://github.com) và tạo một **Repository** mới (tên tùy chọn, VD: `mln111-game`).
2. Mở terminal tại thư mục dự án và chạy các lệnh sau:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Bước 2: Deploy lên Render.com
1. Truy cập [dashboard.render.com](https://dashboard.render.com) và đăng nhập bằng tài khoản GitHub.
2. Chọn **"New +"** -> **"Web Service"**.
3. Kết nối với Repository bạn vừa tạo trên GitHub.
4. Cấu hình các thông số sau:
   - **Name**: `mln111-game` (tùy chọn)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Nhấn **"Create Web Service"**.
6. Đợi vài phút để Render cài đặt. Sau khi xong, bạn sẽ nhận được một đường link (VD: `https://mln111-game.onrender.com`).
7. **Xong!** Gửi link này cho bạn bè để cùng chơi.

---

## 🎮 Cách chơi
1. **Tạo phòng**: Một người chơi nhấn "Tạo phòng mới" và gửi mã phòng cho bạn bè.
2. **Vào phòng**: Người chơi khác nhập mã phòng và nhấn "Vào phòng".
3. **Bắt đầu**: Chủ phòng nhấn "Bắt đầu Game" khi đủ người (2-4 người).
4. **Mục tiêu**: Tích lũy đủ **100 tín chỉ** và cán đích tại Ô 27 (Bảo vệ Capstone) để chiến thắng.

---

## 🛠️ Công nghệ sử dụng
- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- **Thiết kế**: 3D CSS Elements, Parabolic Jump Animations

---

## 📝 Giấy phép
Dự án được tạo cho mục đích giáo dục môn MLN111 FPT University.
