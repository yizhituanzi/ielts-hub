/* ========================================
   IELTS Hub — Local Store (localStorage wrapper)
   Handles all data persistence + import/export
   ======================================== */

const Store = {
  KEY: 'ielts_hub_data_v1',

  // Default data structure
  defaults() {
    return {
      // Module 1: Dashboard
      todos: [],
      checkins: {},
      weekPlan: [],

      // Module 2: Vocabulary
      vocab: {},
      vocabSession: { chapter: 1, index: 0 },

      // Module 3: Reading
      readingErrors: [],
      synonyms538: {},

      // Module 4: Speaking
      speakingRecords: [],

      // Module 5: Writing
      writingRecords: [],

      // Focus Timer
      focusSessions: [],

      // Settings
      settings: {
        examDate: '2026-12-05',
        dailyGoalMinutes: 120,
        userName: '',
        audioAccent: 'en-GB',
      },
    };
  },

  _cache: null,

  load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(this.KEY);
      this._cache = raw ? JSON.parse(raw) : this.defaults();
      // Merge missing keys
      this._cache = { ...this.defaults(), ...this._cache };
      this._cache.settings = { ...this.defaults().settings, ...(this._cache.settings || {}) };
    } catch (e) {
      console.error('Store load error:', e);
      this._cache = this.defaults();
    }
    return this._cache;
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this._cache));
    } catch (e) {
      console.error('Store save error:', e);
    }
  },

  get(key) {
    return this.load()[key];
  },

  set(key, value) {
    this.load()[key] = value;
    this.save();
    CloudSync.scheduleSync();
  },

  update(key, fn) {
    const data = this.load();
    fn(data[key]);
    this.save();
  },

  // --- Export ---
  exportData() {
    const data = this.load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = Utils.fmtDate(new Date());
    a.href = url;
    a.download = `ielts-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.toast('数据已导出');
  },

  // --- Import ---
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Validate minimal structure
          if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid format');
          }
          // Merge with defaults to ensure all keys exist
          this._cache = { ...this.defaults(), ...data };
          this._cache.settings = { ...this.defaults().settings, ...(data.settings || {}) };
          this.save();
          Utils.toast('数据导入成功');
          resolve(true);
        } catch (err) {
          Utils.toast('导入失败：文件格式错误');
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },

  // --- Reset ---
  reset() {
    this._cache = this.defaults();
    this.save();
    Utils.toast('数据已重置');
  },
};

/* ========================================
   CloudSync — GitHub Gist auto-sync
   Token stored in localStorage (never in source code)
   ======================================== */

const CloudSync = {
  TOKEN_KEY: 'ielts_hub_gh_token',
  GIST_ID_KEY: 'ielts_hub_gist_id',
  AUTO_KEY: 'ielts_hub_auto_sync',
  GIST_FILENAME: 'ielts-hub-data.json',
  _syncTimer: null,

  getToken() { return localStorage.getItem(this.TOKEN_KEY) || ''; },
  setToken(t) { localStorage.setItem(this.TOKEN_KEY, t); },
  getGistId() { return localStorage.getItem(this.GIST_ID_KEY) || ''; },
  setGistId(id) { localStorage.setItem(this.GIST_ID_KEY, id); },
  getAutoSync() { return localStorage.getItem(this.AUTO_KEY) === '1'; },
  setAutoSync(on) { localStorage.setItem(this.AUTO_KEY, on ? '1' : '0'); },

  isEnabled() { return !!this.getToken(); },

  _headers() {
    return {
      'Authorization': `token ${this.getToken()}`,
      'Accept': 'application/vnd.github.v3+json',
    };
  },

  // Upload local data to Gist (create or update)
  async push() {
    const token = this.getToken();
    if (!token) { Utils.toast('请先配置 GitHub Token'); return false; }
    const data = Store.load();
    const content = JSON.stringify(data, null, 2);
    const gistId = this.getGistId();

    try {
      let res;
      if (gistId) {
        // Update existing gist
        res = await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers: this._headers(),
          body: JSON.stringify({
            files: { [this.GIST_FILENAME]: { content } },
          }),
        });
      } else {
        // Create new gist
        res = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: this._headers(),
          body: JSON.stringify({
            description: 'IELTS Hub Backup Data',
            public: false,
            files: { [this.GIST_FILENAME]: { content } },
          }),
        });
        if (res.ok) {
          const gist = await res.json();
          this.setGistId(gist.id);
        }
      }
      if (res.ok) {
        Utils.toast('☁ 数据已同步到云端');
        return true;
      } else {
        const err = await res.json();
        Utils.toast('同步失败: ' + (err.message || res.status));
        return false;
      }
    } catch (e) {
      Utils.toast('网络错误，同步失败');
      return false;
    }
  },

  // Pull data from Gist to local
  async pull() {
    const token = this.getToken();
    if (!token) { Utils.toast('请先配置 GitHub Token'); return false; }
    const gistId = this.getGistId();
    if (!gistId) { Utils.toast('尚无云端数据，请先上传'); return false; }

    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: this._headers(),
      });
      if (!res.ok) { Utils.toast('拉取失败: ' + res.status); return false; }
      const gist = await res.json();
      const file = gist.files[this.GIST_FILENAME];
      if (!file) { Utils.toast('云端数据文件不存在'); return false; }
      const data = JSON.parse(file.content);
      // Merge with defaults
      Store._cache = { ...Store.defaults(), ...data };
      Store._cache.settings = { ...Store.defaults().settings, ...(data.settings || {}) };
      Store.save();
      Utils.toast('☁ 已从云端拉取数据');
      return true;
    } catch (e) {
      Utils.toast('拉取失败');
      return false;
    }
  },

  // Check if gist exists and get last updated time
  async getStatus() {
    const token = this.getToken();
    const gistId = this.getGistId();
    if (!token || !gistId) return null;
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: this._headers(),
      });
      if (!res.ok) return null;
      const gist = await res.json();
      return { updated: gist.updated_at, url: gist.html_url };
    } catch (e) {
      return null;
    }
  },

  // Debounced auto-sync trigger
  scheduleSync() {
    if (!this.getAutoSync() || !this.isEnabled()) return;
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => { this.push(); }, 3000);
  },
};
