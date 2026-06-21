#!/usr/bin/env python3
"""validate.py — Kiểm schema data/news.json + data/market.json trước khi commit.
Exit 0 nếu hợp lệ, exit 1 kèm danh sách lỗi. Routine PHẢI chạy script này trước khi push."""
import json
import os
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), "data")

DISCLAIMER = "Thông tin tham khảo, không phải khuyến nghị đầu tư. Tự chịu trách nhiệm với quyết định của mình."
ACTIONS = {"GIỮ", "MUA THÊM", "CHỐT LỜI MỘT PHẦN", "CẮT LỖ", "THEO DÕI SÁT"}

# Các trường là văn xuôi tiếng Việt - phải có dấu (tránh routine viết không dấu).
PROSE_KEYS = {"summary", "why_it_matters", "note", "trend_note", "desc", "fit",
              "idea", "comment", "title", "name"}

errors = []


def err(msg):
    errors.append(msg)


def _accent_ratio(text):
    """Tỷ lệ ký tự tiếng Việt CÓ DẤU trên tổng chữ cái (đ/Đ tính là có dấu)."""
    letters = accented = 0
    for ch in text:
        if ch.isalpha():
            letters += 1
            if ch in "đĐ" or any(unicodedata.combining(c) for c in unicodedata.normalize("NFD", ch)):
                accented += 1
    return (accented / letters) if letters else 1.0


def check_diacritics(d, fname):
    """Gom văn xuôi tiếng Việt, fail nếu mật độ dấu quá thấp (nghi viết không dấu)."""
    chunks = []

    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in PROSE_KEYS and isinstance(v, str):
                    chunks.append(v)
                elif k == "actions" and isinstance(v, list):
                    chunks.extend(x for x in v if isinstance(x, str))
                else:
                    walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(d)
    blob = " ".join(chunks)
    ratio = _accent_ratio(blob)
    # Văn xuôi tiếng Việt thật luôn > 8% dấu kể cả khi xen thuật ngữ tiếng Anh.
    if len(blob) > 200 and ratio < 0.04:
        err(f"{fname}: nghi viết tiếng Việt KHÔNG DẤU (mật độ dấu {ratio:.1%}). "
            f"Phải dùng tiếng Việt có dấu đầy đủ.")


def load(name):
    try:
        with open(os.path.join(DATA, name), encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        err(f"{name}: không đọc/parse được — {e}")
        return None


def need(obj, keys, ctx):
    for k in keys:
        if k not in obj:
            err(f"{ctx}: thiếu key '{k}'")


def check_news(d):
    need(d, ["updated_at", "updated_at_vn", "ai", "github", "tech", "tiktok"], "news.json")
    ai = d.get("ai", [])
    if len(ai) < 3:
        err(f"news.json: ai có {len(ai)} tin (cần ≥3)")
    for i, n in enumerate(ai):
        need(n, ["title", "summary", "why_it_matters", "source", "url"], f"news.ai[{i}]")
        if not str(n.get("url", "")).startswith("http"):
            err(f"news.ai[{i}]: url không hợp lệ")
    gh = d.get("github", {})
    for key in ("daily", "weekly"):
        repos = gh.get(key, [])
        if len(repos) < 3:
            err(f"news.json: github.{key} có {len(repos)} repo (cần ≥3)")
        for i, r in enumerate(repos):
            need(r, ["repo", "desc", "stars", "stars_period", "url"], f"github.{key}[{i}]")
            if not str(r.get("url", "")).startswith("http"):
                err(f"github.{key}[{i}]: url không hợp lệ")
    tech = d.get("tech", [])
    if len(tech) < 3:
        err("news.json: tech cần ≥3 tin")
    for i, t in enumerate(tech):
        need(t, ["title", "summary", "source", "url"], f"tech[{i}]")
        if not str(t.get("url", "")).startswith("http"):
            err(f"tech[{i}]: url không hợp lệ")
    tk = d.get("tiktok", {})
    if len(tk.get("trends", [])) < 3:
        err("news.json: tiktok.trends cần ≥3")
    for i, t in enumerate(tk.get("trends", [])):
        need(t, ["name", "desc", "fit", "idea"], f"tiktok.trends[{i}]")


def check_market(d):
    need(d, ["updated_at", "updated_at_vn", "session_date", "data_quality",
             "vnindex", "holdings", "totals", "watchlist", "gold", "news_vn", "advice"], "market.json")
    if d.get("data_quality") not in ("live", "fallback_web"):
        err(f"market.json: data_quality '{d.get('data_quality')}' không hợp lệ")
    vni = d.get("vnindex", {})
    need(vni, ["close", "change", "change_pct", "note"], "vnindex")
    if not (isinstance(vni.get("close"), (int, float)) and vni["close"] > 0):
        err("market.json: vnindex.close phải > 0")
    tot_cost = tot_val = 0
    for i, h in enumerate(d.get("holdings", [])):
        need(h, ["ticker", "qty", "avg_cost", "price", "change_pct", "value", "pnl",
                 "pnl_pct", "target", "stoploss", "action", "comment"], f"holdings[{i}]")
        if h.get("action") not in ACTIONS:
            err(f"holdings[{i}]: action '{h.get('action')}' không thuộc {sorted(ACTIONS)}")
        p, q, a = h.get("price", 0), h.get("qty", 0), h.get("avg_cost", 0)
        if not p or p <= 0:
            err(f"holdings[{i}] {h.get('ticker')}: price phải > 0")
            continue
        if p < 1000:
            err(f"holdings[{i}] {h.get('ticker')}: price {p} nghi sai đơn vị (phải VND đầy đủ)")
        if abs(h.get("value", 0) - p * q) > 1:
            err(f"holdings[{i}] {h.get('ticker')}: value != qty*price ({h.get('value')} vs {p*q})")
        if abs(h.get("pnl", 0) - (p * q - a * q)) > 1:
            err(f"holdings[{i}] {h.get('ticker')}: pnl sai ({h.get('pnl')} vs {p*q - a*q})")
        if a and abs(h.get("pnl_pct", 0) - round((p - a) / a * 100, 2)) > 0.05:
            err(f"holdings[{i}] {h.get('ticker')}: pnl_pct sai ({h.get('pnl_pct')} vs {round((p-a)/a*100,2)})")
        tot_cost += a * q
        tot_val += p * q
    t = d.get("totals", {})
    if abs(t.get("cost", 0) - tot_cost) > 1 or abs(t.get("value", 0) - tot_val) > 1:
        err(f"totals: cost/value không khớp tổng dòng ({t.get('cost')}/{t.get('value')} vs {tot_cost}/{tot_val})")
    if abs(t.get("pnl", 0) - (tot_val - tot_cost)) > 1:
        err("totals: pnl != value - cost")
    for i, w in enumerate(d.get("watchlist", [])):
        need(w, ["ticker", "price", "change_pct", "comment"], f"watchlist[{i}]")
    need(d.get("gold", {}), ["sjc_buy", "sjc_sell", "note"], "gold")
    for i, n in enumerate(d.get("news_vn", [])):
        need(n, ["title", "summary", "source", "url"], f"news_vn[{i}]")
        if not str(n.get("url", "")).startswith("http"):
            err(f"news_vn[{i}]: url không hợp lệ")
    adv = d.get("advice", {})
    need(adv, ["summary", "actions", "disclaimer"], "advice")
    if adv.get("disclaimer") != DISCLAIMER:
        err("advice.disclaimer không đúng nguyên văn quy định")
    if not adv.get("actions"):
        err("advice.actions rỗng")


if __name__ == "__main__":
    news = load("news.json")
    market = load("market.json")
    if news:
        check_news(news)
        check_diacritics(news, "news.json")
    if market:
        check_market(market)
        check_diacritics(market, "market.json")
    if errors:
        print("FAIL:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("OK: news.json + market.json hợp lệ")
