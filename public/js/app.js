function initApp() {
  if (!sessionStorage.getItem('auth_token')) {
    window.location.href = '/login.html';
    return;
  }

  connectInitProgress();
  initSidebar();
  initDashboardActions();
  navigateTo('dashboard');
  initTokenHeader();

  initDocumentsTab();
  initQATab();
  initReportTab();

  // Logout
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      try { await API.post('/api/auth/logout', {}); } catch (_) {}
      sessionStorage.removeItem('auth_token');
      window.location.href = '/login.html';
    });
  }

  refreshTokenDisplay();
  setInterval(refreshTokenDisplay, 8000);
}

// ===== Sidebar Navigation =====
function initSidebar() {
  var btns = document.querySelectorAll('.sidebar-btn');
  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var page = btn.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  // Update sidebar
  var btns = document.querySelectorAll('.sidebar-btn');
  btns.forEach(function (b) { b.classList.remove('active'); });
  var targetBtn = document.querySelector('.sidebar-btn[data-page="' + page + '"]');
  if (targetBtn) targetBtn.classList.add('active');

  // Update pages
  var panels = document.querySelectorAll('.page-panel');
  panels.forEach(function (p) { p.classList.remove('active'); });
  var targetPanel = document.getElementById('page-' + page);
  if (targetPanel) targetPanel.classList.add('active');

  // Refresh content
  if (page === 'dashboard') loadDashboard();
  if (page === 'documents') refreshDocumentList();
  if (page === 'qa') refreshConvList();
  if (page === 'report') loadReportTypes();
  if (page === 'stats') loadStatsPage();
}

// ===== Dashboard =====
function initDashboardActions() {
  var actions = document.getElementById('dashActions');
  if (actions) {
    actions.addEventListener('click', function (e) {
      var btn = e.target.closest('.dash-action-btn');
      if (btn && btn.dataset.nav) navigateTo(btn.dataset.nav);
    });
  }

  var recent = document.getElementById('dashRecentConvs');
  if (recent) {
    recent.addEventListener('click', function (e) {
      var item = e.target.closest('.dash-conv-item');
      if (item && item.dataset.convId) {
        navigateTo('qa');
        setTimeout(function () { selectConversation(item.dataset.convId); }, 100);
      }
    });
  }
}

async function loadDashboard() {
  try {
    var statsData = await API.get('/api/stats');
    document.getElementById('dashDocCount').textContent = statsData.totalDocuments || 0;
    document.getElementById('dashChunkCount').textContent = statsData.totalChunks || 0;
    document.getElementById('sidebarDocCount').textContent = statsData.totalDocuments || '--';
  } catch (_) {}

  try {
    var convs = await API.get('/api/ask/conversations');
    var recent = document.getElementById('dashRecentConvs');
    var arr = convs.conversations || [];
    if (arr.length === 0) {
      recent.innerHTML = '<p class="dash-empty">尚无对话记录，开始一次智能问答吧</p>';
      return;
    }
    arr.sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
    var top5 = arr.slice(0, 5);
    recent.innerHTML = top5.map(function (c) {
      return '<div class="dash-conv-item" data-conv-id="' + escHTML(c.id) + '">' +
        '<span class="dash-conv-title">' + escHTML(c.title || '新对话') + '</span>' +
        '<span class="dash-conv-date">' + formatDate(c.updatedAt) + '</span>' +
        '</div>';
    }).join('');
  } catch (_) {}
}

// ===== Stats Page =====
async function loadStatsPage() {
  try {
    var data = await API.get('/api/stats/tokens');
    var input = data.inputTokens || 0;
    var output = data.outputTokens || 0;
    var total = input + output;
    var maxTokens = Math.max(input, output, 1);

    document.getElementById('statsInputTokens').textContent = formatTokens(input);
    document.getElementById('statsOutputTokens').textContent = formatTokens(output);
    document.getElementById('statsTotalTokens').textContent = formatTokens(total);
    document.getElementById('statsInputFill').style.width = Math.round(input / maxTokens * 100) + '%';
    document.getElementById('statsOutputFill').style.width = Math.round(output / maxTokens * 100) + '%';

    // Daily history
    var history = data.dailyHistory || [];
    var tbody = document.getElementById('dailyTableBody');
    if (history.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="4">暂无数据</td></tr>';
      return;
    }
    history.sort(function (a, b) { return b.date.localeCompare(a.date); });
    tbody.innerHTML = history.map(function (d) {
      var subtotal = (d.inputTokens || 0) + (d.outputTokens || 0);
      return '<tr>' +
        '<td>' + d.date + '</td>' +
        '<td>' + formatTokens(d.inputTokens || 0) + '</td>' +
        '<td>' + formatTokens(d.outputTokens || 0) + '</td>' +
        '<td><strong>' + formatTokens(subtotal) + '</strong></td>' +
        '</tr>';
    }).join('');
  } catch (_) {}
}

// ===== Token Header =====
function initTokenHeader() {
  var el = document.getElementById('headerTokens');
  if (el) {
    el.addEventListener('click', function () { navigateTo('stats'); });
    el.style.cursor = 'pointer';
    el.title = '跳转到使用统计';
  }
}

async function refreshTokenDisplay() {
  try {
    var data = await API.get('/api/stats/tokens');
    var total = (data.inputTokens || 0) + (data.outputTokens || 0);

    // Header display
    var headerVal = document.getElementById('headerTokenVal');
    if (headerVal) headerVal.textContent = formatTokens(total);

    // Also compute today's tokens for dashboard
    var history = data.dailyHistory || [];
    var today = new Date().toISOString().slice(0, 10);
    var todayEntry = history.find(function (d) { return d.date === today; });
    var todayTotal = 0;
    if (todayEntry) todayTotal = (todayEntry.inputTokens || 0) + (todayEntry.outputTokens || 0);
    var dashToday = document.getElementById('dashTokenToday');
    if (dashToday) dashToday.textContent = formatTokens(todayTotal);

    // Also update stats page if visible
    var statsTotal = document.getElementById('statsTotalTokens');
    if (statsTotal && statsTotal.textContent !== '--') loadStatsPage();
  } catch (_) {}
}

// ===== Helpers =====
function formatTokens(n) {
  if (n == null || isNaN(n)) return '--';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatDate(d) {
  if (!d) return '--';
  var dt = new Date(d);
  var now = new Date();
  if (dt.toDateString() === now.toDateString()) {
    return dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  return dt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// ===== Toast =====
function showToast(message, type) {
  var container = document.getElementById('toastContainer');
  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

// ===== Global exports =====
window.navigateTo = navigateTo;
window.formatTokens = formatTokens;
window.formatDate = formatDate;

// ===== Init Progress =====
function connectInitProgress() {
  var es = new EventSource('/api/init-progress');
  es.addEventListener('message', function (event) {
    try {
      var data = JSON.parse(event.data);
      if (data.type === 'progress') {
        var fill = document.getElementById('initProgressFill');
        var status = document.getElementById('initStatus');
        var detail = document.getElementById('initDetail');
        if (fill) fill.style.width = data.overall + '%';
        if (status) status.textContent = '正在下载模型文件... ' + data.overall + '%';
        if (detail && data.file) detail.textContent = '文件: ' + data.file;
      } else if (data.type === 'done') {
        hideInitOverlay();
        es.close();
      } else if (data.type === 'error') {
        var status = document.getElementById('initStatus');
        if (status) status.textContent = '初始化失败: ' + data.message;
      }
    } catch (_) {}
  });
}

function hideInitOverlay() {
  var overlay = document.getElementById('initOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s';
    setTimeout(function () { overlay.remove(); }, 400);
  }
}

document.addEventListener('DOMContentLoaded', initApp);
