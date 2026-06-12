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

## 12/06/2026 — Vòng 2 (Pages + routine)

- **T7 PASS** — `curl` https://ckiucuaha-dotcom.github.io/bang-tin/ trả 200, HTML chứa "Bảng tin".
- **T8 PASS** — Routine `bang-tin-sang` (sau khi cài Claude GitHub App cho repo) commit `feed: tin sáng 12/06`: chỉ sửa data/news.json, validate.py OK, nội dung tươi (5 AI + 5 GitHub daily + 5 tech + 4 TikTok trends), tin ngày 12/06.
- **T9 PENDING** — Routine `bang-tin-chieu`: lần chạy đầu (trước khi cài app) không push được; đã trigger lại sau khi cấp quyền, đang chờ commit `feed: thị trường`.

Nguyên nhân gốc push fail ban đầu: repo tạo bằng personal token, routine cloud push qua Claude GitHub App chưa được cấp quyền trên repo. Fix: cài app `claude` cho repo `bang-tin` tại github.com/settings/installations.

## Code review (agent code-reviewer) — đã áp fix

- **XSS (Critical):** `esc()` không chặn `javascript:` trong href. Thêm `safeUrl()` chỉ cho http(s), dùng ở 4 link (news_vn, ai, tech, github). Test: url `javascript:` render thành `href="#"`.
- **fetch_market.py (High):** `closes`/`dates` lệch khi có row close=None → `session_date` sai. Sửa thành lọc song song `(ngày, giá)`.
- **validate.py (High):** bổ sung check `change_pct` holdings, công thức `pnl_pct`, subfield `vnindex`/`news_vn`/`gold`/`watchlist`, url protocol cho `tech`/`github`.
- **app.js (Medium):** gold null hiện "?" thay vì 0 (`toMillions`); market staleness thêm điều kiện >30h (bắt cuối tuần); `rangeBar` dùng null-check thay falsy.
