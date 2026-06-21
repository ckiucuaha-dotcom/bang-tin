#!/usr/bin/env python3
"""fetch_market.py - Lấy giá holdings + watchlist + VN-Index cho dashboard Bảng Tin.

Gọi THẲNG API công khai của VCI (Vietcap) bằng thư viện chuẩn urllib - KHÔNG cần
pip install gì cả, nên chạy được trong mọi sandbox cloud. Đọc data/portfolio.json,
in JSON sạch ra stdout. Giá cổ phiếu là VND đầy đủ (vd 71500), VN-Index là điểm số.
"""
import os
import sys
import json
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PORTFOLIO = os.path.join(os.path.dirname(HERE), "data", "portfolio.json")
API = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    "Referer": "https://trading.vietcap.com.vn/",
    "Origin": "https://trading.vietcap.com.vn",
}


def _bars(symbol):
    """Trả (closes, times) cho symbol; closes là list float, times là list unix giây."""
    payload = json.dumps({
        "timeFrame": "ONE_DAY", "symbols": [symbol],
        "to": int(time.time()), "countBack": 5,
    }).encode()
    req = urllib.request.Request(API, data=payload, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.load(r)
    rec = data[0] if isinstance(data, list) and data else (data.get("data") or [None])[0]
    if not rec or "c" not in rec:
        return [], []
    closes = [float(c) for c in rec.get("c", []) if c is not None]
    times = [int(t) for t in rec.get("t", [])]
    return closes, times


def quote(symbol):
    """(price, change_pct) - price VND đầy đủ; None nếu lỗi."""
    try:
        closes, _ = _bars(symbol)
        if not closes:
            return None, None
        price = round(closes[-1], 0)
        chg = round((closes[-1] - closes[-2]) / closes[-2] * 100, 2) if len(closes) >= 2 and closes[-2] else None
        return price, chg
    except Exception:
        return None, None


def vnindex():
    try:
        closes, times = _bars("VNINDEX")
        if not closes:
            return None
        out = {"close": round(closes[-1], 2)}
        if times:
            out["session_date"] = time.strftime("%Y-%m-%d", time.gmtime(times[-1]))
        if len(closes) >= 2 and closes[-2]:
            out["change"] = round(closes[-1] - closes[-2], 2)
            out["change_pct"] = round((closes[-1] - closes[-2]) / closes[-2] * 100, 2)
        return out
    except Exception:
        return None


def run():
    with open(PORTFOLIO, "r", encoding="utf-8") as f:
        pf = json.load(f)

    holdings, tot_cost, tot_val = [], 0.0, 0.0
    ok = True
    for h in pf.get("holdings", []):
        tk = h["ticker"].upper()
        qty, avg = h.get("qty", 0), h.get("avg_cost", 0)
        price, chg = quote(tk)
        row = {"ticker": tk, "qty": qty, "avg_cost": avg,
               "target": h.get("target"), "stoploss": h.get("stoploss"),
               "price": price, "change_pct": chg}
        if price:
            cost, val = avg * qty, price * qty
            row.update(value=round(val, 0), pnl=round(val - cost, 0),
                       pnl_pct=round((price - avg) / avg * 100, 2) if avg else None)
            tot_cost += cost
            tot_val += val
        else:
            ok = False
            row["error"] = "Không lấy được giá"
        holdings.append(row)

    totals = {"cost": round(tot_cost, 0), "value": round(tot_val, 0),
              "pnl": round(tot_val - tot_cost, 0),
              "pnl_pct": round((tot_val - tot_cost) / tot_cost * 100, 2) if tot_cost else None}

    watchlist = []
    for tk in pf.get("watchlist", []):
        price, chg = quote(tk)
        watchlist.append({"ticker": tk, "price": price, "change_pct": chg})
        if price is None:
            ok = False

    print(json.dumps({
        "ok": ok, "vnindex": vnindex(), "holdings": holdings,
        "totals": totals, "watchlist": watchlist,
    }, ensure_ascii=False, default=lambda o: None))


if __name__ == "__main__":
    run()
