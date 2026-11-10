// Chat: sending messages, saved chats, sidebar history.

function trimmed(){
  const m = history.slice(-16);
  while(m.length && m[0].role !== 'user') m.shift();
  return m;
}

async function sendMessage(){
  const input = $('userInput');
  const text = input.value.trim();
  if(!text) return;
  if(!apiKey){
    addRow('bot','Paste muna ang API key mo sa left, tapos click ang Connect.', true);
    return;
  }

  busy = true;
  if(!chats.includes(current)) chats.unshift(current);
  if(!current.messages.length) current.title = text.slice(0, 32);
  addRow('user', text);
  history.push({ role:'user', content:text });
  renderHist();
  input.value = '';
  $('sendBtn').disabled = true;
  setTyping(true);

  try{
    const MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.8-flash"];
    const contents = trimmed().map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.role === 'assistant' ? stripSvg(m.content) : m.content }]
    }));
    let response, data;
    const idxs = MODELS.map((m, i) => i);
    const order = idxs.slice(modelIdx).concat(idxs.slice(0, modelIdx));
    for(const i of order){
      const model = MODELS[i];
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-goog-api-key":apiKey },
        body:JSON.stringify({
          systemInstruction:{ parts:[{ text:SYSTEM_PROMPT }] },
          contents,
          generationConfig:{ maxOutputTokens:16384, thinkingConfig:{ thinkingLevel:THINKING_LEVEL } }
        })
      });
      data = await response.json();
      const errText = (data.error && data.error.message) || '';
      const skip = response.status === 404 || response.status === 429 || /no longer available|not found|not supported/i.test(errText);
      if(!skip){ modelIdx = i; break; }
    }
    setTyping(false);

    if(!response.ok){
      history.pop();
      let msg = (data.error && data.error.message) ? data.error.message : "Unknown error";
      if(response.status === 429) msg = "Naabot na ang free limit ng lahat ng Gemini models na sinubukan. Wait ng mga 1 minuto, tapos try ulit. (" + msg.slice(0, 140) + ")";
      else if((response.status === 400 || response.status === 403) && /API key/i.test(msg)) msg = "Mali o invalid ang API key. Gumawa ng bago sa Google AI Studio.";
      addRow('bot','May error sa API: ' + msg, true);
    }else{
      const cand = data.candidates && data.candidates[0];
      const parts = (cand && cand.content && cand.content.parts) || [];
      const reply = parts.filter(p => p.text && !p.thought).map(p => p.text).join('\n').trim();
      if(!reply){
        history.pop();
        const blocked = data.promptFeedback && data.promptFeedback.blockReason;
        addRow('bot', blocked ? "Na-block ng safety filter ang message na iyon. Try mong i-rephrase." : "Walang response. Try ulit.", true);
      }else{
        addRow('bot', reply);
        history.push({ role:'assistant', content:reply });
      }
    }
  }catch(err){
    setTyping(false);
    history.pop();
    addRow('bot','Hindi maka-connect sa Gemini. Check ang internet at API key mo.', true);
    console.error(err);
  }finally{
    busy = false;
    if(!current.messages.length) chats = chats.filter(c => c !== current);
    current.updated = Date.now();
    saveChats(); renderHist();
    $('sendBtn').disabled = !apiKey;
    input.focus();
  }
}

const WELCOME_HTML = $('welcome').outerHTML;

function loadChats(){
  try{ chats = JSON.parse(localStorage.getItem(STORE)) || []; }catch(e){ chats = []; }
}
function saveChats(){
  chats = chats.slice(0, 30);
  try{ localStorage.setItem(STORE, JSON.stringify(chats)); }catch(e){}
}
function newChat(){
  current = { id: Date.now(), title: 'New chat', messages: [], updated: Date.now() };
  history = current.messages;
}

function renderChat(){
  $('col').innerHTML = '';
  if(!history.length){ $('col').innerHTML = WELCOME_HTML; }
  else history.forEach(m => addRow(m.role === 'user' ? 'user' : 'bot', m.content));
  $('stream').scrollTop = $('stream').scrollHeight;
}

function renderHist(){
  $('resetBtn').classList.toggle('active', view === 'chat' && !history.length);
  const list = $('histList');
  list.innerHTML = '';
  if(!chats.length){ list.innerHTML = '<div class="hempty">Wala pang saved chats. Naka-save dito sa device mo ang mga usapan.</div>'; return; }
  chats.slice().sort((a, b) => b.updated - a.updated).forEach(c => {
    const row = document.createElement('div');
    row.className = 'hitem' + (c === current ? ' active' : '');
    row.dataset.id = c.id;
    const t = document.createElement('button');
    t.className = 'htitle'; t.textContent = c.title; t.title = c.title;
    const d = document.createElement('button');
    d.className = 'hdel'; d.textContent = '\u00D7'; d.title = 'Delete chat'; d.setAttribute('aria-label', 'Delete chat');
    row.append(t, d);
    list.appendChild(row);
  });
}

function openChat(id){
  const c = chats.find(x => x.id === id);
  if(!c) return;
  current = c; history = c.messages;
  showView('chat');
  renderChat(); renderHist();
  $('userInput').focus();
}
