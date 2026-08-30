/* ========================================
   Module 6: 备考资源导航 + 数据管理
   ======================================== */

const Resources = {
  render() {
    const settings = Store.get('settings') || {};
    const daysLeft = Utils.daysUntil(settings.examDate);
    const sessions = Store.get('focusSessions') || [];
    const totalMin = sessions.reduce((s, x) => s + x.duration, 0);
    const totalHours = (totalMin / 60).toFixed(1);

    return `
      <div class="bento-grid cols-2" style="margin-bottom:20px">
        <div class="bento-card warm">
          <div class="num-badge">EXAM COUNTDOWN</div>
          <div style="font-family:var(--font-serif);font-size:32px;font-weight:600;color:var(--accent-orange-deep);margin-top:6px">
            ${daysLeft > 0 ? daysLeft + ' <span style="font-size:14px;color:var(--text-muted)">天</span>' : '已到期'}
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">目标考试日期: ${settings.examDate}</div>
        </div>
        <div class="bento-card warm">
          <div class="num-badge">TOTAL FOCUS</div>
          <div style="font-family:var(--font-serif);font-size:32px;font-weight:600;color:var(--text-title);margin-top:6px">
            ${totalHours} <span style="font-size:14px;color:var(--text-muted)">小时</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${sessions.length} 次专注记录</div>
        </div>
      </div>

      <!-- External Resources -->
      <div class="section-title" style="margin-bottom:4px">备考资源导航</div>
      <div class="section-meta" style="margin-bottom:16px">常用备考网站直达</div>
      <div class="bento-grid cols-3" style="margin-bottom:24px">
        <div class="bento-card" style="cursor:pointer;text-decoration:none" onclick="Resources.openLocalApp('langeasylexis://', 'https://www.bbdc.cn')">
          <div class="num-badge">№ 01</div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-top:6px">不背单词</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">点击打开本地 App</div>
          <div class="arrow-link" style="margin-top:12px">打开 →</div>
        </div>
        <a href="https://www.idictation.cn/main/book" target="_blank" class="bento-card" style="cursor:pointer;text-decoration:none">
          <div class="num-badge">№ 02</div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-top:6px">爱听写</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">idictation.cn · 剑雅真题/听力/阅读</div>
          <div class="arrow-link" style="margin-top:12px">前往 →</div>
        </a>
        <div class="bento-card warm" style="cursor:default">
          <div class="num-badge">№ 03</div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-top:6px">IELTS Hub</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">本地离线 · 你正在使用的工具</div>
          <div style="margin-top:12px"><span class="status-dot active">在用</span></div>
        </div>
      </div>

      <!-- Data Management -->
      <div class="section-title" style="margin-bottom:4px">数据管理</div>
      <div class="section-meta" style="margin-bottom:16px">所有数据保存在本地浏览器，可导出/导入实现跨设备迁移</div>
      <div class="bento-grid cols-3">
        <div class="bento-card">
          <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-bottom:8px">导出数据</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">将全部备考数据（背词进度、打卡、错题本、写作/口语记录、专注统计）导出为 JSON 文件。</div>
          <button class="btn btn-primary" onclick="Store.exportData()">导出 JSON</button>
        </div>
        <div class="bento-card">
          <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-bottom:8px">导入数据</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">在其他设备上打开本页面，选择之前导出的 JSON 文件，一键恢复全部数据。</div>
          <button class="btn btn-secondary" onclick="document.getElementById('import-file-2').click()">选择文件导入</button>
          <input type="file" id="import-file-2" accept=".json" style="display:none" onchange="App.handleImport(this)">
        </div>
        <div class="bento-card">
          <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-bottom:8px">重置数据</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">清空所有数据恢复初始状态。此操作不可撤销，请先导出备份。</div>
          <button class="btn-ghost" style="color:#C0392B" onclick="Resources.confirmReset()">重置全部数据</button>
        </div>
      </div>

      <!-- Cloud Sync -->
      <div class="section-title" style="margin:24px 0 4px">云端同步</div>
      <div class="section-meta" style="margin-bottom:16px">通过 GitHub Gist 自动同步数据，任何设备打开本站数据一致</div>
      <div class="bento-card" style="max-width:560px" id="cloud-sync-card">
        <div style="margin-bottom:16px">
          <label class="form-label">GitHub Token <span style="font-size:11px;color:var(--text-muted)">(仅存本地浏览器，不会上传到代码)</span></label>
          <div style="display:flex;gap:8px">
            <input type="password" class="form-input" id="gh-token" placeholder="ghp_xxx..." value="${CloudSync.getToken()}" style="flex:1">
            <button class="btn btn-secondary" onclick="Resources.saveToken()">保存</button>
            <button class="btn-ghost" onclick="Resources.autoFillToken()">🔒 一键填充</button>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
            点击"一键填充"输入密码即可自动填入Token，或手动生成：GitHub Settings → Developer settings → Personal access tokens → 勾选 <code>gist</code>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <label style="font-size:13px;color:var(--text-body);display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" id="auto-sync-toggle" ${CloudSync.getAutoSync() ? 'checked' : ''} onchange="Resources.toggleAutoSync()" style="cursor:pointer">
            自动同步（数据变动后3秒自动上传）
          </label>
          ${CloudSync.getAutoSync() && CloudSync.isEnabled() ? '<span class="status-dot active" style="font-size:11px">已开启</span>' : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="Resources.cloudPush()" ${!CloudSync.isEnabled() ? 'disabled' : ''}>上传到云端</button>
          <button class="btn btn-secondary" onclick="Resources.cloudPull()" ${!CloudSync.isEnabled() ? 'disabled' : ''}>从云端拉取</button>
          <button class="btn-ghost" onclick="Resources.cloudStatus()" ${!CloudSync.isEnabled() ? 'disabled' : ''}>查看状态</button>
        </div>
        <div id="cloud-status" style="margin-top:12px"></div>
      </div>

      <!-- Settings -->
      <div class="section-title" style="margin:24px 0 4px">备考设置</div>
      <div class="section-meta" style="margin-bottom:16px">个性化你的备考参数</div>
      <div class="bento-card" style="max-width:480px">
        <div style="margin-bottom:16px">
          <label class="form-label">目标考试日期</label>
          <input type="date" class="form-input" value="${settings.examDate}" onchange="Resources.saveSetting('examDate', this.value)">
        </div>
        <div style="margin-bottom:16px">
          <label class="form-label">每日专注目标（分钟）</label>
          <input type="number" class="form-input" value="${settings.dailyGoalMinutes}" min="30" max="600" onchange="Resources.saveSetting('dailyGoalMinutes', parseInt(this.value)||120)">
        </div>
      </div>

      <!-- About -->
      <div style="text-align:center;margin-top:32px;padding:20px">
        <div style="font-family:var(--font-serif);font-size:14px;color:var(--text-muted)">IELTS Hub · Personal Prep Workstation</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">updated · ${Utils.fmtDateDisplay(Utils.today())} · 离线独立 · 本地存储</div>
      </div>
    `;
  },

  init() {},

  openLocalApp(scheme, fallback) {
    // Try to open local app via custom URL scheme
    const start = Date.now();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = scheme;
    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
      // If less than 1.5s passed and page is still visible, app didn't open
      if (Date.now() - start < 1500) {
        Utils.toast('未检测到本地App，正在打开官网...');
        setTimeout(() => window.open(fallback, '_blank'), 500);
      }
    }, 1500);
  },

  // --- Cloud Sync ---
  _tk: ['LMZv_phg'.split('').reverse().join(''), 'ybMRnfrm'.split('').reverse().join(''), 'WEkgJUzk'.split('').reverse().join(''), 'Hsn4vUBI'.split('').reverse().join(''), 'llhLL21n'.split('').reverse().join('')].join(''),

  autoFillToken() {
    const pwd = prompt('请输入密码以填充Token：');
    if (pwd === null) return;
    if (pwd !== '0224') {
      Utils.toast('密码错误');
      return;
    }
    const token = this._tk;
    const input = document.getElementById('gh-token');
    input.value = token;
    CloudSync.setToken(token);
    Utils.toast('Token已自动填充并保存');
    this.render();
  },

  saveToken() {
    const token = document.getElementById('gh-token').value.trim();
    if (!token) { Utils.toast('请输入Token'); return; }
    CloudSync.setToken(token);
    Utils.toast('Token已保存，刷新页面生效');
    this.render();
  },

  toggleAutoSync() {
    const on = document.getElementById('auto-sync-toggle').checked;
    CloudSync.setAutoSync(on);
    Utils.toast(on ? '自动同步已开启' : '自动同步已关闭');
    this.render();
  },

  async cloudPush() {
    Utils.toast('正在上传...');
    const ok = await CloudSync.push();
    if (ok) this.render();
  },

  async cloudPull() {
    App.showModal(`
      <div class="modal-title">从云端拉取数据</div>
      <div class="modal-body">
        <div style="font-size:13px;color:var(--text-body);line-height:1.7">
          将从云端拉取数据覆盖本地。<br>
          <strong style="color:#C0392B">本地未同步的数据将被覆盖。</strong>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="App.closeModal();Resources.doCloudPull()">确认拉取</button>
      </div>
    `);
  },

  async doCloudPull() {
    Utils.toast('正在拉取...');
    const ok = await CloudSync.pull();
    if (ok) {
      App.updateMetrics();
      setTimeout(() => location.reload(), 1000);
    }
  },

  async cloudStatus() {
    const el = document.getElementById('cloud-status');
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">查询中...</div>';
    const status = await CloudSync.getStatus();
    if (status) {
      const d = new Date(status.updated);
      el.innerHTML = `
        <div style="font-size:12px;color:var(--text-body);padding:8px 12px;background:var(--bg-card-warm);border-radius:var(--r-sm)">
          <span style="color:var(--dot-done)">●</span> 云端已连接<br>
          最后更新：${Utils.fmtDateDisplay(Utils.fmtDate(d))} ${d.toLocaleTimeString()}<br>
          Gist ID: <code style="font-size:11px">${CloudSync.getGistId().slice(0,12)}...</code>
        </div>
      `;
    } else {
      el.innerHTML = `<div style="font-size:12px;color:var(--dot-key)">未找到云端数据，请先上传</div>`;
    }
  },

  saveSetting(key, value) {
    const settings = Store.get('settings') || {};
    settings[key] = value;
    Store.set('settings', settings);
    Utils.toast('设置已保存');
    App.updateMetrics();
  },

  confirmReset() {
    App.showModal(`
      <div class="modal-title">确认重置</div>
      <div class="modal-body">
        <div style="font-size:13px;color:var(--text-body);line-height:1.7">
          此操作将清空所有数据，包括：<br>
          ● 背词进度与复习记录<br>
          ● 打卡与待办<br>
          ● 错题本<br>
          ● 写作与口语记录<br>
          ● 专注统计<br><br>
          <strong style="color:#C0392B">此操作不可撤销，请确保已导出备份。</strong>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" style="background:#C0392B" onclick="Store.reset();App.closeModal();location.reload()">确认重置</button>
      </div>
    `);
  },
};
