let currentConvId = null;
let isStreaming = false;

function initQATab() {
  const newBtn = document.getElementById('newConvBtn');
  const sendBtn = document.getElementById('sendBtn');
  const chatInput = document.getElementById('chatInput');

  if (newBtn) newBtn.addEventListener('click', () => {
    currentConvId = null;
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = `<div class="chat-welcome">
      <span class="welcome-icon">&#129302;</span>
      <h3>新对话已开始</h3>
      <p>在下方输入您的问题</p>
    </div>`;
    refreshConvList();
  });

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
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
  chatInput.value = '';
  chatInput.disabled = true;
  isStreaming = true;

  const welcome = chatArea.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  addUserBubble(chatArea, question);
  const assistantBubble = addAssistantBubble(chatArea);
  const bubbleContent = assistantBubble.querySelector('.bubble-content');

  API.stream(
    '/api/ask',
    { question, conversationId: currentConvId, stream: true },
    (chunk) => {
      bubbleContent.textContent += chunk;
      bubbleContent.innerHTML = marked.parse(bubbleContent.textContent);
      chatArea.scrollTop = chatArea.scrollHeight;
    },
    (sources, convId) => {
      currentConvId = convId;
      bubbleContent.innerHTML = marked.parse(bubbleContent.textContent);

      const loadingIndicator = assistantBubble.querySelector('.chat-loading');
      if (loadingIndicator) loadingIndicator.remove();

      if (sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'chat-sources';
        const fileList = sources.map((s) => `<span>&#128196; ${escHTML(s)}</span>`).join(' &nbsp;');
        sourcesDiv.innerHTML = `
          <button class="chat-sources-toggle" onclick="toggleSources(this)">&#128712; 参考文档 (${sources.length})</button>
          <div class="chat-sources-list">${fileList}</div>
        `;
        assistantBubble.appendChild(sourcesDiv);
      }

      isStreaming = false;
      chatInput.disabled = false;
      chatInput.focus();
      chatArea.scrollTop = chatArea.scrollHeight;
      refreshConvList();
    },
    (errMsg) => {
      bubbleContent.textContent = '抱歉，请求失败: ' + errMsg;
      isStreaming = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  );
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
  const list = btn.nextElementSibling;
  if (list) list.classList.toggle('open');
}

async function refreshConvList() {
  try {
    const data = await API.get('/api/ask/conversations');
    const list = document.getElementById('convList');
    const convs = data.conversations || [];

    if (convs.length === 0) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:#9aa0a6;font-size:13px;">暂无对话</div>';
      return;
    }

    list.innerHTML = convs
      .map((c) => {
        const activeClass = c.id === currentConvId ? ' active' : '';
        const title = escHTML(c.title || '新对话');
        return `<div class="conv-item${activeClass}" data-conv-id="${c.id}">
          <span class="conv-item-title" onclick="selectConversation('${c.id}')">${title}</span>
          <span class="conv-item-delete" onclick="deleteConversation(event, '${c.id}')">&times;</span>
        </div>`;
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
      if (msg.sources && msg.sources.length > 0) {
        const fileList = msg.sources.map((s) => `<span>&#128196; ${escHTML(s)}</span>`).join(' &nbsp;');
        div.innerHTML += `
          <div class="chat-sources">
            <button class="chat-sources-toggle" onclick="toggleSources(this)">&#128712; 参考文档 (${msg.sources.length})</button>
            <div class="chat-sources-list">${fileList}</div>
          </div>`;
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

function escHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.selectConversation = selectConversation;
window.deleteConversation = deleteConversation;
window.toggleSources = toggleSources;
window.refreshConvList = refreshConvList;
