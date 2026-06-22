#!/usr/bin/env python3
"""update_prices.py - Làm mới CHỈ giá danh mục trong data/market.json.

Chạy bởi GitHub Actions 3 lần/ngày (8h45, 11h, 15h VN). Lấy giá live từ API VCI
(qua fetch_market.py), cập nhật vnindex + holdings + watchlist + totals + action,
GIỮ NGUYÊN advice/news_vn/gold/comment do routine Claude sinh hằng ngày.

Nếu không lấy được giá -> thoát, KHÔNG ghi đè (giữ file cũ). In 'CHANGED' nếu có
thay đổi để workflow biết có cần commit hay không.
"""
import json
import os
import sys
from datetime import datetime, timezone, timedelta

import fetch_market as fm

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), "data")
ACTIONS_KEEP = {"MUA THÊM"}  # quyết định cần phán đoán -> không tự đổi, giữ nguyên


def decide_action(price, h, prev_action):
    """Action cơ học theo ngưỡng giá. Giữ MUA THÊM nếu Claude đã đặt và vẫn trong vùng GIỮ."""
    stop, target, avg = h.get("stoploss"), h.get("target"), h.get("avg_cost")
    if stop and price <= stop:
        return "CẮT LỖ"
    if stop and price <= stop * 1.05:
        return "THEO DÕI SÁT"
    if target and price >= target:
        return "CHỐT LỜI MỘT PHẦN"
    # vùng giữa: tôn trọng MUA THÊM nếu routine đã khuyến nghị, ngược lại GIỮ
    return prev_action if prev_action in ACTIONS_KEEP else "GIỮ"


def run():
    with open(os.path.join(DATA, "market.json"), encoding="utf-8") as f:
        m = json.load(f)
    with open(os.path.join(DATA, "portfolio.json"), encoding="utf-8") as f:
        pf = json.load(f)

    prev_h = {h["ticker"]: h for h in m.get("holdings", [])}
    prev_w = {w["ticker"]: w for w in m.get("watchlist", [])}

    # vnindex
    vni = fm.vnindex()
    if not vni or not vni.get("close"):
        print("ABORT: không lấy được VN-Index, giữ nguyên file")
        return False
    session_date = vni.get("session_date") or m.get("session_date")

    # holdings
    holdings, tot_cost, tot_val = [], 0.0, 0.0
    for ph in pf.get("holdings", []):
        tk = ph["ticker"].upper()
        qty, avg = ph.get("qty", 0), ph.get("avg_cost", 0)
        price, chg = fm.quote(tk)
        if not price or price <= 0:
            print(f"ABORT: không lấy được giá {tk}, giữ nguyên file")
            return False
        cost, val = avg * qty, price * qty
        old = prev_h.get(tk, {})
        holdings.append({
            "ticker": tk, "qty": qty, "avg_cost": avg,
            "price": round(price, 0), "change_pct": chg,
            "value": round(val, 0), "pnl": round(val - cost, 0),
            "pnl_pct": round((price - avg) / avg * 100, 2) if avg else None,
            "target": ph.get("target"), "stoploss": ph.get("stoploss"),
            "action": decide_action(price, ph, old.get("action")),
            "comment": old.get("comment", ""),
        })
        tot_cost += cost
        tot_val += val

    # watchlist
    watchlist = []
    for tk in pf.get("watchlist", []):
        price, chg = fm.quote(tk)
        ow = prev_w.get(tk, {})
        watchlist.append({"ticker": tk, "price": round(price, 0) if price else ow.get("price"),
                          "change_pct": chg, "comment": ow.get("comment", "")})

    now = datetime.now(timezone(timedelta(hours=7)))
    # Cập nhật tại chỗ: chỉ số + giá, giữ nguyên note/gold/news_vn/advice
    m["vnindex"].update({"close": vni["close"], "change": vni.get("change"),
                         "change_pct": vni.get("change_pct")})
    m["holdings"] = holdings
    m["watchlist"] = watchlist
    m["totals"] = {"cost": round(tot_cost, 0), "value": round(tot_val, 0),
                   "pnl": round(tot_val - tot_cost, 0),
                   "pnl_pct": round((tot_val - tot_cost) / tot_cost * 100, 2) if tot_cost else None}
    m["session_date"] = session_date
    m["data_quality"] = "live"
    m["updated_at"] = now.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    m["updated_at_vn"] = now.strftime("%H:%M %d/%m/%Y")

    with open(os.path.join(DATA, "market.json"), "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"CHANGED: giá cập nhật {m['updated_at_vn']} | FPT {holdings[0]['price']:.0f} "
          f"SSB {holdings[1]['price']:.0f} | VN-Index {vni['close']}")
    return True


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
