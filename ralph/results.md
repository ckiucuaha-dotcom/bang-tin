# RALPH Results — bang-tin

## 12/06/2026 — Vòng 1 (local, T1-T6)

- **T1 PASS** — `scripts/validate.py`: news.json + market.json đủ key, đúng kiểu, số lượng tối thiểu đạt.
- **T2 PASS** — Chrome headless dump DOM localhost:8765: đủ 5 section với data thật (FPT 73.100, VN-Index 1.798,61, Claude Fable 5, agent-skills, ASMR trend, SpaceX IPO), không còn skeleton sót.
- **T3 PASS** — Screenshot 375px: 1 cột, không tràn ngang, holdings dạng card, range bar stoploss-target đọc được. Desktop 1280px: strip 3 stat, holdings 2 cột.
- **T4 PASS** — Giả lập updated_at lùi 3 ngày + session_date 08/06: badge "Dữ liệu cũ" + ghi chú "Phiên gần nhất: 2026-06-08" hiện đúng.
- **T5 PASS** — Serve thiếu market.json: section Danh mục báo "Không tải được dữ liệu thị trường", 4 section còn lại render bình thường.
- **T6 PASS** — validate.py kiểm số học: value=qty×price, pnl=value−cost, totals khớp tổng dòng (sai số 0).

Bug đã sửa trong vòng này:
- `app.js` hàm `num()` ban đầu chứa ký tự em-dash thừa trong code, đã thay bằng trả về "?" trực tiếp.
- Data seed ban đầu chứa em-dash/en-dash trong nội dung, đã làm sạch toàn bộ và thêm quy tắc cấm vào CLAUDE.md.

T7-T9 chạy sau khi bật Pages + tạo routine.
