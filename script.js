const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const screens={age:$("#ageScreen"),young:$("#youngScreen"),middle:$("#middleScreen"),older:$("#olderScreen")};
function show(name){Object.values(screens).forEach(x=>x.classList.remove("active"));screens[name].classList.add("active");$("#homeBtn").hidden=name==="age";scrollTo(0,0)}
$("#homeBtn").onclick=()=>show("age");
$$(".ageCard").forEach(b=>b.onclick=()=>show(b.dataset.age));

const palettes=["#ff3b30","#ff9500","#ffcc00","#34c759","#00c7be","#007aff","#5856d6","#af52de","#ff2d55","#8b4513","#000000","#ffffff"];
let chosen="#ff3b30";
$("#youngPalette").innerHTML=palettes.map(c=>`<button title="${c}" style="background:${c}" data-c="${c}"></button>`).join("");
$("#youngPalette").querySelectorAll("button").forEach(b=>b.onclick=()=>{chosen=b.dataset.c;$("#youngPalette").querySelectorAll("button").forEach(x=>x.classList.remove("sel"));b.classList.add("sel")});
$("#youngPalette button").classList?.add?.("sel");

const pages={
 boy:[
  {name:"Rocket",svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><rect width="600" height="450" fill="white"/><g stroke="#111" stroke-width="7" stroke-linejoin="round"><path data-fill d="M300 55 C360 120 375 205 330 315 L300 355 L270 315 C225 205 240 120 300 55Z" fill="white"/><circle data-fill cx="300" cy="165" r="45" fill="white"/><path data-fill d="M270 315 L235 360 L275 350 L300 395 L325 350 L365 360 L330 315" fill="white"/><path data-fill d="M255 300 L190 340 L225 275" fill="white"/><path data-fill d="M345 300 L410 340 L375 275" fill="white"/></g></svg>`},
  {name:"Dino",svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><rect width="600" height="450" fill="white"/><g stroke="#111" stroke-width="7" stroke-linejoin="round"><path data-fill d="M110 320 Q80 220 170 170 Q235 135 330 170 L420 125 Q490 105 505 165 L475 210 L430 220 L395 280 L420 345 L360 345 L335 290 L245 300 L225 350 L165 350 L175 310Z" fill="white"/><circle data-fill cx="430" cy="160" r="9" fill="white"/><path data-fill d="M120 225 L70 195 L115 185" fill="white"/></g></svg>`}
 ],
 girl:[
  {name:"Flower Garden",svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><rect width="600" height="450" fill="white"/><g stroke="#111" stroke-width="7" stroke-linejoin="round"><path data-fill d="M300 230 Q270 180 300 130 Q330 180 300 230" fill="white"/><path data-fill d="M300 230 Q345 185 385 215 Q345 245 300 230" fill="white"/><path data-fill d="M300 230 Q355 250 340 300 Q305 275 300 230" fill="white"/><path data-fill d="M300 230 Q265 280 220 250 Q255 220 300 230" fill="white"/><path data-fill d="M300 230 Q245 195 260 150 Q295 175 300 230" fill="white"/><circle data-fill cx="300" cy="230" r="28" fill="white"/><path d="M300 258 L300 390" fill="none"/><path data-fill d="M300 325 Q245 285 215 330 Q260 350 300 340" fill="white"/><path data-fill d="M300 350 Q360 315 395 360 Q345 375 300 365" fill="white"/></g></svg>`},
  {name:"Castle",svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><rect width="600" height="450" fill="white"/><g stroke="#111" stroke-width="7" stroke-linejoin="round"><path data-fill d="M150 350 L150 180 L205 180 L205 350" fill="white"/><path data-fill d="M395 350 L395 180 L450 180 L450 350" fill="white"/><path data-fill d="M205 350 L205 150 L395 150 L395 350" fill="white"/><path data-fill d="M275 350 L275 270 Q300 235 325 270 L325 350" fill="white"/><path data-fill d="M150 180 L130 145 L165 160 L180 125 L195 160 L225 145 L205 180" fill="white"/><path data-fill d="M395 180 L375 145 L410 160 L425 125 L440 160 L470 145 L450 180" fill="white"/><path data-fill d="M275 150 L300 115 L325 150" fill="white"/></g></svg>`}
]};

let currentBook="boy",currentPage=0,youngCanvas=$("#youngCanvas"), yctx=youngCanvas.getContext("2d");
$$(".bookCard").forEach(b=>b.onclick=()=>{currentBook=b.dataset.book;$("#youngPicker").classList.remove("hidden");$("#bookTitle").textContent=(currentBook==="boy"?"Boy":"Girl")+" Coloring Book";$("#pageButtons").innerHTML=pages[currentBook].map((p,i)=>`<button data-page="${i}">${p.name}</button>`).join("");$("#pageButtons").querySelectorAll("button").forEach(x=>x.onclick=()=>loadYoung(+x.dataset.page));loadYoung(0)});
function loadYoung(i){
 currentPage=i;$("#colorArea").classList.remove("hidden");
 const img=new Image(); const svg=pages[currentBook][i].svg;
 img.onload=()=>{youngCanvas.width=600;youngCanvas.height=450;yctx.clearRect(0,0,600,450);yctx.drawImage(img,0,0);};
 img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
youngCanvas.addEventListener("pointerdown",e=>{
 const r=youngCanvas.getBoundingClientRect(),x=(e.clientX-r.left)*youngCanvas.width/r.width,y=(e.clientY-r.top)*youngCanvas.height/r.height;
 // Simple region coloring: place a colored circle under the tap, preserving line art.
 yctx.globalCompositeOperation="multiply";yctx.fillStyle=chosen;yctx.beginPath();yctx.arc(x,y,28,0,Math.PI*2);yctx.fill();yctx.globalCompositeOperation="source-over";
});
$("#youngClear").onclick=()=>loadYoung(currentPage);
$("#youngSave").onclick=()=>saveCanvas(youngCanvas,"coloring-page.png");

function setupDraw(canvas,color,size,opacity,tone){
 const ctx=canvas.getContext("2d");let drawing=false,erase=false,shade=false;
 function resize(){const d=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h)}
 new ResizeObserver(resize).observe(canvas); resize();
 function pos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
 canvas.addEventListener("pointerdown",e=>{drawing=true;canvas.setPointerCapture(e.pointerId);const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y)});
 canvas.addEventListener("pointermove",e=>{if(!drawing)return;const p=pos(e);ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=+size.value;ctx.globalAlpha=+opacity.value/100;ctx.globalCompositeOperation=erase?"destination-out":"source-over";let c=color.value;if(shade)c=shadeColor(c,-35);ctx.strokeStyle=c;ctx.lineTo(p.x,p.y);ctx.stroke()});
 canvas.addEventListener("pointerup",()=>{drawing=false;ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"});
 return {clear:()=>{ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight)},toggleErase:()=>erase=!erase,toggleShade:()=>shade=!shade,ctx}
}
function shadeColor(hex,pct){let n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;const f=x=>Math.max(0,Math.min(255,Math.round(x*(100+pct)/100)));return`rgb(${f(r)},${f(g)},${f(b)})`}
function saveCanvas(c,name){const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download=name;a.click()}

const mid=setupDraw($("#midCanvas"),$("#midColor"),$("#midSize"),{value:100},$("#midTone"));
$("#midClear").onclick=mid.clear;$("#midEraser").onclick=mid.toggleErase;$("#midShade").onclick=mid.toggleShade;$("#midSave").onclick=()=>saveCanvas($("#midCanvas"),"my-drawing.png");
$("#midColor").oninput=e=>{const c=e.target.value;$("#tonePreview").style.background=`linear-gradient(90deg,#fff,${c},#000)`};

const old=setupDraw($("#oldCanvas"),$("#oldColor"),$("#oldSize"),$("#oldOpacity"),$("#oldTone"));
$("#oldClear").onclick=old.clear;$("#oldEraser").onclick=old.toggleErase;$("#oldShade").onclick=old.toggleShade;$("#oldSave").onclick=()=>saveCanvas($("#oldCanvas"),"my-creative-art.png");
$("#oldColor").oninput=e=>{const c=e.target.value;$("#oldTonePreview").style.background=`linear-gradient(90deg,#fff,${c},#000)`};
