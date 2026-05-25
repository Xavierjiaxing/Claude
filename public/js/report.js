let currentReportMarkdown = '';

function initReportTab() {
  const genBtn = document.getElementById('generateReportBtn');
  const copyBtn = document.getElementById('copyReportBtn');
  const downloadBtn = document.getElementById('downloadReportBtn');

  if (genBtn) genBtn.addEventListener('click', generateReport);
  if (copyBtn) copyBtn.addEventListener('click', copyReport);
  if (downloadBtn) downloadBtn.addEventListener('click', downloadReport);

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

  outputDiv.classList.remove('hidden');
  reportBody.innerHTML = '<div class="report-loading">&#128260; 正在生成报告，请稍候...</div>';
  reportSources.innerHTML = '';
  genBtn.disabled = true;
  genBtn.textContent = '生成中...';

  try {
    const data = await API.post('/api/report', { type, title, focus });

    currentReportMarkdown = data.report;
    reportBody.innerHTML = marked.parse(data.report);

    if (data.sources && data.sources.length > 0) {
      reportSources.innerHTML = `<strong>&#128712; 参考文档：</strong>${data.sources.map((s) => escHTML(s)).join('、')}`;
    }
  } catch (err) {
    reportBody.innerHTML = `<div class="report-loading" style="color:var(--danger)">报告生成失败: ${escHTML(err.message)}</div>`;
  } finally {
    genBtn.disabled = false;
    genBtn.textContent = '生成报告';
  }
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

function escHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
