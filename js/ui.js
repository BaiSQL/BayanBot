// Rendering helpers: formatting, chat rows, typing dots, view switching.

function fmt(t){
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
}

function stripSvg(t){
  const a = t.indexOf('<svg'), b = t.lastIndexOf('</svg>');
  return (a !== -1 && b > a) ? t.slice(0, a) + '[drawing]' + t.slice(b + 6) : t;
}

function renderBot(b, text){
  const start = text.indexOf('<svg'), end = text.lastIndexOf('</svg>');
  if(start === -1){ b.innerHTML = fmt(text); return; }
  if(end < start){
    b.textContent = (text.slice(0, start).replace(/```[a-z]*\s*$/i, '').trim() + "\n\n(Naputol ang drawing. Subukan ulit.)").trim();
    return;
  }
  let svg = text.slice(start, end + 6);
  if(!/xmlns=/.test(svg.slice(0, 300))) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const rest = (text.slice(0, start) + text.slice(end + 6)).replace(/```[a-z]*\s*```/gi, '').trim();
  b.innerHTML = rest ? fmt(rest) : '';
  const card = document.createElement('div');
  card.className = 'art';
  const img = document.createElement('img');
  img.alt = 'Drawing ng BayanBot';
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const dl = document.createElement('a');
  dl.className = 'dl';
  dl.textContent = 'Download SVG';
  dl.href = img.src;
  dl.download = 'bayanbot-drawing.svg';
  card.append(img, dl);
  b.appendChild(card);
}

function addRow(sender, text, isError){
  const w = $('welcome'); if(w) w.remove();
  const row = document.createElement('div');
  row.className = 'row ' + sender;
  if(sender === 'bot'){
    row.innerHTML = '<svg class="avatar"><use href="#mascot"/></svg>';
  }
  const b = document.createElement('div');
  b.className = 'bubble' + (isError ? ' error' : '');
  if(sender === 'bot' && !isError) renderBot(b, text); else b.textContent = text;
  row.appendChild(b);
  $('col').appendChild(row);
  if(sender === 'bot' && text && !isError) row.scrollIntoView({block:'start'});
  else $('stream').scrollTop = $('stream').scrollHeight;
  return row;
}

function setTyping(on){
  const old = $('typing'); if(old) old.remove();
  if(!on) return;
  const row = addRow('bot','');
  row.id = 'typing'; row.classList.add('typing');
  row.querySelector('.bubble').innerHTML = '<span class="dots"><span></span><span></span><span></span></span>';
}

function showView(v){
  view = v;
  $('chatView').style.display = v === 'chat' ? '' : 'none';
  $('studioView').style.display = v === 'image' ? '' : 'none';
  $('imgNav').classList.toggle('active', v === 'image');
  $('resetBtn').classList.toggle('active', v === 'chat' && !history.length);
}
