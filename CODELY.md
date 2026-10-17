

## Codely Structured Memories

### User
- [2026-08-19 15:38:54] User is an in-job IELTS test taker (CET-4 445 score, targeting IELTS 6.5 overall). Prep period Aug-Dec 2026 (~110 days). Currently building a personal IELTS prep web app as a side project.

### Feedback

### Project
- [2026-08-30 22:07:58] IELTS Hub project: Pure HTML/CSS/JS web app. No frameworks, no build tools, no backend. All data in localStorage with JSON export/import. Design: "Cat Bag" 日系治愈便签風, Warm Cream & Bento Brown. Originally 6 modules (Dashboard/Vocabulary/Reading/Speaking/Writing/Resources). Listening module removed 2026-08-30. Now 5 modules. - [2026-08-19 16:30:00] Data: synonyms538.js (376 groups from PDF text layer via PyMuPDF). vocabulary.js (3674 words/22 chapters, OCR via EasyOCR).

- [2026-08-20 15:49:21] IELTS Hub deployed to GitHub Pages: https://caomeiniunai7777.github.io/ielts-hub/ — repo: github.com/caomeiniunai7777/ielts-hub (personal account). Final data: vocabulary.js (3674 words/22 chapters, word list 100% from hefengxian/my-ielts audio index, phonetic 95% + meaning 98% enriched via Free Dictionary API + MyMemory API) + synonyms538.js (376 groups from PDF text layer). Timer UX improved: auto-collapse after Start, close button, click-outside dismiss, completion beep+toast.
- [2026-08-30 22:07:58] User forked ielts-hub to github.com/yizhituanzi/ielts-hub (origin), upstream is github.com/caomeiniunai7777/ielts-hub. User's own GitHub Pages: https://yizhituanzi.github.io/ielts-hub/. User has NO push access to upstream — can only push to origin. Git credential helper configured as GitHub Desktop's git-credential-manager for CLI push. Working dir: /Users/tuanzi_github_project/ielts-hub.
- [2026-08-30 22:32:07] User uses 不背单词 (BuBei DanCi) app for vocabulary learning. App's local DB is encrypted (not standard SQLite), cannot be read programmatically. Added "不背同步" tab to IELTS Hub vocabulary module for manual batch-marking words as mastered. 不背单词 app URL scheme: langeasylexis:// (bundle id: cn.com.langeasy.LangEasyLexis). User wants cloud auto-sync via GitHub Gist API — waiting for user to generate a Personal Access Token (gist scope). Not yet implemented.
- [2026-08-31 20:47:40] BBDC (不背单词) reverse engineering findings: app data at ~/Library/Containers/40E753AA-8624-4B22-8DAB-A91F31DBF490/Data. Learning DBs (Documents/isCool/LangEasyLexis.db etc.) are SQLCipher-encrypted (binary uses cipher_default_compatibility=2, page 1024) with runtime-derived key — could NOT decrypt despite exhaustive key brute-force (udid/account pwd/binary hex keys). Accessible data: URL cache Cache.db (AES-256-CBC responses decryptable with secret cb39f85a1f274c945c8d6415fddf008c, IV=first16) but volatile — app relaunch purges entries; UK/US-speech mp3 filenames = exact studied words (~21); zpk/upgrades URL params contain group-level progress. Sync solution: sync_bbdc.py (project root, needs pycryptodome) → bbdc_learned.json (gitignored) → frontend 不背同步 tab 导入JSON button. OCR screenshot path is the primary word-level sync method.

### Reference

