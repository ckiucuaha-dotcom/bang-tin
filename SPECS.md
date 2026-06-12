# SPECS — Bảng Tin Cá Nhân

## Mục tiêu
Dashboard web tĩnh (GitHub Pages: https://ckiucuaha-dotcom.github.io/bang-tin/) tự cập nhật 2 lần/ngày, 5 mục:

1. **Tin AI** — mới nhất/hot nhất, mỗi tin kèm "vì sao quan trọng với mình" (dùng Claude Code, làm TikTok food, đầu tư CK).
2. **GitHub trending** — top repo theo ngày + theo tuần (sao tăng), nhận định xu hướng.
3. **Tin công nghệ** — quốc tế + Việt Nam.
4. **Tài chính/CK VN** — VN-Index, danh mục thật (FPT, SSB) với lãi/lỗ và hành động đề xuất, watchlist (ACB/HPG/MBB), vàng SJC, tin TTCK, lời khuyên + disclaimer.
5. **TikTok trends** — trend/content/nhạc đang nổi, lọc theo niche kênh @tracuami (ăn vặt Huế), mỗi trend kèm ý tưởng video.

## Kiến trúc
- Static SPA: `index.html` + `styles.css` + `app.js` (vanilla, không build step, không Tailwind CDN).
- Dữ liệu: `data/news.json` (routine sáng ghi), `data/market.json` (routine chiều ghi), `data/portfolio.json` (tĩnh, sửa tay).
- Cập nhật: 2 Claude cloud routine gắn repo này, commit thẳng vào `main` → Pages tự deploy.
  - `bang-tin-sang`: cron `0 0 * * *` UTC = 7h00 VN hằng ngày → news.json.
  - `bang-tin-chieu`: cron `30 8 * * 1-5` UTC = 15h30 VN T2-T6 → market.json.
- Schema + quy tắc routine: xem `CLAUDE.md` (hợp đồng dữ liệu, routine phải tuân thủ).

## UI yêu cầu
- Mobile-first 1 cột (user chủ yếu xem điện thoại), ≥1024px grid 2 cột. Dark theme, font Be Vietnam Pro.
- Sticky nav: 💰 Danh mục · 🤖 AI · ⭐ GitHub · 📱 TikTok · 📰 Công nghệ (Danh mục đầu trang).
- Header: 2 badge thời gian cập nhật sáng/chiều.
- Section CK: card tổng lãi/lỗ (xanh tăng/đỏ giảm theo quy ước VN), holdings dạng card mobile, thanh trực quan stoploss—giá—target, khối lời khuyên + disclaimer luôn hiện.
- Resilience: mỗi file data fetch độc lập (cache-bust `?v=Date.now()`); 1 file lỗi → section đó báo lỗi, phần còn lại vẫn render; badge "Dữ liệu cũ" khi news >26h / market >30h (ngày làm việc); badge cam khi `data_quality != "live"`; escape HTML.

## Backlog v2 (chưa làm)
- TikTok trend sâu hơn: GitHub Action đọc Google Sheets của dự án `tiktok_automation` (cần secret credentials) hoặc routine local đẩy trend lên repo.
- Lưu lịch sử dạng archive page (hiện tại: xem qua git history).

## Testing — RALPH Loop (bắt buộc)
Specs → Test Plan (`ralph/status.json`, T1–T9) → Implementation → vòng test/fix đến `ALL_TESTS_RESOLVED`. Không báo hoàn thành khi T8/T9 (routine end-to-end) chưa chạy thật. Dữ liệu thị trường kiểm tính hợp lệ (>0, đúng khoảng), không hard-code giá trị tuyệt đối.
