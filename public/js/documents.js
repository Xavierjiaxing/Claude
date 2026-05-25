function initDocumentsTab() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const refreshBtn = document.getElementById('refreshStatsBtn');

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

  // Event delegation for delete buttons — avoids path escaping issues in inline onclick
  const docTable = document.getElementById('docTableBody');
  if (docTable) {
    docTable.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-btn');
      if (btn && btn.dataset.sourceFile) {
        deleteDocument(btn.dataset.sourceFile);
      }
    });
  }
}

function uploadFiles(files) {
  const formData = new FormData();
  const supported = ['pdf', 'docx', 'txt', 'md', 'jpg', 'jpeg', 'png', 'bmp', 'webp'];
  let count = 0;

  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (supported.includes(ext)) {
      formData.append('files', file);
      count++;
    }
  }

  if (count === 0) {
    showToast('没有支持的文件类型。支持: PDF, DOCX, TXT, MD', 'error');
    return;
  }

  const progressDiv = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  progressDiv.classList.remove('hidden');
  progressFill.style.width = '0%';
  progressText.textContent = '上传中...';

  API.upload('/api/ingest', formData, (pct) => {
    progressFill.style.width = pct + '%';
    progressText.textContent = `上传中... ${pct}%`;
  })
    .then((result) => {
      if (result.chunks === 0) {
        progressText.textContent = '导入失败：未能从文件中提取文本内容。PDF 可能是扫描件或图片格式。';
        showToast('未能提取文本，请确认文件内容为可读文本格式', 'error');
      } else {
        progressText.textContent = `已完成！导入 ${result.files} 个文件，${result.chunks} 个片段`;
        showToast(`成功导入 ${result.files} 个文件`, 'success');
        refreshDocumentList();
      }
      setTimeout(() => progressDiv.classList.add('hidden'), 2000);
    })
    .catch((err) => {
      progressText.textContent = `导入失败: ${err.message}`;
      showToast('导入失败: ' + err.message, 'error');
    });
}

async function refreshDocumentList() {
  try {
    const [statsData, docsData] = await Promise.all([
      API.get('/api/stats'),
      API.get('/api/documents'),
    ]);

    document.getElementById('statsDocs').textContent = statsData.totalDocuments;
    document.getElementById('statsChunks').textContent = statsData.totalChunks;

    const tbody = document.getElementById('docTableBody');
    const docs = docsData.documents || [];

    if (docs.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="5">暂无文档，请上传文件</td></tr>';
      return;
    }

    tbody.innerHTML = docs
      .map((doc) => {
        const ext = (doc.fileType || '').replace('.', '').toLowerCase();
        const date = doc.ingestedAt
          ? new Date(doc.ingestedAt).toLocaleString('zh-CN')
          : '--';
        return `<tr>
          <td title="${esc(doc.filePath)}">${esc(doc.fileName)}</td>
          <td><span class="file-type-badge ${ext}">${ext || '--'}</span></td>
          <td>${doc.chunkCount}</td>
          <td>${date}</td>
          <td><button class="delete-btn" data-source-file="${esc(doc.filePath)}">删除</button></td>
        </tr>`;
      })
      .join('');
  } catch (err) {
    console.error('Error refreshing doc list:', err);
  }
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function deleteDocument(sourceFile) {
  if (!confirm(`确定要删除此文档吗？\n\n${sourceFile}`)) return;
  try {
    await API.del('/api/documents', { sourceFile });
    showToast('文档已删除', 'success');
    refreshDocumentList();
  } catch (err) {
    showToast('删除失败: ' + err.message, 'error');
  }
}

window.deleteDocument = deleteDocument;
