#!/usr/bin/env python3
"""fetch_market.py — Lấy giá hiện tại cho holdings + watchlist + VN-Index từ vnstock.
Đọc data/portfolio.json của repo, in JSON sạch ra stdout (giá VND đầy đủ).
Cần: pip install vnstock. Tự nuốt banner quảng cáo của vnstock."""
import os
import sys
import json
import contextlib
import warnings
from datetime import date, timedelta

warnings.filterwarnings("ignore")

HERE = os.path.dirname(os.path.abspath(__file__))
PORTFOLIO = os.path.join(os.path.dirname(HERE), "data", "portfolio.json")
SOURCE = "VCI"


@contextlib.contextmanager
def silence():
    """Nuốt stdout/stderr (vnstock in banner quảng cáo lúc import & gọi)."""
    devnull = open(os.devnull, "w")
    old_out, old_err = sys.stdout, sys.stderr
    try:
        sys.stdout, sys.stderr = devnull, devnull
        yield
    finally:
        sys.stdout, sys.stderr = old_out, old_err
        devnull.close()


def _to_float(x):
    try:
        if x is None:
            return None
        f = float(x)
        return None if f != f else f
    except (ValueError, TypeError):
        return None


def stock_quote(ticker):
    """Giá hiện tại (VND đầy đủ) + % thay đổi so phiên trước, từ history 10 ngày."""
    try:
        with silence():
            from vnstock.api.quote import Quote
            q = Quote(symbol=ticker, source=SOURCE)
            df = q.history(
                start=(date.today() - timedelta(days=10)).isoformat(),
                end=date.today().isoformat(), interval="1D")
        if df is None or df.empty:
            return None, None
        closes = [_to_float(v) for v in df["close"].tolist() if _to_float(v)]
        if not closes:
            return None, None
        price = closes[-1] * 1000  # vnstock trả nghìn VND
        chg = None
        if len(closes) >= 2 and closes[-2]:
            chg = round((closes[-1] - closes[-2]) / closes[-2] * 100, 2)
        return round(price, 0), chg
    except Exception:
        return None, None


def vnindex():
    try:
        with silence():
            from vnstock.api.quote import Quote
            q = Quote(symbol="VNINDEX", source=SOURCE)
            df = q.history(
                start=(date.today() - timedelta(days=10)).isoformat(),
                end=date.today().isoformat(), interval="1D")
        if df is None or df.empty:
            return None
        # Lọc song song (ngày, giá) để session_date luôn khớp giá, kể cả khi có row close=None.
        rows = [(str(t)[:10], _to_float(c))
                for t, c in zip(df["time"].tolist(), df["close"].tolist())
                if _to_float(c)]
        if not rows:
            return None
        session_date, last_close = rows[-1]
        out = {"close": round(last_close, 2), "session_date": session_date}
        if len(rows) >= 2 and rows[-2][1]:
            prev = rows[-2][1]
            out["change"] = round(last_close - prev, 2)
            out["change_pct"] = round((last_close - prev) / prev * 100, 2)
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
        price, chg = stock_quote(tk)
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
        price, chg = stock_quote(tk)
        watchlist.append({"ticker": tk, "price": price, "change_pct": chg})

    print(json.dumps({
        "ok": ok, "vnindex": vnindex(), "holdings": holdings,
        "totals": totals, "watchlist": watchlist,
    }, ensure_ascii=False, default=lambda o: None))


if __name__ == "__main__":
    run()
