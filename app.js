const PAGE_IMAGES = [
  "https://gabymanor-stack.github.io/krovat-passport-pwa/pages/01_Cover.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/01_Profile.PNG",
  "https://gabymanor-stack.github.io/krovat-passport-pwa/pages/03_Madeira.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/04_London.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/05_Brussels.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/06_Beirut.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/07_Monaco.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/08_Moscow.PNG",
  "https://gabymanor-stack.github.io/krovat-passport-pwa/pages/09_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/10_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/11_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/12_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/13_Random.PNG",
  "https://gabymanor-stack.github.io/krovat-passport-pwa/pages/14_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/15_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/16_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/17_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/18_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/19_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/20_Random.PNG",
  "https://gabymanor-stack.github.io/krovat-passport-pwa/pages/21_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/22_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/23_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/24_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/25_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/26_Random.PNG","https://gabymanor-stack.github.io/krovat-passport-pwa/pages/27_Random.PNG",
  "https://gabymanor-stack.github.io/krovat-passport-pwa/pages/28_Back.PNG"
];
const INK_COLORS = ["#243A56","#7B3A2B","#2F2F2F","#41543A","#594567"];
const SHAPES = ["round","oval","rect","hex","tri"];
const ICONS  = ["plane","ship","globe","compass","star"];
const LABELS = ["ENTRY IMMIGRATION","PORT ENTRY","IMMIGRATION CONTROL","ENTRY VISA CHECKED","ENTRY CLEARED"];
const STORAGE_KEY = "krovat_passport_state_v1";

let current = 0;
let pages = loadState();

const book = document.getElementById('book');
// Preload all passport pages for smoother flipping
PAGE_IMAGES.forEach(src => { 
  const i = new Image(); 
  i.crossOrigin = "anonymous"; 
  i.src = src; 
});

function defaultState(){ return PAGE_IMAGES.map(()=>({stamps:[]})); }
function loadState(){
  try{
    const s = localStorage.getItem(STORAGE_KEY);
    if(!s) return defaultState();
    const p = JSON.parse(s);
    if(!Array.isArray(p) || p.length !== PAGE_IMAGES.length) return defaultState();
    return p;
  }catch(e){ return defaultState(); }
}
function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(pages)); }catch(e){} }

function makePage(i){
  const div = document.createElement('div');
  div.className = 'page hidden';

  // Use <img> for the page artwork instead of CSS background:
  const bg = document.createElement('img');
  bg.className = 'page-bg';
  bg.alt = `page ${i+1}`;
  bg.decoding = 'async';
  bg.loading = 'lazy';
  bg.crossOrigin = 'anonymous';
  bg.src = PAGE_IMAGES[i];
  div.appendChild(bg);

  // Canvas for stamps on top
  const canvas = document.createElement('canvas');
  canvas.className = 'stamps';
  div.appendChild(canvas);

  div.addEventListener('pointerdown', (e)=>onTapPage(e, div));
  return div;
}
function layoutPages(){
  book.innerHTML='';
  for(let i=0;i<PAGE_IMAGES.length;i++){ book.appendChild(makePage(i)); }
  updatePageClasses();
  resizeCanvases();
}
function updatePageClasses(){
  const els=[...book.children];
  els.forEach((el,i)=>{
    el.classList.remove('prev','current','next','hidden');
    if(i<current) el.classList.add('prev');
    else if(i===current) el.classList.add('current');
    else el.classList.add('next');
    if(Math.abs(i-current)>2) el.classList.add('hidden');
  });
  drawAllStamps();
}
function resizeCanvases(){
  const els=[...book.querySelectorAll('.page')];
  els.forEach(el=>{
    const c=el.querySelector('canvas.stamps');
    const r=el.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    c.width=Math.round(r.width*dpr); c.height=Math.round(r.height*dpr);
    c.style.width=r.width+'px'; c.style.height=r.height+'px';
    c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
  });
  drawAllStamps();
}
window.addEventListener('resize', resizeCanvases);

function onTapPage(e, el){
  const idx=[...book.children].indexOf(el);
  if(idx!==current) return;
  const rect=el.getBoundingClientRect();
  const nx=(e.clientX-rect.left)/rect.width;
  const ny=(e.clientY-rect.top)/rect.height;
  placeRandomStampAt(idx, nx, ny);
}

async function placeRandomStampAt(pageIndex, nx, ny){
  const i=Math.floor(Math.random()*5);
  const color=INK_COLORS[i], shape=SHAPES[i], icon=ICONS[i], label=LABELS[i];
  const dateStr=new Date().toLocaleDateString();
  let city="", country="";
  try{
    const pos=await getPosition({timeout:8000});
    const {latitude,longitude}=pos.coords;
    const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const r=await fetch(url,{headers:{'Accept':'application/json'}});
    if(r.ok){
      const data=await r.json();
      country=data.address.country||"";
      city=data.address.city||data.address.town||data.address.village||data.address.county||"";
    }
  }catch(err){}
  pages[pageIndex].stamps.push({shape,icon,color,label,date:dateStr,country,city,x:nx,y:ny,scale:1.0,rotation:(Math.random()*12-6)});
  saveState(); drawAllStamps();
}

function drawAllStamps(){
  const els=[...book.children];
  els.forEach((el,idx)=>{
    const c=el.querySelector('canvas.stamps'); if(!c) return;
    const ctx=c.getContext('2d'); const r=el.getBoundingClientRect();
    ctx.clearRect(0,0,c.width,c.height);
    (pages[idx].stamps||[]).forEach(s=> drawStamp(ctx,s,r.width,r.height) );
  });
}

function drawStamp(ctx, s, w, h){
  const targetW=w*0.33*s.scale;
  const cx=s.x*w, cy=s.y*h;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(s.rotation*Math.PI/180);
  ctx.globalAlpha=0.95; ctx.strokeStyle=s.color; ctx.fillStyle=s.color; ctx.lineWidth=3;

  const bw=targetW, bh=heightForShape(s.shape, bw);
  drawShapePath(ctx,s.shape,-bw/2,-bh/2,bw,bh); ctx.stroke();

  ctx.save(); ctx.globalAlpha=0.9; drawIcon(ctx,s.icon,0,0,26,s.color); ctx.restore();

  ctx.globalAlpha=0.95; ctx.textAlign='center';
  ctx.font="bold 14px system-ui,-apple-system,Arial"; ctx.fillText(s.country||"",0,16+bh*0.10);
  ctx.font="12px system-ui,-apple-system,Arial"; ctx.fillText(s.city||"",0,16+bh*0.22);
  ctx.font="11px system-ui,-apple-system,Arial"; ctx.fillText(s.date||"",0,16+bh*0.34);

  ctx.restore();
}
function heightForShape(shape, baseW){ if(shape==="round")return baseW; if(shape==="oval")return baseW*0.65; if(shape==="rect")return baseW*0.60; if(shape==="hex")return baseW*0.75; if(shape==="tri")return baseW*0.90; return baseW*0.7; }
function drawShapePath(ctx,shape,x,y,w,h){
  if(shape==="round"||shape==="oval"){ ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2); return; }
  if(shape==="rect"){ const r=12; ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); return; }
  if(shape==="hex"){ const cx=x+w/2, cy=y+h/2, R=Math.min(w,h)/2; ctx.beginPath();
    for(let i=0;i<6;i++){ const a=i*Math.PI/3-Math.PI/6; const px=cx+R*Math.cos(a), py=cy+R*Math.sin(a); if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.closePath(); return; }
  if(shape==="tri"){ ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.closePath(); return; }
}
function drawIcon(ctx, icon, cx, cy, size, color){
  ctx.fillStyle=color;
  if(icon==="plane"){ ctx.beginPath(); ctx.moveTo(cx-size*0.6,cy); ctx.lineTo(cx+size*0.4,cy);
    ctx.lineTo(cx+size*0.55,cy-size*0.15); ctx.lineTo(cx+size*0.55,cy+size*0.15); ctx.closePath(); ctx.fill(); return; }
  if(icon==="ship"){ ctx.beginPath(); ctx.moveTo(cx-size*0.5,cy+size*0.2); ctx.lineTo(cx+size*0.5,cy+size*0.2);
    ctx.lineTo(cx+size*0.25,cy+size*0.45); ctx.lineTo(cx-size*0.25,cy+size*0.45); ctx.closePath(); ctx.fill(); return; }
  if(icon==="globe"){ ctx.beginPath(); ctx.arc(cx,cy,size*0.45,0,Math.PI*2); ctx.fill(); return; }
  if(icon==="compass"){ ctx.beginPath(); ctx.moveTo(cx,cy-size*0.5); ctx.lineTo(cx+size*0.3,cy);
    ctx.lineTo(cx,cy+size*0.5); ctx.lineTo(cx-size*0.3,cy); ctx.closePath(); ctx.fill(); return; }
  if(icon==="star"){ ctx.beginPath();
    for(let i=0;i<5;i++){ const a=(i*72-90)*Math.PI/180, a2=a+36*Math.PI/180;
      const r1=size*0.45, r2=size*0.2; const x1=cx+Math.cos(a)*r1, y1=cy+Math.sin(a)*r1;
      const x2=cx+Math.cos(a2)*r2, y2=cy+Math.sin(a2)*r2; if(i===0) ctx.moveTo(x1,y1); else ctx.lineTo(x1,y1); ctx.lineTo(x2,y2);}
    ctx.closePath(); ctx.fill(); return; }
}

// nav
document.getElementById('nextBtn').addEventListener('click', ()=>{ if(current<PAGE_IMAGES.length-1) current++; updatePageClasses(); });
document.getElementById('prevBtn').addEventListener('click', ()=>{ if(current>0) current--; updatePageClasses(); });

// swipe
let startX=null;
book.addEventListener('touchstart', e=>{ startX=e.changedTouches[0].clientX; }, {passive:true});
book.addEventListener('touchend', e=>{
  if(startX==null) return; const dx=e.changedTouches[0].clientX-startX;
  if(dx<-40 && current<PAGE_IMAGES.length-1){ current++; updatePageClasses(); }
  if(dx> 40 && current>0){ current--; updatePageClasses(); }
  startX=null;
}, {passive:true});

function getPosition(opts){ return new Promise((res,rej)=>{
  if(!navigator.geolocation) return rej(new Error("No geolocation"));
  navigator.geolocation.getCurrentPosition(res, rej, opts);
});}

// export/import JSON
document.getElementById('exportJSON').addEventListener('click', ()=>{
  const payload={version:1,pages:pages.map((p,i)=>({index:i,stamps:p.stamps}))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='krovat_stamps_backup.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});
document.getElementById('importJSON').addEventListener('change', async (e)=>{
  const f=e.target.files?.[0]; if(!f) return; const text=await f.text();
  try{
    const data=JSON.parse(text); if(!Array.isArray(data.pages)) throw new Error("Bad file");
    data.pages.forEach(pg=>{ if(typeof pg.index==='number' && pages[pg.index]){ pages[pg.index].stamps.push(...(pg.stamps||[])); } });
    saveState(); drawAllStamps(); alert("Stamps imported.");
  }catch(err){ alert("Import failed: "+err.message); } finally { e.target.value=''; }
});

// export PDF
document.getElementById('exportPDF').addEventListener('click', exportPDF);
async function exportPDF(){
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  for(let i=0;i<PAGE_IMAGES.length;i++){
    const el = book.children[i];
    const r = el.getBoundingClientRect();
    const c = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1.5);
    c.width=Math.round(r.width*dpr); c.height=Math.round(r.height*dpr);
    const ctx=c.getContext('2d');
    const bg=await loadImage(PAGE_IMAGES[i]); ctx.drawImage(bg,0,0,c.width,c.height);
    const overlay=el.querySelector('canvas.stamps'); ctx.drawImage(overlay,0,0,c.width,c.height);
    const pngBytes=await (await fetch(c.toDataURL("image/png"))).arrayBuffer();
    const img=await pdfDoc.embedPng(pngBytes);
    const page=pdfDoc.addPage([420,595]);
    page.drawImage(img,{x:0,y:0,width:420,height:595});
  }
  const bytes=await pdfDoc.save();
  const blob=new Blob([bytes],{type:"application/pdf"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download="Winston_Passport_Stamped.pdf";
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function loadImage(src){ return new Promise((res,rej)=>{ const i=new Image(); i.crossOrigin="anonymous"; i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }

const moreBtn=document.getElementById('moreBtn'); const moreMenu=document.getElementById('moreMenu');
moreBtn.addEventListener('click', ()=>moreMenu.classList.toggle('hidden'));
window.addEventListener('click', (e)=>{ if(!moreBtn.contains(e.target) && !moreMenu.contains(e.target)) moreMenu.classList.add('hidden'); });

let deferredPrompt=null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault(); deferredPrompt=e;
  const btn=document.getElementById('installBtn'); btn.classList.remove('hidden');
  btn.addEventListener('click', async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; btn.classList.add('hidden'); });
});

if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }

layoutPages();
updatePageClasses();
