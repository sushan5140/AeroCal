// AeroCal cinematic views — purely illustrative. Research replay remains Three.js only.
(() => {
  const scene=document.getElementById('scene'); if(!scene)return;
  const manifest=[
    {id:'hero',name:'Hero Wide',file:'./media/hero-wide.mp4'},
    {id:'terminal',name:'Terminal',file:'./media/terminal-focus.mp4'},
    {id:'runway',name:'Runway',file:'./media/runway-focus.mp4'}
  ];
  const holder=document.createElement('section');
  holder.id='cinematicLayer'; holder.className='cinematic-layer'; holder.hidden=true;
  holder.innerHTML='<video class="cinematic-video" playsinline muted preload="none" aria-label="Illustrative generated airport cinematic animation"></video><div class="cinematic-disclaimer">AI-generated illustration · Not synchronized with experimental aircraft trajectories</div><div id="cinematicError" class="cinematic-error" hidden></div>';
  scene.append(holder);
  const vid=holder.querySelector('video'), error=holder.querySelector('#cinematicError');
  const toolbar=document.createElement('div');toolbar.className='cinematic-toolbar';
  toolbar.innerHTML='<div class="cinematic-modes" role="group" aria-label="Airport view mode"><button type="button" data-mode="interactive" class="current" aria-pressed="true">3D Interactive</button><button type="button" data-mode="cinematic" aria-pressed="false">Cinematic</button></div><div class="cinematic-views" role="group" aria-label="Cinematic camera views" hidden></div><button type="button" id="cinematicPlay" hidden>Pause video</button>';
  scene.append(toolbar);
  const views=toolbar.querySelector('.cinematic-views'), modeButtons=[...toolbar.querySelectorAll('[data-mode]')], play=toolbar.querySelector('#cinematicPlay');
  manifest.forEach(item=>{const b=document.createElement('button');b.type='button';b.textContent=item.name;b.dataset.view=item.id;b.addEventListener('click',()=>choose(item.id));views.append(b)});
  let mode='interactive',selected='hero',loadedId=null;
  const status=document.getElementById('sceneStatus');
  function updateButtons(){modeButtons.forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('current',on);b.setAttribute('aria-pressed',String(on))});views.hidden=mode!=='cinematic';play.hidden=mode!=='cinematic';[...views.children].forEach(b=>{const on=b.dataset.view===selected;b.classList.toggle('current',on);b.setAttribute('aria-pressed',String(on))})}
  function setError(message){error.hidden=!message;error.textContent=message||'';if(message){status&&(status.textContent='Cinematic media unavailable · 3D view remains usable')}}
  function choose(id){
    const item=manifest.find(x=>x.id===id);if(!item)return;
    selected=id;updateButtons();setError('');
    if(mode!=='cinematic')return;
    vid.pause();vid.removeAttribute('src');vid.load();loadedId=id;
    vid.src=item.file;vid.load();vid.play().catch(()=>{play.textContent='Play video'});
  }
  function setMode(next){
    mode=next==='cinematic'?'cinematic':'interactive';
    holder.hidden=mode!=='cinematic';
    scene.classList.toggle('cinematic-active',mode==='cinematic');
    if(mode==='cinematic'){choose(selected);status&&(status.textContent='Cinematic · AI-generated, not research data');}
    else{vid.pause();vid.removeAttribute('src');vid.load();loadedId=null;setError('');status&&(status.textContent='3D interactive · synthetic scene');}
    updateButtons();
  }
  vid.addEventListener('error',()=>{if(mode==='cinematic'){setError('This cinematic clip has not been uploaded yet. Add the matching MP4 to the media folder, or switch to 3D Interactive.');play.textContent='Play video'}});
  vid.addEventListener('ended',()=>{vid.currentTime=0;vid.play().catch(()=>{play.textContent='Play video'})});
  vid.addEventListener('playing',()=>{play.textContent='Pause video'});
  vid.addEventListener('pause',()=>{play.textContent='Play video'});
  play.addEventListener('click',()=>vid.paused?vid.play().catch(()=>{}):vid.pause());
  modeButtons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)vid.pause()});
  updateButtons();
  window.AeroCalCinematic={setMode,choose,getMode:()=>mode};
})();