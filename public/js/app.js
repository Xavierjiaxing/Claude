function initApp() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      panels.forEach((p) => p.classList.remove('active'));
      const panel = document.getElementById('panel-' + tabName);
      if (panel) panel.classList.add('active');

      if (tabName === 'documents') refreshDocumentList();
      if (tabName === 'qa') refreshConvList();
      if (tabName === 'report') loadReportTypes();
    });
  });

  initDocumentsTab();
  initQATab();
  initReportTab();
  refreshDocumentList();
}

function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', initApp);
