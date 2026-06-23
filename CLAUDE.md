# Bảng Tin Cá Nhân — Quy tắc cho agent tự động

Repo này là dashboard tĩnh (GitHub Pages) đọc `data/*.json`. Hai routine cloud cập nhật dữ liệu:

- **Routine SÁNG** chỉ được ghi `data/news.json`. KHÔNG sửa file nào khác.
- **Routine CHIỀU** chỉ được ghi `data/market.json`. KHÔNG sửa file nào khác.
- KHÔNG sửa `index.html`, `styles.css`, `app.js`, `data/portfolio.json` (danh mục do chủ repo sửa tay).

## Quy tắc chung (bắt buộc)

1. **Cấm bịa dữ liệu.** Chỉ dùng URL, tiêu đề, con số xuất hiện trong kết quả WebSearch/WebFetch/script thật. Nếu không lấy được dữ liệu cho một mục → để mảng rỗng kèm ghi chú, KHÔNG bịa.
2. **Giá chứng khoán:** nếu mọi nguồn fail → KHÔNG ghi đè `market.json`, giữ nguyên file cũ (dashboard tự cảnh báo dữ liệu cũ).
3. **Validate trước khi commit:** `python3 -m json.tool data/<file>.json` phải pass.
4. **Ghi đè toàn bộ file** (không merge từng phần). Schema phải đúng y như dưới.
5. Toàn bộ text tiếng Việt **CÓ DẤU đầy đủ** (vd "chân gà sốt Thái", KHÔNG viết "chan ga sot Thai"). Tuyệt đối không viết tiếng Việt không dấu - dữ liệu không dấu sẽ bị `validate.py` từ chối. `updated_at` là ISO UTC, `updated_at_vn` dạng `HH:MM DD/MM/YYYY` giờ Việt Nam (UTC+7). KHÔNG dùng ký tự em-dash (—) hay en-dash (–) trong nội dung; dùng dấu gạch nối thường (-) hoặc dấu phẩy.
6. Commit: `git pull --rebase` trước, message `feed: tin sáng DD/MM` hoặc `feed: thị trường DD/MM`, push lên `main`. Push fail → pull --rebase rồi retry 1 lần.

## Schema `data/news.json` (routine SÁNG)

```json
{
  "updated_at": "2026-06-12T00:10:00Z",
  "updated_at_vn": "07:10 12/06/2026",
  "ai": [
    {"title": "...", "summary": "2-3 câu tiếng Việt", "why_it_matters": "1 câu: ảnh hưởng gì đến chủ repo (dùng Claude Code hằng ngày, làm TikTok food content, đầu tư CK VN)", "source": "Anthropic Blog", "url": "https://...", "published": "2026-06-11", "hot": true}
  ],
  "github": {
    "daily": [{"repo": "owner/name", "desc": "1 câu tiếng Việt", "lang": "Python", "stars": 12345, "stars_period": 890, "url": "https://github.com/owner/name"}],
    "weekly": [{"repo": "...", "desc": "...", "lang": "...", "stars": 0, "stars_period": 0, "url": "..."}],
    "trend_note": "1-2 câu nhận định xu hướng chung"
  },
  "tech": [{"title": "...", "summary": "...", "source": "...", "url": "...", "published": "..."}],
  "tiktok": {
    "trends": [{"name": "tên trend", "desc": "mô tả ngắn", "fit": "cách áp dụng cho kênh @tracuami", "idea": "1 ý tưởng video cụ thể"}],
    "sounds": [{"name": "tên nhạc/sound", "desc": "đang dùng cho dạng content nào"}],
    "note": "nhận định chung tuần này"
  }
}
```

Số lượng: `ai` 5 tin (≤48h), `github.daily` 5, `github.weekly` 5, `tech` 5, `tiktok.trends` 3-5, `tiktok.sounds` 3.

Bối cảnh cá nhân hóa cho `why_it_matters` và `tiktok.*.fit/idea`:
- Chủ repo dùng Claude Code hằng ngày, quan tâm AI/dev tools, đầu tư CK Việt Nam.
- Kênh TikTok **@tracuami**: quán ăn vặt Huế (1 Trường Chinh, TP Huế) — chân gà sốt Thái, tré trộn Huế, trà trái cây, trà sữa. Nhân vật: A Nguyên (anh chủ), vợ/chị chủ, Nhớ (nhân viên partime hay "âm mưu học lỏm công thức"), Thư. Giọng Huế (rứa, răng, mô, chừ...). Chỉ chọn trend/sound áp dụng được cho niche food này.

## Schema `data/market.json` (routine CHIỀU)

```json
{
  "updated_at": "...", "updated_at_vn": "...",
  "session_date": "2026-06-12",
  "data_quality": "live",
  "vnindex": {"close": 1280.5, "change": 5.2, "change_pct": 0.41, "note": "1 câu về phiên"},
  "holdings": [
    {"ticker": "FPT", "qty": 700, "avg_cost": 91470, "price": 0, "change_pct": 0, "value": 0, "pnl": 0, "pnl_pct": 0, "target": 116000, "stoploss": 68000, "action": "GIỮ", "comment": "1-2 câu lý do"}
  ],
  "totals": {"cost": 0, "value": 0, "pnl": 0, "pnl_pct": 0},
  "watchlist": [{"ticker": "ACB", "price": 0, "change_pct": 0, "comment": "1 câu nhận định"}],
  "gold": {"sjc_buy": 0, "sjc_sell": 0, "note": ""},
  "news_vn": [{"title": "", "summary": "", "source": "", "url": ""}],
  "advice": {
    "summary": "2-4 câu tổng quan hành động",
    "actions": ["gạch đầu dòng cụ thể từng mã"],
    "disclaimer": "Thông tin tham khảo, không phải khuyến nghị đầu tư. Tự chịu trách nhiệm với quyết định của mình."
  }
}
```

Quy tắc market:
- **Lấy giá - CHỈ một nguồn duy nhất:** `python3 scripts/fetch_market.py` (gọi thẳng API VCI bằng stdlib, KHÔNG cần pip install) → in JSON `holdings`/`watchlist`/`vnindex` với giá chính xác. `data_quality` LUÔN là `"live"`.
- **CẤM TUYỆT ĐỐI bóc giá từ web** (CafeF/Vietstock/WebFetch/WebSearch). Giá web sai liên tục (vd SSB từng bị bóc 17.250 trong khi giá thật 15.150). `data_quality = "fallback_web"` đã bị `validate.py` từ chối → commit sẽ fail.
- **Nếu `fetch_market.py` lỗi:** KHÔNG bịa, KHÔNG bóc web. GIỮ NGUYÊN toàn bộ khối giá cũ trong `market.json` (`vnindex`/`holdings`/`watchlist`/`totals`/`session_date`/`data_quality`) - đó là giá live mà GitHub Actions đã quét trong ngày (8h45/11h/15h). Chỉ cập nhật phần phân tích: `vnindex.note`, `holdings[].comment`, `watchlist[].comment`, `gold`, `news_vn`, `advice`. Phân tích phải bám đúng con số giá đang có trong file, không nhắc giá nào khác.
- `action` ∈ {GIỮ, MUA THÊM, CHỐT LỜI MỘT PHẦN, CẮT LỖ, THEO DÕI SÁT}. Quy tắc: giá ≤ stoploss → CẮT LỖ; giá ≤ stoploss×1.05 → THEO DÕI SÁT; giá ≥ target → CHỐT LỜI MỘT PHẦN; còn lại GIỮ hoặc MUA THÊM kèm lý do từ tin phiên.
- `disclaimer` giữ nguyên văn như schema. CẤM khuyên margin/phái sinh.
- Số học phải khớp: `value = qty × price`, `pnl = value − qty × avg_cost`, totals = tổng các dòng. Giá VND đầy đủ (vd 95800, không phải 95.8).
- Ngày lễ/không có phiên: giữ giá & `session_date` phiên gần nhất, chỉ cập nhật tin tức.

## Chạy local

```
python3 -m http.server 8765   # xem dashboard tại localhost:8765
python3 scripts/fetch_market.py   # lấy giá holdings + watchlist + VN-Index (API VCI qua stdlib, không cần cài gì)
```
