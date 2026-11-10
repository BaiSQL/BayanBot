// Create image: gallery and SVG drawing generation.

function loadImages(){ try{ images = JSON.parse(localStorage.getItem(IMG_STORE)) || []; }catch(e){ images = []; } }
function saveImages(){
  images = images.slice(0, 24);
  try{ localStorage.setItem(IMG_STORE, JSON.stringify(images)); }catch(e){}
}
function svgUrl(svg){ return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

function renderGallery(){
  const g = $('gallery');
  g.innerHTML = '';
  if(!images.length){ g.innerHTML = '<div class="gempty">Wala ka pang drawing. I-type sa taas kung ano ang gusto mong iguhit.</div>'; return; }
  images.forEach(it => {
    const card = document.createElement('div');
    card.className = 'gcard';
    const img = document.createElement('img');
    img.src = svgUrl(it.svg); img.alt = it.prompt;
    const cap = document.createElement('div');
    cap.className = 'gcap'; cap.textContent = it.prompt;
    const row = document.createElement('div');
    row.className = 'gact';
    const dl = document.createElement('a');
    dl.textContent = 'Download'; dl.href = img.src; dl.download = 'bayanbot-drawing.svg';
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', () => { images = images.filter(x => x.id !== it.id); saveImages(); renderGallery(); });
    row.append(dl, del);
    card.append(img, cap, row);
    g.appendChild(card);
  });
}

async function createImage(){
  const input = $('imgPrompt');
  const prompt = input.value.trim();
  const st = $('imgStatus');
  if(!prompt) return;
  if(!apiKey){ st.className = 'imgstatus err'; st.textContent = 'I-connect muna ang API key mo sa sidebar.'; return; }
  $('imgBtn').disabled = true;
  st.className = 'imgstatus'; st.textContent = 'Gumuguhit...';
  try{
    const { response, data } = await callGemini(IMG_SYSTEM, [{ role:'user', parts:[{ text:prompt }] }], THINKING_LEVEL);
    if(!response.ok){
      let msg = (data.error && data.error.message) || 'Unknown error';
      if(response.status === 429) msg = 'Naabot na ang free limit. Wait ng mga 1 minuto, tapos try ulit.';
      throw new Error(msg);
    }
    const cand = data.candidates && data.candidates[0];
    const parts = (cand && cand.content && cand.content.parts) || [];
    const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('\n');
    const a = text.indexOf('<svg'), b = text.lastIndexOf('</svg>');
    if(a === -1) throw new Error('Walang nagawang drawing. Subukan ulit o gawing mas malinaw ang hiling.');
    if(b < a) throw new Error('Naputol ang drawing. Subukan ulit.');
    let svg = text.slice(a, b + 6);
    if(!/xmlns=/.test(svg.slice(0, 300))) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    images.unshift({ id: Date.now(), prompt, svg });
    saveImages(); renderGallery();
    st.textContent = 'Tapos na! Nasa unahan ng listahan ang bagong drawing.';
    input.value = '';
  }catch(err){
    st.className = 'imgstatus err';
    st.textContent = /fetch/i.test(err.message) ? 'Hindi maka-connect sa Gemini. Check ang internet at API key mo.' : err.message;
  }finally{
    $('imgBtn').disabled = false;
  }
}
