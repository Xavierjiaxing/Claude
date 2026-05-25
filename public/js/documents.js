// Track selected document filePaths — persists across list refreshes
window.selectedFiles = new Set();

let docSearchQuery = '';
let docCurrentPage = 1;
let docSearchTimer = null;
let docSortBy = 'date';
let docSortDir = 'desc';
const DOC_PAGE_SIZE = 20;

function initDocumentsTab() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const refreshBtn = document.getElementById('refreshStatsBtn');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const selectAll = document.getElementById('selectAllDocs');
  const searchInput = document.getElementById('docSearchInput');
  const searchClear = document.getElementById('docSearchClear');

  if (!zone) return;

  zone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) uploadFiles(fileInput.files);
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) uploadFiles(files);
  });

  if (refreshBtn) refreshBtn.addEventListener('click', refreshDocumentList);
  if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', deleteSelectedDocuments);

  // Sortable column headers
  var sortHeaders = document.querySelectorAll('.doc-table th.sortable');
  sortHeaders.forEach(function (th) {
    th.addEventListener('click', function () {
      var sortKey = th.dataset.sort;
      if (docSortBy === sortKey) {
        docSortDir = docSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        docSortBy = sortKey;
        docSortDir = 'asc';
      }
      updateSortArrows(sortKey);
      docCurrentPage = 1;
      refreshDocumentList();
    });
  });

  // Search input with debounce
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const val = this.value.trim();
      if (searchClear) searchClear.classList.toggle('hidden', !val);

      clearTimeout(docSearchTimer);
      docSearchTimer = setTimeout(() => {
        docSearchQuery = val.toLowerCase();
        docCurrentPage = 1;
        refreshDocumentList();
      }, 300);
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        this.value = '';
        docSearchQuery = '';
        docCurrentPage = 1;
        if (searchClear) searchClear.classList.add('hidden');
        refreshDocumentList();
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      docSearchQuery = '';
      docCurrentPage = 1;
      searchClear.classList.add('hidden');
      refreshDocumentList();
    });
  }

  // Select-all checkbox
  if (selectAll) {
    selectAll.addEventListener('change', function () {
      const tbody = document.getElementById('docTableBody');
      if (!tbody) return;
      const checks = tbody.querySelectorAll('.doc-checkbox');
      checks.forEach((cb) => {
        cb.checked = this.checked;
        const fp = cb.dataset.sourceFile;
        if (this.checked) {
          window.selectedFiles.add(fp);
        } else {
          window.selectedFiles.delete(fp);
        }
      });
      updateDeleteSelectedBtn();
    });
  }

  // Event delegation for delete buttons and checkboxes
  var docTableBody = document.getElementById('docTableBody');
  if (docTableBody) {
    docTableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-btn');
      if (btn && btn.dataset.sourceFile) {
        deleteDocument(btn.dataset.sourceFile);
        return;
      }

      const cb = e.target.closest('.doc-checkbox');
      if (cb && cb.dataset.sourceFile) {
        if (cb.checked) {
          window.selectedFiles.add(cb.dataset.sourceFile);
        } else {
          window.selectedFiles.delete(cb.dataset.sourceFile);
        }
        const selectAllEl = document.getElementById('selectAllDocs');
        if (selectAllEl && !cb.checked) selectAllEl.checked = false;
        updateDeleteSelectedBtn();
      }
    });
  }

  // Pagination event delegation
  var pagBar = document.getElementById('paginationBar');
  if (pagBar) {
    pagBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.pagination-btn');
      if (!btn || btn.disabled) return;
      if (btn.dataset.page) {
        docCurrentPage = parseInt(btn.dataset.page);
        refreshDocumentList();
      }
    });
  }
}

async function uploadFiles(files) {
  const supported = ['pdf', 'docx', 'txt', 'md', 'svg', 'jpg', 'jpeg', 'png', 'bmp', 'webp'];
  const fileList = [];
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (supported.includes(ext)) {
      fileList.push(file);
    }
  }

  if (fileList.length === 0) {
    showToast('没有支持的文件类型。支持: PDF, DOCX, TXT, MD, JPG, PNG, BMP, WebP', 'error');
    return;
  }

  const progressDiv = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const progressFileList = document.getElementById('progressFileList');

  progressDiv.classList.remove('hidden');
  progressFill.style.width = '0%';
  progressText.textContent = `准备处理 ${fileList.length} 个文件...`;
  progressFileList.innerHTML = '';

  let doneCount = 0;

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];

    // Update progress bar: each file gets equal share
    const currentPct = Math.round((i / fileList.length) * 100);
    progressFill.style.width = currentPct + '%';
    progressText.textContent = `处理中 ${i + 1}/${fileList.length}：${file.name}`;

    // Update file list: files before current are pending/done, current is processing
    renderFileProgress(fileList, i, []);

    try {
      const formData = new FormData();
      formData.append('files', file);
      const result = await API.upload('/api/ingest', formData);
      if (result.chunks === 0) {
        renderFileProgress(fileList, i, [{ name: file.name, error: '未能提取内容' }]);
      } else {
        doneCount++;
        renderFileProgress(fileList, i + 1, []);
      }
    } catch (err) {
      renderFileProgress(fileList, i, [{ name: file.name, error: err.message }]);
    }
  }

  // All done
  progressFill.style.width = '100%';

  const errors = progressFileList.querySelectorAll('.progress-file-status.error');
  if (errors.length === 0) {
    progressText.textContent = `已完成！成功导入 ${doneCount} 个文件`;
    showToast(`成功导入 ${doneCount} 个文件`, 'success');
  } else if (doneCount > 0) {
    progressText.textContent = `部分完成：${doneCount}/${fileList.length} 个文件导入成功`;
    showToast(`${doneCount} 个成功，${fileList.length - doneCount} 个失败`, 'info');
  } else {
    progressText.textContent = '导入失败：所有文件均未能处理';
    showToast('导入失败，请检查文件内容', 'error');
  }

  refreshDocumentList();
  setTimeout(() => progressDiv.classList.add('hidden'), 3000);
}

function renderFileProgress(fileList, currentIdx, errorFiles) {
  const progressFileList = document.getElementById('progressFileList');
  const errorNames = new Set(errorFiles.map((e) => e.name));

  progressFileList.innerHTML = fileList.map((f, idx) => {
    let icon, statusClass, statusText;
    if (errorNames.has(f.name)) {
      icon = '❌'; statusClass = 'error'; statusText = '失败';
    } else if (idx < currentIdx) {
      icon = '✅'; statusClass = 'done'; statusText = '完成';
    } else if (idx === currentIdx) {
      icon = '⏳'; statusClass = 'processing'; statusText = '分析中...';
    } else {
      icon = '⬜'; statusClass = 'pending'; statusText = '等待';
    }
    return `<div class="progress-file-item">
      <span class="progress-file-icon">${icon}</span>
      <span class="progress-file-name" title="${escHTML(f.name)}">${escHTML(f.name)}</span>
      <span class="progress-file-status ${statusClass}">${statusText}</span>
    </div>`;
  }).join('');
}

function updateDeleteSelectedBtn() {
  const btn = document.getElementById('deleteSelectedBtn');
  if (!btn) return;
  if (window.selectedFiles.size > 0) {
    btn.classList.remove('hidden');
    btn.textContent = `删除选中 (${window.selectedFiles.size})`;
  } else {
    btn.classList.add('hidden');
  }
}

async function deleteSelectedDocuments() {
  const count = window.selectedFiles.size;
  if (count === 0) return;
  if (!confirm(`确定要删除选中的 ${count} 份文档吗？\n\n此操作不可恢复。`)) return;

  const files = Array.from(window.selectedFiles);
  let deleted = 0;

  for (const filePath of files) {
    try {
      await API.del('/api/documents', { sourceFile: filePath });
      window.selectedFiles.delete(filePath);
      deleted++;
    } catch (err) {
      showToast(`删除失败: ${err.message}`, 'error');
    }
  }

  if (deleted > 0) {
    showToast(`已删除 ${deleted} 份文档`, 'success');
  }
  updateDeleteSelectedBtn();
  refreshDocumentList();
}

async function refreshDocumentList() {
  try {
    var qs = '?page=' + docCurrentPage + '&pageSize=' + DOC_PAGE_SIZE;
    if (docSearchQuery) qs += '&search=' + encodeURIComponent(docSearchQuery);

    const [statsData, docsData] = await Promise.all([
      API.get('/api/stats'),
      API.get('/api/documents' + qs),
    ]);

    document.getElementById('statsDocs').textContent = statsData.totalDocuments;
    document.getElementById('statsChunks').textContent = statsData.totalChunks;

    var tbody = document.getElementById('docTableBody');
    var docs = docsData.documents || [];

    if (docs.length === 0) {
      var emptyMsg = docSearchQuery ? '未找到匹配 " ' + escHTML(docSearchQuery) + ' " 的文档' : '暂无文档，请上传文件';
      tbody.innerHTML = '<tr class="empty-row"><td colspan="6">' + emptyMsg + '</td></tr>';
      renderPagination(0, 1, 0);
      return;
    }

    // Client-side sort
    docs.sort(function (a, b) {
      var va, vb;
      if (docSortBy === 'name') { va = (a.fileName || '').toLowerCase(); vb = (b.fileName || '').toLowerCase(); }
      else if (docSortBy === 'type') { va = (a.fileType || '').toLowerCase(); vb = (b.fileType || '').toLowerCase(); }
      else { va = a.ingestedAt || ''; vb = b.ingestedAt || ''; }
      var cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return docSortDir === 'asc' ? cmp : -cmp;
    });

    var allChecked = docs.every(function (d) { return window.selectedFiles.has(d.filePath); });

    tbody.innerHTML = docs
      .map(function (doc) {
        var ext = (doc.fileType || '').replace('.', '').toLowerCase();
        var date = doc.ingestedAt
          ? new Date(doc.ingestedAt).toLocaleString('zh-CN')
          : '--';
        var checked = window.selectedFiles.has(doc.filePath) ? ' checked' : '';
        return '<tr>' +
          '<td><input type="checkbox" class="doc-checkbox" data-source-file="' + escHTML(doc.filePath) + '"' + checked + '></td>' +
          '<td title="' + escHTML(doc.filePath) + '">' + escHTML(doc.fileName) + '</td>' +
          '<td><span class="file-type-badge ' + ext + '">' + (ext || '--') + '</span></td>' +
          '<td>' + doc.chunkCount + '</td>' +
          '<td>' + date + '</td>' +
          '<td><button class="delete-btn" data-source-file="' + escHTML(doc.filePath) + '">删除</button></td>' +
          '</tr>';
      })
      .join('');

    var selectAllEl = document.getElementById('selectAllDocs');
    if (selectAllEl) selectAllEl.checked = allChecked;
    updateDeleteSelectedBtn();

    renderPagination(docsData.total, docsData.page, docsData.totalPages);
  } catch (err) {
    console.error('Error refreshing doc list:', err);
  }
}

function renderPagination(total, page, totalPages) {
  var bar = document.getElementById('paginationBar');
  if (!bar) return;

  if (totalPages <= 1) {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }

  bar.classList.remove('hidden');

  var html = '';
  html += '<button class="pagination-btn" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>上一页</button>';
  html += '<span class="pagination-info">第 ' + page + ' / ' + totalPages + ' 页 (共 ' + total + ' 份文档)</span>';
  html += '<button class="pagination-btn" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>下一页</button>';
  bar.innerHTML = html;
}

function updateSortArrows(activeKey) {
  var headers = document.querySelectorAll('.doc-table th.sortable');
  headers.forEach(function (th) {
    var arrow = th.querySelector('.sort-arrow');
    if (!arrow) return;
    if (th.dataset.sort === activeKey) {
      arrow.className = 'sort-arrow ' + docSortDir;
    } else {
      arrow.className = 'sort-arrow';
    }
  });
}

async function deleteDocument(sourceFile) {
  if (!confirm(`确定要删除此文档吗？\n\n${sourceFile}`)) return;
  try {
    await API.del('/api/documents', { sourceFile });
    window.selectedFiles.delete(sourceFile);
    showToast('文档已删除', 'success');
    refreshDocumentList();
  } catch (err) {
    showToast('删除失败: ' + err.message, 'error');
  }
}

window.deleteDocument = deleteDocument;
