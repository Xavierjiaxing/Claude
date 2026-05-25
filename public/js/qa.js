let currentConvId = null;
let isStreaming = false;
let streamAbortController = null;

function initQATab() {
  var newBtn = document.getElementById('newConvBtn');
  var sendBtn = document.getElementById('sendBtn');
  var stopBtn = document.getElementById('stopBtn');
  var chatInput = document.getElementById('chatInput');
  var searchInput = document.getElementById('convSearchInput');
  var toReportBtn = document.getElementById('qaToReportBtn');

  if (newBtn) newBtn.addEventListener('click', function () {
    currentConvId = null;
    document.getElementById('chatArea').innerHTML = '<div class="chat-welcome"><span class="welcome-icon">&#129302;</span><h3>新对话已开始</h3><p>在下方输入您的问题</p></div>';
    document.getElementById('convSearchInput').value = '';
    refreshConvList();
  });

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (stopBtn) stopBtn.addEventListener('click', stopStreaming);
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Conversation search
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      refreshConvList();
    });
  }

  // "Generate report" button from current conversation
  if (toReportBtn) {
    toReportBtn.addEventListener('click', function () {
      if (currentConvId && typeof navigateTo === 'function') {
        navigateTo('report');
      }
    });
  }
}

async function sendMessage() {
  if (isStreaming) return;
  const chatInput = document.getElementById('chatInput');
  const question = chatInput.value.trim();
  if (!question) return;

  const chatArea = document.getElementById('chatArea');
  const sendBtn = document.getElementById('sendBtn');
  const stopBtn = document.getElementById('stopBtn');
  chatInput.value = '';
  chatInput.disabled = true;
  isStreaming = true;
  sendBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');

  const welcome = chatArea.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  addUserBubble(chatArea, question);
  const assistantBubble = addAssistantBubble(chatArea);
  const bubbleContent = assistantBubble.querySelector('.bubble-content');

  let rawText = '';

  streamAbortController = new AbortController();

  API.stream(
    '/api/ask',
    { question, conversationId: currentConvId, stream: true },
    (chunk) => {
      rawText += chunk;
      bubbleContent.textContent = rawText;
      chatArea.scrollTop = chatArea.scrollHeight;
    },
    (sources, chunks, convId) => {
      currentConvId = convId;
      bubbleContent.innerHTML = marked.parse(rawText);

      const loadingIndicator = assistantBubble.querySelector('.chat-loading');
      if (loadingIndicator) loadingIndicator.remove();

      if (chunks && chunks.length > 0) {
        assistantBubble.appendChild(buildChunkCards(chunks));
      } else if (sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'chat-sources';
        const fileList = sources.map((s) => `<span>&#128196; ${escHTML(s)}</span>`).join(' &nbsp;');
        sourcesDiv.innerHTML = `
          <button class="chat-sources-toggle" onclick="toggleSources(this)">&#128712; 参考文档 (${sources.length})</button>
          <div class="chat-sources-list">${fileList}</div>
        `;
        assistantBubble.appendChild(sourcesDiv);
      }

      finishStream();
    },
    (errMsg) => {
      bubbleContent.textContent = '抱歉，请求失败: ' + errMsg;
      finishStream();
    },
    streamAbortController.signal
  );
}

function stopStreaming() {
  if (streamAbortController) {
    streamAbortController.abort();
    streamAbortController = null;
  }
  finishStream();
}

function finishStream() {
  isStreaming = false;
  streamAbortController = null;
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const stopBtn = document.getElementById('stopBtn');
  if (chatInput) chatInput.disabled = false;
  if (chatInput) chatInput.focus();
  if (sendBtn) sendBtn.classList.remove('hidden');
  if (stopBtn) stopBtn.classList.add('hidden');
  refreshConvList();
  if (typeof refreshTokenDisplay === 'function') refreshTokenDisplay();
}

function addUserBubble(chatArea, text) {
  const div = document.createElement('div');
  div.className = 'chat-message user';
  div.innerHTML = `<div class="chat-message-label">您</div><div class="chat-bubble">${escHTML(text)}</div>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function addAssistantBubble(chatArea) {
  const div = document.createElement('div');
  div.className = 'chat-message assistant';
  div.innerHTML = `
    <div class="chat-message-label">AI 助手</div>
    <div class="chat-bubble bubble-content chat-loading">
      <span></span><span></span><span></span>
    </div>`;
  chatArea.appendChild(div);
  return div;
}

function toggleSources(btn) {
  // Try direct sibling first (for chat sources), then parent's sibling (for chunk cards)
  let list = btn.nextElementSibling;
  if (!list && btn.parentElement) {
    list = btn.parentElement.nextElementSibling;
  }
  if (list) list.classList.toggle('open');
}

async function refreshConvList() {
  try {
    var data = await API.get('/api/ask/conversations');
    var list = document.getElementById('convList');
    var convs = data.conversations || [];

    // Search filter
    var query = document.getElementById('convSearchInput');
    if (query && query.value.trim()) {
      var q = query.value.trim().toLowerCase();
      convs = convs.filter(function (c) {
        return (c.title || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    // Show/hide "generate report" button
    var toReportBtn = document.getElementById('qaToReportBtn');
    if (toReportBtn) {
      toReportBtn.classList.toggle('hidden', !currentConvId || isStreaming);
    }

    if (convs.length === 0) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:#9aa0a6;font-size:13px;">' + (query && query.value.trim() ? '未找到匹配的对话' : '暂无对话') + '</div>';
      return;
    }

    list.innerHTML = convs
      .map(function (c) {
        var activeClass = c.id === currentConvId ? ' active' : '';
        var title = escHTML(c.title || '新对话');
        return '<div class="conv-item' + activeClass + '" data-conv-id="' + c.id + '">' +
          '<span class="conv-item-title" onclick="selectConversation(\'' + c.id + '\')">' + title + '</span>' +
          '<span class="conv-item-delete" onclick="deleteConversation(event, \'' + c.id + '\')">&times;</span>' +
          '</div>';
      })
      .join('');
  } catch (err) {
    console.error('Error refreshing conv list:', err);
  }
}

async function selectConversation(id) {
  try {
    const data = await API.get('/api/ask/conversations');
    const conv = (data.conversations || []).find((c) => c.id === id);
    if (!conv) return;

    currentConvId = id;
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '';

    conv.messages.forEach((msg) => {
      const div = document.createElement('div');
      div.className = 'chat-message ' + msg.role;
      div.innerHTML = `
        <div class="chat-message-label">${msg.role === 'user' ? '您' : 'AI 助手'}</div>
        <div class="chat-bubble">${marked.parse(msg.content)}</div>
      `;
      if (msg.chunks && msg.chunks.length > 0) {
        div.appendChild(buildChunkCards(msg.chunks));
      } else if (msg.sources && msg.sources.length > 0) {
        const fileList = msg.sources.map((s) => `<span>&#128196; ${escHTML(s)}</span>`).join(' &nbsp;');
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-sources';
        wrapper.innerHTML = `
          <button class="chat-sources-toggle" onclick="toggleSources(this)">&#128712; 参考文档 (${msg.sources.length})</button>
          <div class="chat-sources-list">${fileList}</div>`;
        div.appendChild(wrapper);
      }
      chatArea.appendChild(div);
    });

    chatArea.scrollTop = chatArea.scrollHeight;
    refreshConvList();
  } catch (err) {
    showToast('加载对话失败: ' + err.message, 'error');
  }
}

async function deleteConversation(event, id) {
  event.stopPropagation();
  if (!confirm('确定要删除此对话吗？')) return;
  try {
    await API.del('/api/ask/conversations/' + id);
    if (currentConvId === id) {
      currentConvId = null;
      document.getElementById('chatArea').innerHTML = `<div class="chat-welcome">
        <span class="welcome-icon">&#129302;</span>
        <h3>对话已删除</h3>
        <p>在下方输入您的问题开始新对话</p>
      </div>`;
    }
    refreshConvList();
    showToast('对话已删除', 'success');
  } catch (err) {
    showToast('删除失败: ' + err.message, 'error');
  }
}

function buildChunkCards(chunks) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chunk-cards';

  const header = document.createElement('div');
  header.className = 'chunk-cards-header';
  header.innerHTML = `<button class="chat-sources-toggle" onclick="toggleSources(this)">&#128269; 检索到的文档片段 (${chunks.length})</button>`;
  wrapper.appendChild(header);

  const list = document.createElement('div');
  list.className = 'chunk-cards-list';

  chunks.forEach((c, i) => {
    const barClass = c.score >= 0.7 ? 'high' : c.score >= 0.4 ? 'mid' : 'low';
    const card = document.createElement('div');
    card.className = 'chunk-card';
    card.innerHTML = `
      <div class="chunk-card-header">
        <span class="chunk-card-index">#${i + 1}</span>
        <span class="chunk-card-file">&#128196; ${escHTML(c.sourceFile)}</span>
        <span class="chunk-card-score ${barClass}">相关度 ${Math.round(c.score * 100)}%</span>
      </div>
      <div class="chunk-card-text">${escHTML(c.text)}</div>
    `;
    list.appendChild(card);
  });

  wrapper.appendChild(list);
  return wrapper;
}

window.selectConversation = selectConversation;
window.deleteConversation = deleteConversation;
window.toggleSources = toggleSources;
window.refreshConvList = refreshConvList;
window.buildChunkCards = buildChunkCards;
