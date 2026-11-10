// Event listeners and startup. Loaded last.

$('stream').addEventListener('scroll', () => {
  const s = $('stream');
  $('jump').classList.toggle('show', s.scrollHeight - s.scrollTop - s.clientHeight > 160);
});
$('jump').addEventListener('click', () => {
  $('stream').scrollTo({top:$('stream').scrollHeight, behavior:'smooth'});
});

$('keyBtn').addEventListener('click', () => {
  const val = $('keyInput').value.trim();
  if(val.length < 20 || /\s/.test(val)){
    addRow('bot','Mukhang mali ang key. Check kung kumpleto at walang space.', true);
    return;
  }
  apiKey = val;
  $('keyInput').value = '';
  $('sendBtn').disabled = false;
  $('rail').classList.add('on');
  $('userInput').focus();
});

$('col').addEventListener('click', e => {
  const s = e.target.closest('.starter');
  if(!s) return;
  $('userInput').value = s.lastChild.textContent;
  sendMessage();
});

$('resetBtn').addEventListener('click', () => {
  if(busy) return;
  showView('chat');
  if(history.length){ newChat(); renderChat(); }
  renderHist();
  $('userInput').focus();
});

$('histList').addEventListener('click', e => {
  const row = e.target.closest('.hitem');
  if(!row || busy) return;
  const id = Number(row.dataset.id);
  if(e.target.closest('.hdel')){
    chats = chats.filter(c => c.id !== id);
    saveChats();
    if(current.id === id){ newChat(); renderChat(); }
    renderHist();
    return;
  }
  openChat(id);
});

$('imgNav').addEventListener('click', () => {
  if(busy) return;
  showView('image'); renderGallery(); renderHist();
  $('imgPrompt').focus();
});
$('imgBtn').addEventListener('click', createImage);
$('imgPrompt').addEventListener('keydown', e => { if(e.key === 'Enter') createImage(); });

$('sendBtn').addEventListener('click', sendMessage);
$('userInput').addEventListener('keydown', e => { if(e.key === 'Enter') sendMessage(); });

loadImages();
loadChats(); newChat(); renderHist();
