let currentReportMarkdown = '';
let reportAbortController = null;

function initReportTab() {
  const genBtn = document.getElementById('generateReportBtn');
  const stopBtn = document.getElementById('stopReportBtn');
  const copyBtn = document.getElementById('copyReportBtn');
  const downloadBtn = document.getElementById('downloadReportBtn');
  const typeSelect = document.getElementById('reportType');

  if (genBtn) genBtn.addEventListener('click', generateReport);
  if (stopBtn) stopBtn.addEventListener('click', stopReport);
  if (copyBtn) copyBtn.addEventListener('click', copyReport);
  if (downloadBtn) downloadBtn.addEventListener('click', downloadReport);

  if (typeSelect) {
    typeSelect.addEventListener('change', function () {
      var titleInput = document.getElementById('reportTitle');
      var focusInput = document.getElementById('reportFocus');
      if (this.value === 'sop-version-compare') {
        if (titleInput) titleInput.placeholder = '输入 SOP 文件编号或名称关键词，如：SOP-XXX-001';
        if (focusInput) focusInput.placeholder = '可选：指定对比重点，如：工艺参数变化、检测标准变更';
      } else {
        if (titleInput) titleInput.placeholder = '例如：B20260312 批次滴斗歪斜 CAPA 报告';
        if (focusInput) focusInput.placeholder = '描述你希望报告重点分析的方向...';
      }
    });
  }

  // Form collapse toggle
  var formToggle = document.getElementById('reportFormToggle');
  if (formToggle) {
    formToggle.addEventListener('click', function () {
      var form = document.getElementById('reportForm');
      if (form) {
        form.classList.toggle('collapsed');
        formToggle.textContent = form.classList.contains('collapsed') ? '+' : '−';
      }
    });
  }

  loadReportTypes();
}

async function loadReportTypes() {
  try {
    const data = await API.get('/api/report/types');
    const select = document.getElementById('reportType');
    if (!select) return;
    select.innerHTML = '<option value="">-- 请选择 --</option>';
    (data.types || []).forEach((t) => {
      select.innerHTML += `<option value="${t.type}">${t.name} — ${t.description}</option>`;
    });
  } catch (err) {
    console.error('Error loading report types:', err);
  }
}

async function generateReport() {
  const type = document.getElementById('reportType').value;
  const title = document.getElementById('reportTitle').value.trim();
  const focus = document.getElementById('reportFocus').value.trim();

  if (!type) {
    showToast('请选择报告类型', 'error');
    return;
  }

  const outputDiv = document.getElementById('reportOutput');
  const reportBody = document.getElementById('reportBody');
  const reportSources = document.getElementById('reportSources');
  const genBtn = document.getElementById('generateReportBtn');
  const stopBtn = document.getElementById('stopReportBtn');

  outputDiv.classList.remove('hidden');
  reportBody.innerHTML = '<div class="report-loading">&#128260; 正在生成报告，请稍候...</div>';
  reportSources.innerHTML = '';
  genBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');

  const reqBody = { type, title, focus, stream: true };
  if (window.selectedFiles && window.selectedFiles.size > 0) {
    reqBody.sourceFiles = Array.from(window.selectedFiles);
  }

  currentReportMarkdown = '';
  reportAbortController = new AbortController();

  API.stream('/api/report', reqBody,
    function (text) {
      currentReportMarkdown += text;
      reportBody.innerHTML = marked.parse(currentReportMarkdown);
    },
    function (sources) {
      if (sources && sources.length > 0) {
        reportSources.innerHTML = `<strong>&#128712; 参考文档：</strong>${sources.map((s) => escHTML(s)).join('、')}`;
      }
      finishReport();
      showToast('报告生成完成', 'success');
    },
    function (errMsg) {
      if (!currentReportMarkdown) {
        reportBody.innerHTML = `<div class="report-loading" style="color:var(--danger)">报告生成失败: ${escHTML(errMsg)}</div>`;
      }
      finishReport();
    },
    reportAbortController.signal
  );
}

function stopReport() {
  if (reportAbortController) {
    reportAbortController.abort();
    reportAbortController = null;
  }
  finishReport();
}

function finishReport() {
  reportAbortController = null;
  var genBtn = document.getElementById('generateReportBtn');
  var stopBtn = document.getElementById('stopReportBtn');
  if (genBtn) genBtn.classList.remove('hidden');
  if (stopBtn) stopBtn.classList.add('hidden');

  // Auto-collapse form after generation completes
  var form = document.getElementById('reportForm');
  var toggle = document.getElementById('reportFormToggle');
  if (form && !form.classList.contains('collapsed')) {
    form.classList.add('collapsed');
    if (toggle) toggle.textContent = '+';
  }

  if (typeof refreshTokenDisplay === 'function') refreshTokenDisplay();
}

function copyReport() {
  if (!currentReportMarkdown) {
    showToast('没有可复制的内容', 'info');
    return;
  }
  navigator.clipboard.writeText(currentReportMarkdown)
    .then(() => showToast('已复制到剪贴板', 'success'))
    .catch(() => showToast('复制失败，请手动选择复制', 'error'));
}

function downloadReport() {
  if (!currentReportMarkdown) {
    showToast('没有可下载的内容', 'info');
    return;
  }
  const title = document.getElementById('reportTitle').value.trim() || '报告';
  const blob = new Blob([currentReportMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('下载完成', 'success');
}

