// ====== PEGA AQUÍ LA CONFIGURACIÓN DE TU APP WEB DE FIREBASE ======
const CFG={apiKey:"TU_API_KEY",authDomain:"TU_PROYECTO.firebaseapp.com",projectId:"TU_PROYECTO",storageBucket:"TU_PROYECTO.appspot.com",messagingSenderId:"000000000000",appId:"TU_APP_ID"};
// ==================================================================
const $=s=>document.querySelector(s),M=$('#m'),S={cortes:[],operarios:[]},V={v:'home',tab:'recibido',op:null},F={};
let ready=0,FB=0,askR,put,rm;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P=n=>'$'+Math.round(n).toLocaleString('es-CO'),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const fd=d=>d?d.split('-').reverse().join('/'):'';
const tot=o=>(o.procesos||[]).reduce((a,p)=>a+p.cantidad*p.precio,0);
const op=()=>S.operarios.find(o=>o.id==V.op),cr=id=>S.cortes.find(c=>c.id==id);
const NM={recibido:'Recibidos',entregado:'Entregados',terminado:'Terminados'};
function toast(t,bad){const e=document.createElement('div');e.className='toast'+(bad?' bad':'');e.textContent=(bad?'':'✓ ')+t;document.body.append(e);setTimeout(()=>e.remove(),2600)}
function modal(h,c=''){M.innerHTML=`<div class="box ${c}">${h}</div>`;M.classList.add('on')}
function closeM(){M.classList.remove('on');M.innerHTML=''}
const ask=(m,ok='Eliminar',c='d')=>new Promise(r=>{askR=r;modal(`<p class="q">${m}</p><div class="row"><button class="btn g" data-a="ask0">Cancelar</button><button class="btn ${c}" data-a="ask1">${ok}</button></div>`)});
// ---- Datos: Firebase (Firestore) o, si no hay configuración, guardado local del navegador ----
const loc=(c,o)=>{const i=S[c].findIndex(x=>x.id==o.id);i<0?S[c].push(o):S[c][i]=o};
try{if(window.firebase&&!CFG.apiKey.startsWith('TU_')){firebase.initializeApp(CFG);const f=firebase.firestore();FB=1;
 for(const c of['cortes','operarios'])f.collection(c).onSnapshot(s=>{S[c]=s.docs.map(d=>d.data());render()},e=>toast('Error de conexión: '+e.code,1));
 put=(c,o)=>{loc(c,o);render();f.collection(c).doc(o.id).set(o).catch(e=>toast('No se pudo guardar: '+e.code,1))};
 rm=(c,id)=>{S[c]=S[c].filter(x=>x.id!=id);render();f.collection(c).doc(id).delete().catch(e=>toast('No se pudo eliminar: '+e.code,1))}}}catch(e){console.error(e)}
if(!FB){try{Object.assign(S,JSON.parse(localStorage.joms||'{}'))}catch(e){}
 const sv=()=>{try{localStorage.joms=JSON.stringify(S)}catch(e){toast('Memoria llena',1)}render()};
 put=(c,o)=>{loc(c,o);sv()};rm=(c,id)=>{S[c]=S[c].filter(x=>x.id!=id);sv()}}
// ---- Vistas ----
function render(){if(!ready)return;const c=S.cortes,n=e=>c.filter(x=>x.estado==e).length,T=S.operarios.reduce((a,o)=>a+tot(o),0);let h='';
 if(V.v=='home')h=`<h2 class="rise">Panel principal</h2><div class="grid">${Object.keys(NM).map((k,i)=>`<button class="stat rise" style="--i:${i}" data-a="go" data-v="cortes" data-t="${k}"><b>${n(k)}</b><span>Cortes ${NM[k].toLowerCase()}</span></button>`).join('')}<button class="stat rise" style="--i:3" data-a="go" data-v="ops"><b>${P(T)}</b><span>Total por pagar · ${S.operarios.length} operario(s)</span></button></div><div class="row wrap rise" style="--i:4"><button class="btn" data-a="addCorte">+ Agregar corte</button><button class="btn g" data-a="addOp">+ Agregar operario</button></div>${FB?'':'<p class="mu rise" style="--i:5;margin-top:22px;font-size:13px">Modo local: los datos solo se guardan en este navegador. Configura Firebase para guardarlos en la nube.</p>'}`;
 else if(V.v=='cortes'){const l=c.filter(x=>x.estado==V.tab).sort((a,b)=>(b.creado||0)-(a.creado||0));
  h=`<div class="top rise"><h2>Control de cortes</h2><button class="btn" data-a="addCorte">+ Agregar corte</button></div><div class="tabs rise">${Object.keys(NM).map(k=>`<button class="${V.tab==k?'on':''}" data-a="tab" data-t="${k}">${NM[k]} <i>${n(k)}</i></button>`).join('')}</div>`+(l.length?l.map((x,i)=>`<article class="card rise" style="--i:${i}"><div class="ph">${x.fotos.map((f,j)=>`<img src="${f}" alt="Foto ${j+1}" data-a="zoom" data-id="${x.id}" data-j="${j}">`).join('')}</div><div class="top"><h3>${esc(x.patron)}</h3><span class="bd ${x.estado}">${x.estado}</span></div><p><b>${x.cantidad}</b> pantalones</p><p class="mu">Recibido ${fd(x.fecha)}${x.fEnt?' · Entregado '+fd(x.fEnt):''}${x.fFin?' · Terminado '+fd(x.fFin):''}</p><div class="row wrap">${x.estado=='recibido'?`<button class="btn" data-a="entregar" data-id="${x.id}">Entregar corte</button>`:x.estado=='entregado'?`<button class="btn" data-a="terminar" data-id="${x.id}">Marcar terminado</button>`:''}<button class="btn g" data-a="editCorte" data-id="${x.id}">Editar</button><button class="btn d" data-a="delCorte" data-id="${x.id}">Eliminar</button></div></article>`).join(''):`<p class="empty rise">No hay cortes ${NM[V.tab].toLowerCase()}.</p>`)}
 else if(V.v=='ops'){const l=[...S.operarios].sort((a,b)=>a.nombre.localeCompare(b.nombre));
  h=`<div class="top rise"><h2>Operarios</h2><button class="btn" data-a="addOp">+ Agregar operario</button></div>`+(l.length?l.map((o,i)=>`<div class="card op rise" style="--i:${i}" data-a="openOp" data-id="${o.id}"><div><h3>${esc(o.nombre)}</h3><small>${o.procesos.length} proceso(s)</small></div><b class="mny">${P(tot(o))}</b></div>`).join(''):'<p class="empty rise">Aún no hay operarios.</p>')}
 else{const o=op();if(!o){V.v='ops';return render()}
  h=`<div class="rise"><button class="btn g" data-a="go" data-v="ops">← Operarios</button></div><div class="card hero rise" style="--i:1"><small>${esc(o.nombre)} · Total a pagar</small><b>${P(tot(o))}</b></div><div class="row wrap rise" style="--i:2"><button class="btn" data-a="addProc">+ Añadir proceso</button><button class="btn ok" data-a="pagar" ${tot(o)?'':'disabled'}>Pagar</button></div><div class="card rise" style="--i:3;margin-top:14px">${o.procesos.length?`<table>${o.procesos.map(p=>`<tr><td>${esc(p.trabajo)}<br><small>${p.cantidad} unidades</small></td><td class="r"><b>${P(p.cantidad*p.precio)}</b></td><td class="r" style="width:84px"><button class="ib" data-a="editProc" data-id="${p.id}">✎</button><button class="ib" data-a="delProc" data-id="${p.id}">✕</button></td></tr>`).join('')}<tr class="tt"><td>TOTAL A PAGAR</td><td class="r" colspan="2">${P(tot(o))}</td></tr></table>`:'<p class="empty">Sin procesos activos. Presiona «Añadir proceso».</p>'}</div><h3 class="rise" style="--i:4;margin:20px 0 10px">Historial de pagos</h3>${(o.pagos||[]).length?o.pagos.map(p=>`<details class="card"><summary>${new Date(p.fecha).toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short'})} — <b>${P(p.total)}</b></summary><table>${p.procesos.map(x=>`<tr><td>${esc(x.trabajo)}<br><small>${x.cantidad} unidades</small></td><td class="r">${P(x.cantidad*x.precio)}</td></tr>`).join('')}</table><div class="row"><button class="btn d" data-a="delPago" data-id="${p.id}">Eliminar pago</button></div></details>`).join(''):'<p class="mu">Todavía no hay pagos registrados.</p>'}<div class="row wrap" style="margin-top:24px"><button class="btn g" data-a="renOp">Renombrar operario</button><button class="btn d" data-a="delOp">Eliminar operario</button></div>`}
 const mm=$('#mm');mm.className=V.fx?'fx':'';mm.innerHTML=h;V.fx=0}
const nav=(v,t,o)=>{V.v=v;if(t)V.tab=t;V.op=o||null;V.fx=1;$('#mn').classList.remove('on');scrollTo(0,0);render()};
// ---- Cortes ----
const comp=f=>new Promise((r,x)=>{const i=new Image;i.onload=()=>{const k=Math.min(1,800/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(i.src);r(c.toDataURL('image/jpeg',.62))};i.onerror=x;i.src=URL.createObjectURL(f)});
const pv=()=>{$('#fv').innerHTML=F.fotos.map((f,j)=>`<div class="t"><img src="${f}" alt=""><button data-a="rmf" data-j="${j}">×</button></div>`).join('')};
function corteForm(id){const x=id&&cr(id)||{};F.id=x.id;F.fotos=[...(x.fotos||[])];
 modal(`<h3>${id?'Editar corte':'Agregar corte'}</h3><label>Cantidad de pantalones<input id="fc" type="number" inputmode="numeric" min="1" value="${x.cantidad||''}"></label><label>Nombre del patrón<input id="fp" value="${esc(x.patron||'')}"></label><label>Fecha en la que se recibió el corte<input id="ff" type="date" value="${x.fecha||today()}"></label>${id?`<label>Estado<select id="fe">${Object.keys(NM).map(s=>`<option value="${s}" ${x.estado==s?'selected':''}>${NM[s]}</option>`).join('')}</select></label>`:''}<label>Fotografías de referencia (mínimo 2, máximo 5)<input id="fi" type="file" accept="image/*" multiple></label><div id="fv" class="ph"></div><div class="row"><button class="btn g" data-a="close">Cancelar</button><button class="btn" data-a="saveCorte">Guardar</button></div>`);pv()}
function saveCorte(){const c=+$('#fc').value,p=$('#fp').value.trim();if(!(c>0)||!p)return toast('Completa la cantidad y el patrón',1);if(F.fotos.length<2)return toast('Sube mínimo 2 fotografías',1);
 const old=cr(F.id)||{},est=$('#fe')?$('#fe').value:old.estado||'recibido',x={...old,id:F.id||uid(),cantidad:c,patron:p,fecha:$('#ff').value||today(),estado:est,fotos:F.fotos,creado:old.creado||Date.now()};
 put('cortes',x);closeM();toast('¡Corte guardado!');V.v='cortes';V.tab=est;V.fx=1;render()}
// ---- Operarios ----
function opForm(ren){F.ren=ren;const o=ren&&op();modal(`<h3>${o?'Renombrar operario':'Agregar operario'}</h3><label>Nombre del operario<input id="on" value="${esc(o?o.nombre:'')}" placeholder="Operario ${S.operarios.length+1}"></label><div class="row"><button class="btn g" data-a="close">Cancelar</button><button class="btn" data-a="saveOp">Guardar</button></div>`);$('#on').focus()}
function saveOp(){const n=$('#on').value.trim();if(!n)return toast('Escribe un nombre',1);
 put('operarios',F.ren?{...op(),nombre:n}:{id:uid(),nombre:n,procesos:[],pagos:[],creado:Date.now()});closeM();toast(F.ren?'Nombre actualizado':'¡Operario agregado!')}
const calc=()=>{const r=$('#rs');if(r)r.textContent=P((+$('#pc').value||0)*(+$('#pr').value||0))};
function procForm(id){const o=op(),p=id&&o.procesos.find(x=>x.id==id)||{};F.pid=p.id;
 modal(`<h3>${id?'Editar proceso':'Añadir proceso'}</h3><small>${esc(o.nombre)}</small><label>Nombre del trabajo<input id="pt" value="${esc(p.trabajo||'')}" placeholder="Bolsillos"></label><label>Cantidad realizada<input id="pc" type="number" inputmode="numeric" min="0" value="${p.cantidad||''}"></label><label>Precio por unidad<input id="pr" type="number" inputmode="numeric" min="0" value="${p.precio||''}"></label><div class="res" id="rs">$0</div><div class="row"><button class="btn g" data-a="close">Cerrar</button><button class="btn" data-a="saveProc">${id?'Guardar':'Añadir proceso'}</button></div>`);calc()}
function saveProc(){const t=$('#pt').value.trim(),c=+$('#pc').value,r=+$('#pr').value;if(!t||!(c>0)||!(r>0))return toast('Completa trabajo, cantidad y precio',1);
 const o=op(),np={id:F.pid||uid(),trabajo:t,cantidad:c,precio:r};
 put('operarios',{...o,procesos:F.pid?o.procesos.map(p=>p.id==F.pid?np:p):[...o.procesos,np]});
 if(F.pid){closeM();toast('Proceso actualizado')}else{toast('¡Proceso añadido!');['pt','pc','pr'].forEach(i=>$('#'+i).value='');calc();$('#pt').focus()}}
// ---- Acciones ----
const acts={
 go:d=>nav(d.v,d.t),menu:()=>$('#mn').classList.toggle('on'),tab:d=>{V.tab=d.t;V.fx=1;render()},openOp:d=>nav('op',0,d.id),close:closeM,
 ask1:()=>{closeM();askR(1)},ask0:()=>{closeM();askR(0)},
 zoom:d=>modal(`<img class="big" src="${cr(d.id).fotos[d.j]}" alt="">`,'lb'),
 addCorte:()=>corteForm(),editCorte:d=>corteForm(d.id),rmf:d=>{F.fotos.splice(+d.j,1);pv()},saveCorte,
 entregar:d=>{put('cortes',{...cr(d.id),estado:'entregado',fEnt:today()});toast('¡Corte entregado con éxito!')},
 terminar:d=>{put('cortes',{...cr(d.id),estado:'terminado',fFin:today()});toast('¡Corte terminado con éxito!')},
 delCorte:async d=>{if(await ask('¿Eliminar este corte y sus fotografías?'))rm('cortes',d.id)},
 addOp:()=>opForm(0),renOp:()=>opForm(1),saveOp,
 delOp:async()=>{const o=op();if(await ask(`¿Eliminar a ${esc(o.nombre)} con todos sus procesos y pagos?`)){rm('operarios',o.id);nav('ops')}},
 addProc:()=>procForm(),editProc:d=>procForm(d.id),saveProc,
 delProc:async d=>{if(await ask('¿Eliminar este proceso?')){const o=op();put('operarios',{...o,procesos:o.procesos.filter(p=>p.id!=d.id)})}},
 pagar:async()=>{const o=op(),t=tot(o);if(!t)return;if(!await ask(`¿Registrar el pago de ${P(t)} a ${esc(o.nombre)}?`,'Pagar','ok'))return;
  put('operarios',{...o,pagos:[{id:uid(),fecha:new Date().toISOString(),total:t,procesos:o.procesos},...(o.pagos||[])],procesos:[]});toast('¡Pagado con éxito!')},
 delPago:async d=>{if(await ask('¿Eliminar este pago del historial?')){const o=op();put('operarios',{...o,pagos:o.pagos.filter(p=>p.id!=d.id)})}}
};
document.addEventListener('click',e=>{const t=e.target;if(t===M)return closeM();if(!t.closest('header'))$('#mn').classList.remove('on');const b=t.closest('[data-a]');if(b&&acts[b.dataset.a])acts[b.dataset.a](b.dataset,b)});
document.addEventListener('input',e=>{if(e.target.id=='pc'||e.target.id=='pr')calc()});
document.addEventListener('change',async e=>{if(e.target.id!='fi')return;for(const f of e.target.files){if(F.fotos.length>=5){toast('Máximo 5 fotografías',1);break}try{F.fotos.push(await comp(f))}catch(x){toast('No se pudo leer una imagen',1)}}e.target.value='';pv()});
setTimeout(()=>{ready=1;V.fx=1;render()},1900);
