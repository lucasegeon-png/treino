"use strict";
/* ========= utilidades ========= */
const $ = s => document.querySelector(s);
const I = (n, cls="") => `<svg class="i ${cls}" viewBox="0 0 24 24">${ICONS[n]||""}</svg>`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; };
const fmtT = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return (h ? h+":"+String(m).padStart(2,"0") : m) + ":" + String(x).padStart(2,"0"); };
const fmtKg = n => (Math.round(n*10)/10).toLocaleString("pt-BR");
const fmtD = ts => new Date(ts).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const fmtDL = ts => new Date(ts).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"short"});
const dayById = id => DAYS.find(d => d.id === id);
const haptic = (p=10) => { try { navigator.vibrate && navigator.vibrate(p); } catch(e){} };

/* ========= armazenamento (no aparelho) ========= */
const KEY = "treino.v1";
let DB = { sessions: [], active: null };
function load(){
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && Array.isArray(v.sessions)) DB = v; } catch(e){}
}
let saveT = null;
function save(now){
  clearTimeout(saveT);
  const w = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e){ toast("Não foi possível salvar"); } };
  if (now) w(); else saveT = setTimeout(w, 300);
}
load();
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch(e){}
window.addEventListener("pagehide", () => save(true));
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(true); });

/* ========= histórico / recordes ========= */
const e1rm = (kg, r) => kg * (1 + r/30);
function lastSetsFor(key, exclude){
  for (const s of DB.sessions){
    if (s.start === exclude) continue;
    const e = s.ex.find(x => x.k === key && x.sets.some(st => st.done));
    if (e) return e.sets.filter(st => st.done);
  }
  return null;
}
function bestFor(key, exclude){
  const t = EX[key].t, b = {kg:0,e1:0,reps:0,sec:0,min:0,set:null,date:null};
  for (const s of DB.sessions){
    if (s.start === exclude) continue;
    for (const e of s.ex){ if (e.k !== key) continue;
      for (const st of e.sets){ if (!st.done) continue;
        const kg = num(st.kg)||0, r = num(st.reps)||0;
        if (t==="w"||t==="c"){ if (kg > b.kg) b.kg = kg; const v = e1rm(kg, t==="w"?r:0); if (v > b.e1){ b.e1 = v; b.set = st; b.date = s.start; } }
        if (t==="r" && r > b.reps){ b.reps = r; b.date = s.start; }
        if (t==="t" && (num(st.sec)||0) > b.sec){ b.sec = num(st.sec); b.date = s.start; }
        if (t==="k" && (num(st.min)||0) > b.min){ b.min = num(st.min); b.date = s.start; }
      }}
  }
  return b;
}
function isPR(key, st, exclude){
  const t = EX[key].t, b = bestFor(key, exclude), kg = num(st.kg)||0, r = num(st.reps)||0;
  if (t==="w") return b.e1 > 0 && kg > 0 && r > 0 && (kg > b.kg || e1rm(kg,r) > b.e1 + 0.01);
  if (t==="r") return b.reps > 0 && r > b.reps;
  if (t==="t") return b.sec > 0 && (num(st.sec)||0) > b.sec;
  if (t==="c") return b.kg > 0 && kg > b.kg;
  return false;
}
const weekStart = (off=0) => { const d = new Date(); d.setHours(0,0,0,0); const wd = (d.getDay()+6)%7; d.setDate(d.getDate()-wd+off*7); return d.getTime(); };
const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate()+n); return d.getTime(); };
const dayKey = t => { const d = new Date(t); d.setHours(0,0,0,0); return d.getTime(); };
const WD = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
let histOff = 0;

/* ========= animação dos exercícios ========= */
function animHTML(key, big){
  const X = EX[key];
  if (X.svg) return `<div class="anim${big?" big":""}">${CUSTOM_SVG[X.svg]}</div>`;
  return `<div class="anim${big?" big":""}" data-frames>${[1,2,3].map((f,i)=>`<img class="${i===0?"on":""}" src="ex/${X.img}-${f}.webp" alt="" loading="lazy" decoding="async">`).join("")}</div>`;
}
const SEQ = [0,1,2,1]; let tick = 0;
setInterval(() => {
  tick = (tick + 1) % SEQ.length;
  document.querySelectorAll("[data-frames]").forEach(el => {
    const imgs = el.children; for (let i=0;i<imgs.length;i++) imgs[i].classList.toggle("on", i === SEQ[tick]);
  });
}, 850);

/* ========= estado de navegação ========= */
let tab = DB.active ? "workout" : "home";
function go(t){ tab = t; window.scrollTo({top:0}); render(); }
function render(){
  if (tab === "workout" && !DB.active) tab = "home";
  document.body.classList.toggle("inwk", tab === "workout");
  const html = tab==="workout" ? vWorkout() : tab==="hist" ? vHist() : tab==="prs" ? vPRs() : vHome();
  $("#app").innerHTML = `<div class="screen">${html}</div>`;
  document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
}
function renderKeep(){ const y = window.scrollY; render(); $("#app .screen").style.animation = "none"; window.scrollTo(0, y); }

/* ========= HOME ========= */
function vHome(){
  const now = new Date(), wd = now.getDay(), h = now.getHours();
  const greet = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const ws = weekStart();
  const today = DAYS.find(d => d.wd === wd);
  const next = today || DAYS.find(d => d.wd > wd) || DAYS[0];
  const nextDone = DB.sessions.some(s => s.start >= ws && s.day === next.id && new Date(s.start).getDay() === wd);
  let h1 = `<div class="top"><div><div class="eyebrow">${greet}, Lucas</div><h1 class="title">${today ? "Hora de treinar" : "Dia de descanso"}</h1></div>
    <div class="icon-btn" style="color:var(--acc)">${I("flame")}</div></div>`;
  const doneDays = new Set(DB.sessions.map(x => dayKey(x.start))), todayK = dayKey(Date.now());
  h1 += `<div class="week tap" data-weekhist>${WD.map((l,i)=>{ const t = addDays(ws,i), done = doneDays.has(t), isT = t===todayK, we = i>4; return `<div class="wd${done?" done":""}${isT?" today":""}${we?" we":""}"><span>${l}</span><i>${done?I("check"):new Date(t).getDate()}</i></div>`; }).join("")}</div>`;
  if (DB.active){
    const d = dayById(DB.active.day);
    h1 += `<div class="live tap" data-go="workout"><div class="pulse"></div><div class="grow"><b>Treino em andamento</b><div class="sub">${esc(d.nome)} · <span class="num" data-live>${fmtT((Date.now()-DB.active.start)/1000)}</span></div></div><div class="btn sm">Continuar</div></div>`;
  }
  const heroKey = next.main[0][0];
  const nSets = next.main.reduce((a,x)=>a+x[1],0);
  h1 += `<div class="h2"><span class="dot"></span>${today ? "Treino de hoje" : "Próximo treino · "+next.dia}</div>
  <div class="card hero">
    <div class="art">${animHTML(heroKey,false)}</div>
    <div style="position:relative;max-width:62%">
      <div class="chips"><span class="chip acc">${esc(next.tag)}</span><span class="chip">${next.dia}</span></div>
      <h2 style="font-size:26px;letter-spacing:-.03em;margin:12px 0 6px;line-height:1.1">${esc(next.nome)}</h2>
      <div class="sub">${next.main.length} exercícios · ${nSets} séries · ~60 min</div>
    </div>
    <div class="row" style="position:relative;margin-top:18px">
      <button class="btn grow" data-start="${next.id}">${I("play")} ${nextDone ? "Treinar de novo" : "Começar treino"}</button>
      <button class="icon-btn" data-preview="${next.id}" aria-label="Ver exercícios">${I("info")}</button>
    </div>
  </div>`;
  h1 += `<div class="h2"><span class="dot"></span>Semana</div><div class="stagger">`;
  DAYS.forEach(d => {
    const last = DB.sessions.find(s => s.day === d.id);
    const isT = d.wd === wd;
    h1 += `<div class="card day tap" data-preview="${d.id}"><div class="thumb">${animHTML(d.main[0][0],false)}</div>
      <div class="grow"><div class="row" style="gap:8px"><span class="badge${isT?" today":""}">${d.dia}${isT?" · hoje":""}</span>${last?`<span class="sub">${I("check","")} ${fmtD(last.start)}</span>`:""}</div>
      <div class="name" style="margin-top:6px">${esc(d.nome)}</div><div class="meta">${d.main.map(x=>esc(EX[x[0]].n)).slice(0,3).join(" · ")}…</div></div>
      <span style="color:var(--mut)">${I("chevron-right")}</span></div>`;
  });
  h1 += `</div><div class="foot">Ilustrações: <a href="https://github.com/bryllim/workout-guide" target="_blank" rel="noopener">Workout Guide</a> (Bryl Lim, a partir de Everkinetic) · CC BY-SA 4.0<br>Ícones: Lucide (ISC) · Fonte: Inter (OFL)<br>Pare e procure a fisioterapeuta se a dor descer para a perna ou houver formigamento.</div>`;
  return h1;
}
function preview(id){
  const d = dayById(id);
  const list = (title, arr) => `<div class="h2">${title}</div>` + arr.map(([k,n,alvo]) => `<div class="row tap" data-info="${k}" style="padding:8px 0"><div style="width:52px;height:52px;border-radius:14px;overflow:hidden;flex:none">${animHTML(k,false)}</div><div class="grow"><b style="font-weight:600">${esc(EX[k].n)}</b><div class="sub">${n} × ${esc(alvo)}</div></div><span style="color:var(--mut)">${I("chevron-right")}</span></div>`).join("");
  sheet(`<div class="chips"><span class="chip acc">${esc(d.tag)}</span><span class="chip">${d.dia}</span></div><h3 style="margin-top:10px">${esc(d.nome)}</h3>
    ${list("Mobilidade · 6 min", MOB)}${list("Core · bloco "+d.core, CORE[d.core])}${list("Musculação", d.main)}${list("Cardio", [["cardio",1,"10 min"]])}
    <button class="btn full" style="margin-top:18px" data-start="${d.id}">${I("play")} Começar este treino</button>`);
}

/* ========= TREINO ========= */
function buildWorkout(dayId){
  const d = dayById(dayId), ex = [];
  const add = (sec, [k,n,alvo,rest]) => { const sets = []; for (let i=0;i<n;i++) sets.push({kg:"",reps:"",sec:"",min:"",m:"",done:false}); ex.push({k,sec,alvo,rest,sets}); };
  MOB.forEach(x => add("mob", x)); CORE[d.core].forEach(x => add("core", x)); d.main.forEach(x => add("main", x)); add("cardio", ["cardio",1,"10 min",0]);
  return {day:dayId, start:Date.now(), ex};
}
async function startWorkout(id){
  unlockAudio();
  if (DB.active){
    const ok = await ask("Já existe um treino em andamento. Descartar e começar outro?", "Descartar e começar");
    if (!ok) return; DB.active = null;
  }
  closeSheet(true);
  DB.active = buildWorkout(id); save(true); haptic(15); go("workout"); keepAwake();
}
const SECS = {mob:["Mobilidade","activity","6 min"],core:["Core · quadrado lombar","zap","8 min"],main:["Musculação","dumbbell","~35 min"],cardio:["Cardio","flame","10 min"]};
const colsFor = t => t==="w"?["kg","reps"]:t==="r"?["reps"]:t==="t"?["sec"]:t==="c"?["kg","m"]:["min"];
const COLN = {kg:"kg",reps:"reps",sec:"seg",m:"metros",min:"min"};
function prevText(t, p){
  if (!p) return "—";
  if (t==="w") return `${p.kg||"–"} × ${p.reps||"–"}`;
  if (t==="r") return `${p.reps||"–"} reps`;
  if (t==="t") return `${p.sec||"–"} s`;
  if (t==="c") return `${p.kg||"–"} kg · ${p.m||"–"} m`;
  return `${p.min||"–"} min`;
}
function progress(){ let a=0,b=0; DB.active.ex.forEach(e=>e.sets.forEach(s=>{b++; if(s.done)a++;})); return [a,b]; }
function vWorkout(){
  const A = DB.active, d = dayById(A.day), [a,b] = progress();
  let h = `<div class="wk-top"><div class="row">
    <button class="icon-btn" data-go="home" aria-label="Voltar">${I("chevron-left")}</button>
    <div class="grow"><div class="sub">${esc(d.nome)}</div><div class="clock num" id="clock">${fmtT((Date.now()-A.start)/1000)}</div></div>
    <button class="btn sm" id="finish">${I("check")} Concluir</button></div>
    <div class="prog"><i style="width:${b?100*a/b:0}%"></i></div></div>`;
  let cur = "";
  A.ex.forEach((e, ei) => {
    const X = EX[e.k], cols = colsFor(X.t), prev = lastSetsFor(e.k, A.start);
    if (e.sec !== cur){ cur = e.sec; const [t,ic,du] = SECS[cur]; h += `<div class="secHead"><div class="ic">${I(ic)}</div><b>${t}</b><span class="sub">${du}</span></div>`; }
    const complete = e.sets.every(s => s.done);
    h += `<div class="card ex${complete?" complete":""}"><div class="ex-h"><div class="thumb tap" data-info="${e.k}">${animHTML(e.k,false)}</div>
      <div class="grow"><div class="ex-name">${esc(X.n)}</div><div class="ex-t"><span>${e.sets.length} × ${esc(e.alvo)}</span>${e.rest?`<span class="row" style="gap:3px">${I("timer")}${e.rest}s</span>`:""}</div></div>
      <button class="icon-btn" data-info="${e.k}" aria-label="Como fazer">${I("circle-play")}</button></div>
      <div class="sets"><div class="set head ${cols.length===2?"c2":"c1"}"><span>#</span><span>anterior</span>${cols.map(c=>`<span>${COLN[c]}</span>`).join("")}<span></span></div>`;
    e.sets.forEach((st, si) => {
      const p = prev && prev[si];
      h += `<div class="set ${cols.length===2?"c2":"c1"}${st.done?" done":""}"><span class="n">${si+1}${st.pr?'<span class="pr">PR</span>':""}</span>
        <button class="prev${p?" has":""}" data-fill="${ei}:${si}">${esc(prevText(X.t,p))}</button>`;
      cols.forEach(c => {
        const im = (c==="kg"||c==="min") ? "decimal" : "numeric";
        const timed = c==="sec" || c==="min";
        h += `<div class="inwrap"><input class="num" inputmode="${im}" data-in="${ei}:${si}:${c}" value="${esc(st[c])}" placeholder="${esc(p&&p[c]?p[c]:"0")}">${timed?`<button class="sw" data-sw="${ei}:${si}:${c}" aria-label="Cronômetro">${I("timer")}</button>`:""}</div>`;
      });
      h += `<button class="chk" data-chk="${ei}:${si}" aria-label="Concluir série">${I("check")}</button></div>`;
    });
    h += `</div><div class="ex-actions"><button class="link acc" data-add="${ei}">${I("plus")} Série</button><button class="link" data-info="${e.k}">${I("sparkles")} Vídeo / GIF</button>${e.sets.length>1?`<button class="link" data-rm="${ei}">${I("minus")} Remover</button>`:""}</div></div>`;
  });
  h += `<button class="btn danger full" id="discard" style="margin-top:22px">${I("trash")} Descartar treino</button>`;
  return h;
}
function updateProgress(){ const p = document.querySelector(".prog i"); if (!p) return; const [a,b] = progress(); p.style.width = (b?100*a/b:0)+"%"; }

async function onWorkoutClick(t){
  const g = a => t.closest("["+a+"]"); let el;
  if ((el = g("data-chk"))){
    unlockAudio();
    const [ei,si] = el.dataset.chk.split(":").map(Number), e = DB.active.ex[ei], st = e.sets[si];
    colsFor(EX[e.k].t).forEach(c => { if (st[c] === ""){ const inp = document.querySelector(`[data-in="${ei}:${si}:${c}"]`); if (inp && inp.placeholder && inp.placeholder !== "0") st[c] = inp.placeholder; } });
    st.done = !st.done; st.pr = st.done ? isPR(e.k, st, DB.active.start) : false;
    save(); haptic(st.done ? (st.pr ? [20,40,20] : 12) : 6);
    renderKeep();
    if (st.pr) { confetti(60); toast("🏆 Novo recorde!"); }
    if (st.done && e.rest) startRest(e.rest, EX[e.k].n);
    return;
  }
  if ((el = g("data-fill"))){
    const [ei,si] = el.dataset.fill.split(":").map(Number), e = DB.active.ex[ei], p = (lastSetsFor(e.k, DB.active.start)||[])[si];
    if (!p) return; colsFor(EX[e.k].t).forEach(c => e.sets[si][c] = p[c]||""); save(); haptic(6); renderKeep(); return;
  }
  if ((el = g("data-add"))){ const e = DB.active.ex[+el.dataset.add], l = e.sets[e.sets.length-1]; e.sets.push({kg:l.kg,reps:"",sec:"",min:"",m:l.m,done:false}); save(); renderKeep(); return; }
  if ((el = g("data-rm"))){ const e = DB.active.ex[+el.dataset.rm]; if (e.sets.length > 1){ e.sets.pop(); save(); renderKeep(); } return; }
  if ((el = g("data-info"))) return info(el.dataset.info);
  if ((el = g("data-sw"))){ const [ei,si,c] = el.dataset.sw.split(":"); return stopwatch(+ei, +si, c); }
  if ((el = g("data-go"))) return go(el.dataset.go);
  if (t.closest("#finish")) return finish();
  if (t.closest("#discard")){ if (await ask("Descartar este treino? Nada será salvo.", "Descartar")){ DB.active = null; save(true); stopRest(); releaseAwake(); go("home"); } }
}
function onInput(t){
  if (!t.dataset.in || !DB.active) return;
  const [ei,si,c] = t.dataset.in.split(":"); DB.active.ex[+ei].sets[+si][c] = t.value.replace(",", "."); save();
}

async function finish(){
  const A = DB.active, [a] = progress();
  if (!a){ if (await ask("Nenhuma série marcada como feita. Descartar o treino?", "Descartar")){ DB.active = null; save(true); go("home"); } return; }
  const [, b] = progress();
  if (a < b && !(await ask(`Faltam ${b-a} séries. Concluir assim mesmo?`, "Concluir", true))) return;
  const s = JSON.parse(JSON.stringify(A));
  s.end = Date.now();
  s.ex = s.ex.map(e => ({...e, sets: e.sets.filter(x => x.done)})).filter(e => e.sets.length);
  s.vol = s.ex.reduce((acc,e) => acc + (EX[e.k].t==="w" ? e.sets.reduce((q,x)=>q+(num(x.kg)||0)*(num(x.reps)||0),0) : 0), 0);
  DB.sessions = [s, ...DB.sessions.filter(x => x.start !== s.start)];
  DB.active = null; save(true); stopRest(); releaseAwake();
  go("home"); confetti(140); haptic([30,60,30]);
  const prs = []; s.ex.forEach(e => e.sets.forEach(x => { if (x.pr) prs.push([e.k, x]); }));
  const n = s.ex.reduce((q,e)=>q+e.sets.length,0);
  sheet(`<div style="text-align:center;margin-top:6px"><div style="width:64px;height:64px;border-radius:22px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;background:rgba(255,200,74,.12);color:var(--gold)">${I("trophy")}</div>
    <h3>Treino concluído</h3><div class="sub" style="margin-top:4px">${esc(dayById(s.day).nome)} · ${fmtDL(s.start)}</div></div>
    <div class="stats" style="margin-top:18px"><div class="stat"><b class="num">${fmtT((s.end-s.start)/1000)}</b><span>duração</span></div><div class="stat"><b class="num">${fmtKg(s.vol)} kg</b><span>volume</span></div><div class="stat"><b class="num">${n}</b><span>séries</span></div><div class="stat"><b class="num" style="color:var(--gold)">${prs.length}</b><span>recordes</span></div></div>
    ${prs.length?`<div class="h2">Novos recordes</div>${prs.map(([k,x])=>`<div class="row" style="padding:6px 0"><span class="chip gold">PR</span><b class="grow" style="font-weight:600">${esc(EX[k].n)}</b><span class="num">${esc(prevText(EX[k].t,x))}</span></div>`).join("")}`:""}
    <button class="btn full" style="margin-top:20px" data-close>Fechar</button>`);
}

/* ========= timer de descanso ========= */
const rest = {end:0,total:0,iv:null,ended:false,name:""};
const C = 2*Math.PI*24;
function startRest(sec, name){
  rest.total = sec; rest.end = Date.now()+sec*1000; rest.ended = false; rest.name = name;
  clearInterval(rest.iv); rest.iv = setInterval(tickRest, 200); drawRest(); tickRest();
}
function stopRest(){ clearInterval(rest.iv); rest.iv = null; $("#rest").className = ""; }
function drawRest(){
  $("#rest").innerHTML = `<div class="ring"><svg viewBox="0 0 54 54"><circle class="bg" cx="27" cy="27" r="24"/><circle class="fg" cx="27" cy="27" r="24" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><span>${I("timer")}</span></div>
  <div class="grow"><div class="sub" id="rlbl">Descanso</div><div class="rt num" id="rt">0:00</div></div>
  <button class="rbtn" data-r="-15">−15</button><button class="rbtn" data-r="15">+15</button><button class="rbtn" data-r="x" aria-label="Pular">${I("x")}</button>`;
}
function tickRest(){
  const left = (rest.end - Date.now())/1000, r = $("#rest");
  if (left <= 0 && !rest.ended){ rest.ended = true; beep(); haptic([300,120,300]); setTimeout(() => { if (rest.ended) stopRest(); }, 5000); }
  r.className = "show" + (rest.ended ? " end" : "");
  const rt = $("#rt"), fg = r.querySelector(".fg"), lb = $("#rlbl");
  if (rt) rt.textContent = fmtT(Math.max(0,left));
  if (lb) lb.textContent = rest.ended ? "Bora, próxima série!" : "Descanso";
  if (fg) fg.style.strokeDashoffset = C * (1 - Math.max(0,left)/rest.total);
}
$("#rest").addEventListener("click", ev => {
  const b = ev.target.closest("[data-r]"); if (!b) return; haptic(8);
  if (b.dataset.r === "x") return stopRest();
  const d = +b.dataset.r; rest.end += d*1000; rest.total = Math.max(rest.total + d, 1);
  if (rest.ended && rest.end > Date.now()) rest.ended = false; tickRest();
});
let actx = null;
function unlockAudio(){ try { if (!actx) actx = new (window.AudioContext||window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch(e){} }
function beep(){ try { if (!actx) return; [0,.22,.44].forEach((t,i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.value = i===2 ? 1320 : 880; o.connect(g); g.connect(actx.destination); const s = actx.currentTime+t; g.gain.setValueAtTime(.0001,s); g.gain.exponentialRampToValueAtTime(.3,s+.02); g.gain.exponentialRampToValueAtTime(.0001,s+.2); o.start(s); o.stop(s+.22); }); } catch(e){} }
let wake = null;
async function keepAwake(){ try { if (navigator.wakeLock && !wake){ wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => wake = null); } } catch(e){} }
function releaseAwake(){ try { wake && wake.release(); } catch(e){} wake = null; }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible"){ if (DB.active) keepAwake(); if (rest.iv) tickRest(); } });

/* ========= cronômetro ========= */
function stopwatch(ei, si, c){
  unlockAudio();
  const e = DB.active.ex[ei], t0 = Date.now(); let iv;
  sheet(`<div class="sub" style="text-align:center">${esc(EX[e.k].n)} · série ${si+1} · alvo ${esc(e.alvo)}</div>
    <div class="stopw num" id="swv">0:00</div>
    <button class="btn full" id="swstop">${I("pause")} Parar e registrar</button><button class="btn ghost full" data-close style="margin-top:10px">Cancelar</button>`, () => clearInterval(iv));
  iv = setInterval(() => { const v = $("#swv"); if (v) v.textContent = fmtT((Date.now()-t0)/1000); }, 200);
  $("#swstop").onclick = () => { clearInterval(iv); const s = (Date.now()-t0)/1000; e.sets[si][c] = c==="min" ? String(Math.round(s/6)/10) : String(Math.round(s)); save(); haptic(12); closeSheet(); renderKeep(); };
}

/* ========= detalhes do exercício ========= */
const SEARCH = {
  yt: q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q),
  gif: q => "https://www.google.com/search?tbm=isch&tbs=itp:animated&q=" + encodeURIComponent(q + " gif"),
  giphy: q => "https://giphy.com/search/" + encodeURIComponent(q.replace(/\s+/g,"-")),
  gv: q => "https://www.google.com/search?tbm=vid&q=" + encodeURIComponent(q)
};
function ytId(u){ const m = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/); return m ? m[1] : null; }
function mediaHTML(u){
  const id = ytId(u);
  if (id) return `<div class="media"><iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
  if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return `<div class="media"><video src="${esc(u)}" autoplay loop muted playsinline controls></video></div>`;
  if (/\.(gif|webp|png|jpe?g)(\?|$)/i.test(u) || /giphy\.com\/media|media\.tenor\.com/i.test(u)) return `<div class="media img"><img src="${esc(u)}" alt=""></div>`;
  return "";
}
function info(k){
  const X = EX[k], b = bestFor(k, null), last = lastSetsFor(k, null);
  DB.links = DB.links || {};
  const saved = DB.links[k];
  const media = saved ? mediaHTML(saved) : "";
  sheet(`${media || animHTML(k,true)}<h3 style="margin-top:16px">${esc(X.n)}</h3>
    <div class="chips" style="margin-top:10px">${X.m.map(m=>`<span class="chip">${esc(m)}</span>`).join("")}</div>
    <p class="cue">${esc(X.cue)}</p>
    ${last?`<div class="stats" style="margin-bottom:14px"><div class="stat"><b class="num" style="font-size:18px">${esc(prevText(X.t,last[0]))}</b><span>último treino</span></div><div class="stat"><b class="num" style="font-size:18px;color:var(--gold)">${X.t==="w"||X.t==="c"?fmtKg(b.kg)+" kg":X.t==="t"?b.sec+" s":X.t==="r"?b.reps+" reps":fmtKg(b.min)+" min"}</b><span>recorde</span></div></div>`:""}
    ${saved?`<div class="row" style="margin-bottom:14px"><a class="btn ghost grow" href="${esc(saved)}" target="_blank" rel="noopener">${I("circle-play")} Abrir meu vídeo/GIF</a><button class="icon-btn" id="lnkdel" aria-label="Remover link">${I("trash")}</button></div>${media?`<button class="link" id="showanim" style="margin:-6px 0 8px">${I("activity")} Ver ilustração</button>`:""}`:""}
    <div class="h2" style="margin-top:6px">${I("zap")} Pesquisar vídeo ou GIF</div>
    <div class="search"><input id="q" value="${esc(X.yt)}" enterkeyhint="search" aria-label="Termo de busca"><button class="icon-btn" id="qclr" aria-label="Limpar">${I("x")}</button></div>
    <div class="sgrid"><button class="sbtn yt" data-s="yt">${I("circle-play")}YouTube</button><button class="sbtn" data-s="gif">${I("sparkles")}GIFs (Google)</button><button class="sbtn" data-s="giphy">${I("sparkles")}Giphy</button><button class="sbtn" data-s="gv">${I("circle-play")}Vídeos (Google)</button></div>
    <div class="h2">${I("plus")} Salvar o vídeo/GIF que você escolheu</div>
    <div class="sub" style="margin:-4px 2px 10px">Copie o link do vídeo do YouTube ou do GIF e cole aqui. Ele passa a aparecer neste exercício.</div>
    <div class="search"><input id="lnk" placeholder="https://youtu.be/… ou link do GIF" inputmode="url" value="${esc(saved||"")}"><button class="btn sm" id="lnksave">Salvar</button></div>
    <button class="btn ghost full" data-close style="margin-top:16px">Fechar</button>
    ${X.svg?`<div class="foot" style="margin-top:12px">Animação simplificada feita para este app.</div>`:""}`);
  const ov = $("#ov");
  ov.querySelectorAll("[data-s]").forEach(bt => bt.onclick = () => { const q = $("#q").value.trim() || X.n; window.open(SEARCH[bt.dataset.s](q), "_blank", "noopener"); });
  $("#q").addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); window.open(SEARCH.yt($("#q").value.trim()||X.n), "_blank", "noopener"); } });
  $("#qclr").onclick = () => { $("#q").value = ""; $("#q").focus(); };
  $("#lnksave").onclick = () => {
    const v = $("#lnk").value.trim();
    if (!/^https?:\/\//i.test(v)) { toast("Cole um link começando com https://"); return; }
    DB.links[k] = v; save(true); haptic(12); toast("Link salvo"); info(k);
  };
  const del = $("#lnkdel"); if (del) del.onclick = () => { delete DB.links[k]; save(true); toast("Link removido"); info(k); };
  const sa = $("#showanim"); if (sa) sa.onclick = () => { const m = ov.querySelector(".media"); if (m) m.outerHTML = animHTML(k,true); sa.remove(); };
}

/* ========= HISTÓRICO ========= */
function sessionCard(s){
  const d = dayById(s.day) || {nome:s.day};
  return `<details class="card hist"><summary class="row"><div class="grow"><b>${esc(d.nome)}</b><div class="sub">${new Date(s.start).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} · ${fmtT(((s.end||s.start)-s.start)/1000)} · ${fmtKg(s.vol||0)} kg · ${s.ex.reduce((a,e)=>a+e.sets.length,0)} séries</div></div><span class="chev">${I("chevron-right")}</span></summary>
    <div style="margin-top:10px">${s.ex.map(e => `<div class="line"><b>${esc((EX[e.k]||{n:e.k}).n)}</b> · ${e.sets.map(x => esc(prevText((EX[e.k]||{t:"w"}).t, x)) + (x.pr ? " 🏆" : "")).join(", ")}</div>`).join("")}
    <button class="link" data-del="${s.start}" style="margin-top:10px;color:var(--bad)">${I("trash")} Apagar treino</button></div></details>`;
}
function vHist(){
  const ws = weekStart(histOff), we = addDays(ws, 7);
  const wkS = DB.sessions.filter(s => s.start >= ws && s.start < we);
  const fmtR = t => new Date(t).toLocaleDateString("pt-BR",{day:"numeric",month:"short"}).replace(".","");
  const label = histOff===0 ? "Esta semana" : histOff===-1 ? "Semana passada" : `Há ${-histOff} semanas`;
  let h = `<div class="eyebrow">${DB.sessions.length} treinos no total</div><h1 class="title">Histórico</h1>
  <div class="weeknav"><button class="icon-btn" data-wk="-1" aria-label="Semana anterior">${I("chevron-left")}</button>
    <div class="grow" style="text-align:center"><b>${label}</b><div class="sub">${fmtR(ws)} – ${fmtR(addDays(ws,6))}</div></div>
    <button class="icon-btn" data-wk="1" ${histOff>=0?"disabled style='opacity:.3'":""} aria-label="Próxima semana">${I("chevron-right")}</button></div>
  <div class="stats" style="grid-template-columns:1fr 1fr 1fr"><div class="stat"><b class="num">${wkS.length}<span style="font-size:14px;color:var(--mut)">/5</span></b><span>treinos</span></div><div class="stat"><b class="num">${fmtKg(wkS.reduce((a,s)=>a+(s.vol||0),0))}</b><span>kg volume</span></div><div class="stat"><b class="num">${wkS.reduce((a,s)=>a+s.ex.reduce((b,e)=>b+e.sets.length,0),0)}</b><span>séries</span></div></div>
  <div class="stagger" style="margin-top:6px">`;
  const todayK = dayKey(Date.now());
  WD.forEach((l, i) => {
    const t = addDays(ws, i), ss = wkS.filter(s => dayKey(s.start) === t), plan = DAYS.find(d => d.wd === (i+1)%7);
    const fut = t > todayK;
    h += `<div class="dayrow${t===todayK?" today":""}"><div class="dlabel"><b>${l}</b><span>${new Date(t).getDate()}</span></div><div class="grow">`;
    if (ss.length) h += ss.map(sessionCard).join("");
    else h += `<div class="restday">${t===todayK ? (plan ? `Hoje: ${esc(plan.nome)}` : "Descanso") : fut ? (plan ? `Previsto: ${esc(plan.nome)}` : "Descanso") : (plan ? `<span style="color:var(--bad)">Não treinou</span> · ${esc(plan.nome)}` : "Descanso")}</div>`;
    h += `</div></div>`;
  });
  h += `</div>`;
  // mapa de 12 semanas
  const start = weekStart(-11), days = new Set(DB.sessions.map(s => dayKey(s.start)));
  let cells = "";
  for (let w=0; w<12; w++){ const off = w-11; cells += `<div class="hw${off===histOff?" sel":""}" data-hw="${off}">`; for (let i=0;i<7;i++){ const t = addDays(start, w*7+i); cells += `<i class="${days.has(t)?"on":""}${t>todayK?" fut":""}"></i>`; } cells += `</div>`; }
  h += `<div class="h2"><span class="dot"></span>Últimas 12 semanas</div><div class="card"><div class="heat2">${cells}</div><div class="sub" style="margin-top:10px">Toque numa coluna para abrir a semana.</div></div>`;
  h += `<div class="h2"><span class="dot"></span>Backup</div><div class="card"><div class="sub" style="margin-bottom:12px">Os dados ficam só neste celular. Faça um backup de vez em quando (ex.: salve no Drive ou mande para você no WhatsApp).</div>
    <div class="row"><button class="btn ghost grow" id="exp">${I("download")} Exportar</button><label class="btn ghost grow" style="cursor:pointer">${I("upload")} Importar<input type="file" id="imp" accept="application/json,.json" hidden></label></div></div>`;
  return h;
}
function exportData(){
  const blob = new Blob([JSON.stringify({app:"treino",v:1,exported:Date.now(),sessions:DB.sessions},null,1)], {type:"application/json"});
  const name = "treino-backup-" + new Date().toISOString().slice(0,10) + ".json";
  const file = new File([blob], name, {type:"application/json"});
  if (navigator.canShare && navigator.canShare({files:[file]})) { navigator.share({files:[file], title:"Backup do treino"}).catch(()=>{}); return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
async function importData(file){
  try {
    const v = JSON.parse(await file.text()); const arr = Array.isArray(v) ? v : v.sessions;
    if (!Array.isArray(arr)) throw 0;
    const valid = arr.filter(s => s && s.start && Array.isArray(s.ex));
    const have = new Set(DB.sessions.map(s => s.start)); let n = 0;
    valid.forEach(s => { if (!have.has(s.start)){ DB.sessions.push(s); n++; } });
    DB.sessions.sort((a,b) => b.start - a.start); save(true); render(); toast(`${n} treino(s) importado(s)`);
  } catch(e){ toast("Arquivo de backup inválido"); }
}

/* ========= RECORDES ========= */
function vPRs(){
  let h = `<div class="eyebrow">Melhor carga e 1RM estimado</div><h1 class="title">Recordes</h1>`;
  const keys = Object.keys(EX).filter(k => DB.sessions.some(s => s.ex.some(e => e.k === k)));
  if (!keys.length) return h + `<div class="empty"><div class="big">${I("trophy")}</div>Seus recordes aparecem aqui depois do primeiro treino.</div>`;
  const groups = [["Musculação", k => EX[k].t==="w" && k!=="pallof"], ["Core e mobilidade", k => ["r","t","c"].includes(EX[k].t) || k==="pallof"], ["Cardio", k => EX[k].t==="k"]];
  groups.forEach(([g, f]) => {
    const ks = keys.filter(f); let inner = "";
    ks.forEach(k => {
      const X = EX[k], b = bestFor(k, null); let main = "", sub = "";
      if (X.t==="w"){ main = fmtKg(b.kg)+" kg"; if (b.set) sub = `1RM est. ${fmtKg(b.e1)} kg · ${b.set.kg}×${b.set.reps}`; }
      else if (X.t==="c") main = fmtKg(b.kg)+" kg"; else if (X.t==="r") main = b.reps+" reps"; else if (X.t==="t") main = b.sec+" s"; else main = fmtKg(b.min)+" min";
      if (!(b.kg||b.reps||b.sec||b.min)) return;
      inner += `<div class="card pr-card tap" data-pr="${k}"><div class="thumb">${animHTML(k,false)}</div><div class="grow"><b style="font-weight:650">${esc(X.n)}</b><div class="sub">${esc(sub)}</div></div><div><div class="pr-v num">${main}</div>${b.date?`<div class="sub" style="text-align:right">${fmtD(b.date)}</div>`:""}</div></div>`;
    });
    if (inner) h += `<div class="h2"><span class="dot"></span>${g}</div><div class="stagger">${inner}</div>`;
  });
  return h;
}
function showPR(k){
  const X = EX[k], pts = [];
  [...DB.sessions].reverse().forEach(s => {
    const e = s.ex.find(x => x.k === k); if (!e) return; let v = 0;
    e.sets.forEach(st => { const kg = num(st.kg)||0, r = num(st.reps)||0; v = Math.max(v, X.t==="w"?e1rm(kg,r):X.t==="c"?kg:X.t==="r"?r:X.t==="t"?(num(st.sec)||0):(num(st.min)||0)); });
    pts.push({d:s.start, v, sets:e.sets});
  });
  const label = X.t==="w"?"1RM estimado (kg)":X.t==="c"?"carga (kg)":X.t==="r"?"repetições":X.t==="t"?"segundos":"minutos";
  let svg;
  if (pts.length > 1){
    const W=340,H=170,p=22, mx=Math.max(...pts.map(x=>x.v)), mn=Math.min(...pts.map(x=>x.v)), rg=(mx-mn)||1;
    const xy = pts.map((q,i) => [p+i*(W-2*p)/(pts.length-1), H-p-(q.v-mn)/rg*(H-2*p)]);
    const line = xy.map(a=>a.join(",")).join(" ");
    svg = `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8f542" stop-opacity=".35"/><stop offset="1" stop-color="#c8f542" stop-opacity="0"/></linearGradient></defs>
      <polygon fill="url(#gf)" points="${xy[0][0]},${H-p} ${line} ${xy[xy.length-1][0]},${H-p}"/>
      <polyline fill="none" stroke="#c8f542" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${line}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur=".9s" fill="freeze"/></polyline>
      ${xy.map(a=>`<circle cx="${a[0]}" cy="${a[1]}" r="4" fill="#09090c" stroke="#c8f542" stroke-width="2.5"/>`).join("")}
      <text x="${W-p}" y="14" fill="#8e8e9c" font-size="11" text-anchor="end">${fmtKg(mx)}</text><text x="${W-p}" y="${H-4}" fill="#8e8e9c" font-size="11" text-anchor="end">${fmtKg(mn)}</text></svg>`;
  } else svg = `<div class="empty" style="padding:20px">O gráfico aparece a partir do 2º registro.</div>`;
  sheet(`<div class="row"><div style="width:64px;height:64px;border-radius:18px;overflow:hidden">${animHTML(k,false)}</div><div class="grow"><h3>${esc(X.n)}</h3><div class="sub">Evolução · ${label}</div></div></div>${svg}
    <div class="h2">Registros</div>${[...pts].reverse().slice(0,20).map(q=>`<div class="row" style="padding:6px 0;font-size:14px"><b class="num" style="width:52px">${fmtD(q.d)}</b><span class="sub grow num">${q.sets.map(x=>esc(prevText(X.t,x))).join("  ·  ")}</span></div>`).join("")}
    <button class="btn ghost full" data-close style="margin-top:16px">Fechar</button>`);
}

/* ========= sheets, diálogos, toast, confete ========= */
let sheetClose = null;
function sheet(html, onClose){
  closeSheet(true);
  sheetClose = onClose || null;
  const ov = document.createElement("div"); ov.className = "ov"; ov.id = "ov";
  ov.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`;
  ov.addEventListener("click", ev => {
    if (ev.target === ov || ev.target.closest("[data-close]")) return closeSheet();
    let el;
    if ((el = ev.target.closest("[data-info]"))) return info(el.dataset.info);
    if ((el = ev.target.closest("[data-start]"))) return startWorkout(el.dataset.start);
  });
  // arrastar para fechar
  const sh = ov.querySelector(".sheet"); let y0 = null, dy = 0;
  sh.addEventListener("touchstart", e => { if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, {passive:true});
  sh.addEventListener("touchmove", e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 0){ sh.style.transform = `translateY(${dy}px)`; sh.style.transition = "none"; } }, {passive:true});
  sh.addEventListener("touchend", () => { if (y0 === null) return; sh.style.transition = "transform .3s var(--ease)"; if (dy > 110) closeSheet(); else sh.style.transform = ""; y0 = null; });
  document.body.appendChild(ov);
}
function closeSheet(instant){
  const ov = $("#ov"); if (!ov) return;
  const f = sheetClose; sheetClose = null; if (f) f();
  if (instant) { ov.remove(); return; }
  ov.classList.add("out"); setTimeout(() => ov.remove(), 240);
}
function ask(msg, ok, positive){
  return new Promise(res => {
    sheet(`<p style="font-size:17px;font-weight:600;margin:6px 0 20px;letter-spacing:-.01em">${esc(msg)}</p>
      <div class="row"><button class="btn ghost grow" data-close>Cancelar</button><button class="btn grow" id="dok" style="${positive?"":"background:var(--bad);color:#fff;box-shadow:none"}">${esc(ok)}</button></div>`, () => res(false));
    $("#dok").onclick = () => { sheetClose = null; closeSheet(); res(true); };
  });
}
function toast(msg){ const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }
function confetti(n){
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"); c.id = "confetti"; document.body.appendChild(c);
  const dpr = devicePixelRatio || 1, W = c.width = innerWidth*dpr, H = c.height = innerHeight*dpr, x = c.getContext("2d");
  const cols = ["#c8f542","#ffffff","#ffc84a","#6aa8ff","#9be15d"];
  const ps = Array.from({length:n}, () => ({x:W/2+(Math.random()-.5)*W*.3, y:H*.35, vx:(Math.random()-.5)*16*dpr, vy:(-Math.random()*16-6)*dpr, s:(Math.random()*6+4)*dpr, r:Math.random()*6, vr:(Math.random()-.5)*.3, c:cols[n%5===0?0:Math.floor(Math.random()*cols.length)]}));
  let f = 0; (function loop(){ x.clearRect(0,0,W,H); ps.forEach(p => { p.vy += .45*dpr; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x,p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); x.restore(); }); if (++f < 140) requestAnimationFrame(loop); else c.remove(); })();
}

/* ========= eventos ========= */
$("#app").addEventListener("click", async ev => {
  const t = ev.target;
  if (tab === "workout") return onWorkoutClick(t);
  let el;
  if ((el = t.closest("[data-start]"))) return startWorkout(el.dataset.start);
  if ((el = t.closest("[data-preview]"))) return preview(el.dataset.preview);
  if ((el = t.closest("[data-go]"))) { keepAwake(); return go(el.dataset.go); }
  if ((el = t.closest("[data-pr]"))) return showPR(el.dataset.pr);
  if ((el = t.closest("[data-del]"))) { const st = +el.dataset.del; if (await ask("Apagar este treino do histórico?", "Apagar")){ DB.sessions = DB.sessions.filter(s => s.start !== st); save(true); render(); } return; }
  if (t.closest("#exp")) return exportData();
  if ((el = t.closest("[data-wk]"))) { const n = histOff + (+el.dataset.wk); if (n <= 0){ histOff = n; haptic(6); renderKeep(); } return; }
  if ((el = t.closest("[data-hw]"))) { histOff = +el.dataset.hw; haptic(6); render(); return; }
  if (t.closest("[data-weekhist]")) { histOff = 0; return go("hist"); }
});
$("#app").addEventListener("change", ev => { if (ev.target.id === "imp" && ev.target.files[0]) importData(ev.target.files[0]); });
$("#app").addEventListener("input", ev => onInput(ev.target));
$("#app").addEventListener("focusin", ev => { if (ev.target.tagName === "INPUT" && ev.target.dataset.in) setTimeout(() => { try { ev.target.select(); } catch(e){} }, 0); });
document.querySelector(".tabs").addEventListener("click", ev => { const b = ev.target.closest("[data-tab]"); if (b){ haptic(6); go(b.dataset.tab); } });
setInterval(() => {
  if (!DB.active) return;
  const c = $("#clock"); if (c) c.textContent = fmtT((Date.now()-DB.active.start)/1000);
  const l = document.querySelector("[data-live]"); if (l) l.textContent = fmtT((Date.now()-DB.active.start)/1000);
}, 1000);
$("#app").addEventListener("change", ev => { if (ev.target.dataset && ev.target.dataset.in) updateProgress(); });

render();
if (DB.active) keepAwake();

/* ========= PWA: service worker + atualização ========= */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloaded) return; reloaded = true; save(true); location.reload(); });
  navigator.serviceWorker.register("sw.js", {updateViaCache: "none"}).then(reg => {
    reg.update().catch(() => {});
    reg.addEventListener("updatefound", () => {
      const nw = reg.installing; if (!nw) return;
      nw.addEventListener("statechange", () => { if (nw.state === "installed" && navigator.serviceWorker.controller) toast("Atualizando o app…"); });
    });
  }).catch(() => {});
}
