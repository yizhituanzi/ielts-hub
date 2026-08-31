#!/usr/bin/env python3
"""
sync_bbdc.py — 从不背单词 App 本地数据提取已学单词，同步到 IELTS Hub

数据源（App 本地沙盒，无需root）:
  1. URL Cache API 响应（AES-CBC 解密）→ 学习计划、词组进度统计
  2. UK/US 语音缓存文件名 → 精确的已学单词列表（发音播放过的词）
  3. 学习进度数据库已用 SQLCipher 加密（密钥运行时派生，无法离线解密）

输出: bbdc_learned.json — 在网站"词汇闪卡真经 → 不背同步"标签页导入

依赖: pip3 install pycryptodome
用法: python3 sync_bbdc.py
"""

import json, base64, sqlite3, re, os, glob, sys
from datetime import datetime
from urllib.parse import unquote

CONTAINER = os.path.expanduser(
    "~/Library/Containers/40E753AA-8624-4B22-8DAB-A91F31DBF490/Data"
)
CACHE_DB = f"{CONTAINER}/Library/Caches/cn.com.langeasy.LangEasyLexis/Cache.db"
UK_SPEECH_DIR = f"{CONTAINER}/Library/isCool/UK-speech"
US_SPEECH_DIR = f"{CONTAINER}/Library/isCool/US-speech"

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
VOCAB_JS = f"{PROJECT_ROOT}/src/js/data/vocabulary.js"
OUTPUT_JSON = f"{PROJECT_ROOT}/bbdc_learned.json"

SECRET_KEY = b"cb39f85a1f274c945c8d6415fddf008c"  # v3_security secret (32B)


def decrypt_cached_response(raw_data):
    """Decrypt cached API response (AES-256-CBC, IV = first 16 bytes)."""
    from Crypto.Cipher import AES
    resp = json.loads(raw_data)
    if resp.get("data_encrypted") != 1:
        return resp.get("data_body", "")
    body = base64.b64decode(resp["data_body"])
    if len(body) <= 32:
        return ""
    iv, enc = body[:16], body[16:]
    if not enc or len(enc) % 16:
        return ""
    dec = AES.new(SECRET_KEY, AES.MODE_CBC, iv=iv).decrypt(enc)
    pad = dec[-1]
    if 1 <= pad <= 16:
        dec = dec[:-pad]
    return dec.decode("utf-8", errors="replace")


def latest_cache(path_pattern):
    """Return (url, decrypted_body) of the newest cache entry matching pattern."""
    conn = sqlite3.connect(CACHE_DB)
    c = conn.cursor()
    c.execute(
        """SELECT r.request_key, d.receiver_data
           FROM cfurl_cache_response r
           JOIN cfurl_cache_receiver_data d ON r.entry_ID = d.entry_ID
           WHERE r.request_key LIKE ? ORDER BY r.time_stamp DESC LIMIT 1""",
        (f"%{path_pattern}%",),
    )
    row = c.fetchone()
    conn.close()
    if not row:
        return None, None
    return row[0], decrypt_cached_response(row[1])


def extract_zpk_groups():
    """Word-group download/study records from zpk/upgrades URL params."""
    url, _ = latest_cache("zpk/upgrades")
    if not url:
        return []
    m = re.search(r"zpks=([^&]+)", unquote(url))
    if not m:
        return []
    groups = []
    for v in json.loads(m.group(1)).values():
        parts = v.split("_")
        if len(parts) >= 4:
            groups.append(
                {
                    "group_id": parts[1],
                    "word_count": int(parts[2]),
                    "date": datetime.fromtimestamp(int(parts[3])).strftime("%Y-%m-%d"),
                }
            )
    groups.sort(key=lambda g: g["date"])
    return groups


def extract_studyplan():
    """Current study plan: which chapters are being studied."""
    _, body = latest_cache("studyplan")
    if not body:
        return {}
    try:
        return json.loads("{" + body if not body.startswith("{") else body)
    except json.JSONDecodeError:
        return {}


def extract_speech_words():
    """Words whose pronunciation audio was cached (= played while studying)."""
    words = set()
    for d in (UK_SPEECH_DIR, US_SPEECH_DIR):
        for f in glob.glob(f"{d}/*.mp3"):
            words.add(os.path.basename(f)[:-4].lower())
    return words


def load_ielts_vocab():
    """Parse IELTS Hub vocabulary.js into a flat word list."""
    with open(VOCAB_JS, encoding="utf-8") as f:
        content = f.read()
    m = re.search(r'"chapters"\s*:\s*(\[.*?\])\s*,\s*"total"', content, re.DOTALL)
    chapters = json.loads(m.group(1))
    out = []
    for ch in chapters:
        for w in ch["words"]:
            out.append(
                {"word": w["w"], "chapter_id": ch["id"], "chapter_name": ch["name"]}
            )
    return out


def main():
    print("=" * 56)
    print("不背单词 → IELTS Hub 学习数据提取")
    print("=" * 56)

    if not os.path.isdir(CONTAINER):
        sys.exit(f"未找到不背单词 App 数据目录: {CONTAINER}")

    # --- 1. word-group progress (aggregate) ---
    zpk = extract_zpk_groups()
    zpk_total = sum(g["word_count"] for g in zpk)
    print(f"\n[1] 词组学习记录: {len(zpk)} 组 · 累计 {zpk_total} 词")

    # --- 2. study plan ---
    plan = extract_studyplan()
    plan_chapters = plan.get("mainbook_chapter_nos", [])
    print(f"[2] 当前学习计划章节: {plan_chapters or '未知'}")

    # --- 3. speech-cached words (exact, word-level) ---
    speech = extract_speech_words()
    print(f"[3] 语音缓存单词（精确已学）: {len(speech)} 个")

    # --- 4. match against IELTS Hub vocabulary ---
    ielts_words = load_ielts_vocab()
    matched = []
    for w in ielts_words:
        if w["word"].lower() in speech:
            matched.append(w)
    print(f"[4] 与词汇真经匹配: {len(matched)} 词")

    # --- 5. write output ---
    today = datetime.now().strftime("%Y-%m-%d")
    output = {
        "source": "bbdc-local-extract",
        "extracted_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "today": today,
        "matched_words": [w["word"] for w in matched],
        "match_details": matched,
        "study_chapters": plan_chapters,
        "zpk_group_count": len(zpk),
        "zpk_total_words": zpk_total,
    }
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n[✓] 已保存: {OUTPUT_JSON}")
    print("    → 打开网站「词汇闪卡真经 → 不背同步」导入此文件")
    if matched:
        print(f"    将标记 {len(matched)} 词为已掌握: {', '.join(w['word'] for w in matched[:8])}…")
    print(f"\n提示: App 学习数据库使用设备绑定密钥加密，词组ID无法映射到具体单词。")
    print(f"      学习计划章节 {plan_chapters} 可在同步页一键按章节标记。")


if __name__ == "__main__":
    main()
