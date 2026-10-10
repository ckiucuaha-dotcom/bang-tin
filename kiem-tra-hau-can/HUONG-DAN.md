# Kiểm tra công tác Hậu cần - Hướng dẫn cài đặt (khoảng 10 phút)

Ứng dụng gồm 2 file: `Code.gs` (máy chủ) và `Index.html` (giao diện).
Dữ liệu lưu trong một Google Sheets của anh/chị, ảnh lưu trong Google Drive (thư mục "Ảnh kiểm tra hậu cần").

## Bước 1. Tạo Google Sheets
1. Vào https://sheets.new (đăng nhập Google).
2. Đặt tên, ví dụ: **Sổ kiểm tra hậu cần**.

## Bước 2. Dán mã
1. Trên Sheets: menu **Tiện ích mở rộng > Apps Script**.
2. File `Code.gs` có sẵn: xóa hết, dán toàn bộ nội dung file `Code.gs`.
3. Bấm dấu **+** cạnh "Tệp" > **HTML**, đặt tên đúng `Index` (không gõ `.html`), dán nội dung file `Index.html`.
4. Bấm biểu tượng ⚙️ **Cài đặt dự án** > Múi giờ: chọn **(GMT+07:00) Hồ Chí Minh**.
5. Bấm 💾 Lưu.

## Bước 3. Chạy cài đặt lần đầu
1. Ở thanh trên cùng, chọn hàm **setup** > bấm **▶ Chạy**.
2. Google hỏi cấp quyền: **Xem xét quyền** > chọn tài khoản > **Nâng cao** > **Đi tới ... (không an toàn)** > **Cho phép**.
   (Cảnh báo này là bình thường vì app do chính anh/chị tạo, chưa qua Google duyệt.)
3. Quay lại Sheets sẽ thấy 2 trang mới:
   - **CauHinh**: sửa **danh sách đơn vị** (cột A) và **nội dung kiểm tra** (cột B) theo đơn vị mình. Sửa lúc nào cũng được.
   - **BienBan**: nơi lưu các biên bản (không cần sửa tay).

## Bước 4. Triển khai thành ứng dụng web
1. Apps Script: **Triển khai > Tùy chọn triển khai mới** > ⚙️ chọn **Ứng dụng web**.
2. **Thực thi với tư cách**: *Tôi*.
3. **Người có quyền truy cập**: *Chỉ mình tôi* (khuyên dùng, an toàn nhất).
   Nếu cần người khác trong đoàn cùng ghi: chọn *Bất kỳ ai có Tài khoản Google* (lưu ý ai có link đều vào được).
4. Bấm **Triển khai**, sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
5. Mở link trên điện thoại > menu trình duyệt > **Thêm vào màn hình chính** để dùng như một app.

> Khi sửa mã sau này: **Triển khai > Quản lý triển khai** > ✏️ > Phiên bản: *Phiên bản mới* > Triển khai. Link giữ nguyên.

## Cách dùng
1. **Tạo biên bản**: chọn đơn vị, tích nội dung kiểm tra, ghi mặt mạnh, mặt yếu (mỗi mặt yếu gắn ảnh và hạn khắc phục riêng), ảnh chung, đánh giá, hạn báo cáo.
2. Bấm **Lưu và xem tin Zalo**: app soạn sẵn tin nhắn, ảnh được đánh số khớp với "(ảnh 1, 2)" trong tin.
3. **Chia sẻ qua Zalo**: chọn Zalo > chọn nhóm đơn vị. Nội dung cũng được sao chép sẵn, nếu Zalo chỉ nhận ảnh thì dán chữ vào.
   Máy không hỗ trợ chia sẻ: dùng **Sao chép nội dung** + **Lưu ảnh về máy**, rồi gửi trong Zalo như bình thường.
4. **In / PDF**: in biên bản có chỗ ký và trang ảnh kèm theo (trên điện thoại chọn "Lưu dưới dạng PDF").
5. **Danh sách**: lọc theo đơn vị, tháng; mở lại để sửa, gửi lại, hoặc đối chiếu lần kiểm tra sau.

Mẹo: chụp ảnh bằng app Camera trước rồi chọn từ thư viện, để ảnh có sẵn trong máy khi cần gửi lại.

## Lưu ý bảo mật
- Chỉ ghi nội dung hậu cần thông thường; không ghi quân số, phiên hiệu đầy đủ, vị trí, bố trí doanh trại.
- Tránh chụp cổng, biển hiệu, khu vực hạn chế.
- Ảnh trên Drive để ở chế độ riêng tư; app chỉ đọc được ảnh trong thư mục của chính nó.
- Xóa biên bản trong app sẽ chuyển ảnh liên quan vào Thùng rác Drive.
