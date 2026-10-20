/* Ateliér — the project model is also the single source for the exported page. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const WIDTHS = { desktop: 1200, tablet: 768, mobile: 375 };
const DEVICE_LABELS = { desktop: 'počítač', tablet: 'tablet', mobile: 'mobil' };
const STORAGE_KEY = 'atelier-web-project-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const uid = () => 'el-' + Math.random().toString(36).slice(2, 10);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const toast = message => { const box = $('#toast'); box.textContent = message; box.classList.remove('hidden'); clearTimeout(toast.timer); toast.timer = setTimeout(() => box.classList.add('hidden'), 3300); };
const typeNames = { heading:'Nadpis', text:'Text', button:'Tlačítko', image:'Obrázek', link:'Odkaz', input:'Vstupní pole', section:'Sekce', container:'Kontejner', shape:'Tvar', form:'Formulář' };
const typeIcons = { heading:'Tt', text:'☰', button:'▱', image:'▧', link:'↗', input:'▤', section:'▣', container:'□', shape:'◒', form:'▥' };
const ANIMATION_PRESETS = [['none','Bez animace'],['fade','Prolnutí'],['rise','Vjezd zdola'],['fall','Vjezd shora'],['left','Vjezd zleva'],['right','Vjezd zprava'],['zoom','Přiblížení'],['bounce','Pružný odraz'],['pulse','Pulzování'],['spin','Otočení']];
const ANIMATION_DEFAULT = {preset:'none',trigger:'load',duration:800,delay:0,repeat:'once'};
// The very same animation styles are used on the editor canvas and in the export.
const ANIMATION_CSS = `
[data-animation="fade"]{--animation-name:atelier-fade}
[data-animation="rise"]{--animation-name:atelier-rise}
[data-animation="fall"]{--animation-name:atelier-fall}
[data-animation="left"]{--animation-name:atelier-left}
[data-animation="right"]{--animation-name:atelier-right}
[data-animation="zoom"]{--animation-name:atelier-zoom}
[data-animation="bounce"]{--animation-name:atelier-bounce}
[data-animation="pulse"]{--animation-name:atelier-pulse}
[data-animation="spin"]{--animation-name:atelier-spin}
.page .canvas-element.anim-start,.page:not(.editing) .canvas-element[data-animation-trigger="hover"]:hover{animation-name:var(--animation-name);animation-duration:var(--animation-duration,800ms);animation-delay:var(--animation-delay,0ms);animation-iteration-count:var(--animation-count,1);animation-timing-function:ease;animation-fill-mode:both}
.page:not(.editing) .canvas-element[data-animation-trigger="scroll"]:not(.anim-start){opacity:0}
@keyframes atelier-fade{from{opacity:0}to{opacity:1}}
@keyframes atelier-rise{from{opacity:0;transform:translateY(35px)}to{opacity:1;transform:translateY(0)}}
@keyframes atelier-fall{from{opacity:0;transform:translateY(-35px)}to{opacity:1;transform:translateY(0)}}
@keyframes atelier-left{from{opacity:0;transform:translateX(-35px)}to{opacity:1;transform:translateX(0)}}
@keyframes atelier-right{from{opacity:0;transform:translateX(35px)}to{opacity:1;transform:translateX(0)}}
@keyframes atelier-zoom{from{opacity:0;transform:scale(.75)}to{opacity:1;transform:scale(1)}}
@keyframes atelier-bounce{0%{opacity:0;transform:translateY(35px)}60%{opacity:1;transform:translateY(-9px)}80%{transform:translateY(4px)}100%{transform:translateY(0)}}
@keyframes atelier-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes atelier-spin{from{opacity:0;transform:rotate(-180deg) scale(.8)}to{opacity:1;transform:rotate(0) scale(1)}}
@media(prefers-reduced-motion:reduce){.page .canvas-element.anim-start,.page:not(.editing) .canvas-element[data-animation-trigger="hover"]:hover{animation-duration:.01ms!important;animation-delay:0ms!important;animation-iteration-count:1!important}}
`;
const animationStyle = document.createElement('style'); animationStyle.textContent = ANIMATION_CSS; document.head.appendChild(animationStyle);

function makeElement(type, x = 100, y = 100) {
  const defaults = {
    heading: ['Váš nový nadpis', 420, 90, 48, '#26372d', 'transparent'],
    text: ['Sem napište svůj text. Každý skvělý příběh někde začíná.', 350, 80, 17, '#67746b', 'transparent'],
    button: ['Klikněte sem', 160, 48, 14, '#ffffff', '#2c4435'],
    image: ['', 300, 220, 16, '#26372d', '#e7ece3'],
    link: ['Text odkazu ↗', 180, 35, 15, '#344e3b', 'transparent'],
    input: ['', 260, 48, 14, '#35473a', '#ffffff'],
    section: ['', 1000, 280, 16, '#26372d', '#f0f3eb'],
    container: ['', 350, 220, 16, '#26372d', '#f4f4ed'],
    shape: ['', 120, 120, 16, '#26372d', '#e4b99e'],
    form: ['', 320, 240, 14, '#35473a', '#ffffff']
  }[type];
  const [text,w,h,fontSize,color,bg] = defaults;
  const makeLayout = (width, scale) => {
    const responsiveWidth = width === 1200 ? w : Math.min(width - 40, Math.max(type === 'button' ? 150 : 140, Math.round(w * (width === 375 ? .8 : scale))));
    return { x: Math.max(0,Math.min(Math.round(x * scale),width-responsiveWidth-20)), y, w: responsiveWidth, h, fontSize: Math.max(type === 'heading' ? 28 : 10, Math.round(fontSize * (width === 375 && type === 'heading' ? .72 : 1))) };
  };
  return { id: uid(), type, name: typeNames[type], text, props: { color, bg, fontFamily: type === 'heading' ? 'Georgia' : 'Arial', fontWeight: '400', borderColor:'#dce2d9', borderWidth: type === 'input' ? 1 : 0, radius: type === 'button' ? 5 : type === 'shape' ? 60 : 0, shadow:0, padding: type === 'button' ? 10 : type === 'form' ? 16 : 0, margin:0, align: type === 'button' ? 'center' : 'left', src: '', alt:'Obrázek', placeholder:'Napište sem…', required:false, fieldName:'zprava', inputType:'text', formTarget:'', formAction:'', formNameLabel:'Jméno', formEmailLabel:'E-mail', formButton:'Odeslat', action:{ type:'none', value:'', target:'' } }, layouts:{ desktop:makeLayout(1200,1), tablet:makeLayout(768,.64), mobile:makeLayout(375,.3125) } };
}

function sampleProject() {
  const project = { version:1, pageHeights:{desktop:1000,tablet:1100,mobile:1330}, elements:[] };
  const add = (type, name, text, desktop, tablet, mobile, props = {}) => {
    const el = makeElement(type); el.name = name; el.text = text; el.layouts = { desktop, tablet, mobile }; Object.assign(el.props, props); project.elements.push(el); return el;
  };
  const l = (x,y,w,h,fontSize) => ({x,y,w,h,fontSize});
  add('text','Logo','morrow.',l(80,45,180,36,27),l(48,40,150,34,25),l(28,30,130,32,23),{fontFamily:'Georgia',color:'#243d30'});
  add('text','Navigace','O NÁS     SLUŽBY     KONTAKT',l(714,53,340,25,11),l(392,49,300,24,10),l(28,78,290,24,10),{color:'#53675a',fontWeight:'700'});
  add('shape','Dekorace','',l(735,155,365,520,16),l(464,165,235,410,16),l(220,390,130,240,16),{bg:'#e8c7b3',radius:190});
  add('image','Úvodní obrázek','',l(700,185,350,465,16),l(430,190,240,360,16),l(48,425,270,310,16),{src:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=85',alt:'Světlý kreativní prostor',radius:180});
  add('text','Malý úvod','PROSTOR PRO NOVÉ NÁPADY',l(85,190,360,28,11),l(50,185,330,28,10),l(28,130,300,25,10),{fontWeight:'700',color:'#b4795f'});
  add('heading','Hlavní nadpis','Tvoříme prostor\npro vaše nápady.',l(80,238,620,170,67),l(48,226,400,150,48),l(28,165,320,130,38),{fontFamily:'Georgia',color:'#263d30'});
  add('text','Úvodní text','Věříme, že ty nejlepší věci vznikají s lehkostí. Společně proměníme vaše nápady v něco výjimečného.',l(85,430,470,75,17),l(50,392,350,90,15),l(28,300,305,90,15),{color:'#78877b'});
  const cta = add('button','Hlavní tlačítko','Pojďme se potkat  ↗',l(85,540,190,54,13),l(50,500,180,50,12),l(28,770,185,50,12),{bg:'#2c4435',color:'#ffffff',radius:4,fontWeight:'700',align:'center',padding:12});
  const footer = add('text','Doplňující text','PROMYŠLENĚ. JEDNODUŠE. SPOLEČNĚ.',l(85,765,460,25,10),l(50,665,410,25,10),l(28,875,310,25,9),{color:'#a2aca1',fontWeight:'700'});
  cta.props.action = {type:'scroll',value:'',target:footer.id};
  return project;
}

function asSite(value) {
  if (Array.isArray(value?.pages) && value.pages.length && value.pages.every(page => Array.isArray(page.elements) && page.pageHeights)) {
    value.version = 2;
    if (!value.pages.some(page => page.id === value.activePageId)) value.activePageId = value.pages[0].id;
    return value;
  }
  if (!Array.isArray(value?.elements) || !value.pageHeights) throw Error('invalid project');
  const page = { ...value, id:uid(), title:'Domovská stránka', filename:'index.html' };
  return { version:2, activePageId:page.id, pages:[page] };
}
let site, hadLocalProject = false;
try { const stored = localStorage.getItem(STORAGE_KEY); hadLocalProject=!!stored; site = asSite(stored ? JSON.parse(stored) : sampleProject()); }
catch { site = asSite(sampleProject()); }
let project = site.pages.find(page => page.id === site.activePageId);
let selected = null, device = 'desktop', propTab = 'design', preview = false, zoom = 1, history = [], future = [], activeFile = 'index.html', generated = {};
let dirty = false;

function remember() { history.push(JSON.stringify(site)); if (history.length > 60) history.shift(); future = []; dirty = true; $('#save-status').textContent = 'Neuložené změny'; }
function changeHistory(direction) {
  const from = direction === 'undo' ? history : future, to = direction === 'undo' ? future : history;
  if (!from.length) return;
  to.push(JSON.stringify(site)); site = asSite(JSON.parse(from.pop())); project = site.pages.find(page=>page.id===site.activePageId); selected = null; dirty = true; $('#save-status').textContent = 'Neuložené změny'; renderAll();
}
function pageFilename(page) { return site.pages[0].id === page.id ? 'index.html' : page.filename; }
function switchPage(id) { const page=site.pages.find(item=>item.id===id); if(!page)return; site.activePageId=id; project=page; selected=null; renderAll(); }
function renderPages() {
  $('#page-count').textContent=site.pages.length;
  $('#current-page-title').textContent=project.title;
  $('#page-breadcrumb').textContent=`STRÁNKA ${String(site.pages.indexOf(project)+1).padStart(2,'0')}`;
  $('#current-page-badge').textContent=site.pages[0]===project?'ÚVODNÍ STRÁNKA':'STRÁNKA WEBU';
  $('#pages-list').innerHTML=site.pages.map(page=>`<div class="page-entry ${page.id===project.id?'active':''}"><button class="page-select" data-page-select="${esc(page.id)}"><span class="page-entry-icon">▧</span><span><strong>${esc(page.title)}</strong><small>${esc(pageFilename(page))}</small></span></button>${page.id===project.id?`<div class="page-entry-details"><label>Název stránky<input data-page-title="${esc(page.id)}" value="${esc(page.title)}" maxlength="80"></label>${site.pages.length>1?`<button class="page-delete" data-page-delete="${esc(page.id)}">× &nbsp; Smazat stránku</button>`:''}</div>`:''}</div>`).join('');
}
function current() { return project.elements.find(item => item.id === selected); }
// Images keep their current proportions by default; existing projects do not need migrating.
function aspectLocked(el) { return el.props.aspectLocked ?? el.type === 'image'; }
// Older projects have one action; do not rewrite them until the user edits it.
function actionsFor(el) {
  if (Array.isArray(el.props.actions)) return el.props.actions;
  return el.props.action?.type && el.props.action.type !== 'none' ? [el.props.action] : [];
}
function editableActions(el) {
  if (!Array.isArray(el.props.actions)) {
    el.props.actions=actionsFor(el).map(action=>({...action}));
    delete el.props.action;
  }
  return el.props.actions;
}
function animationFor(el) {
  const value = {...ANIMATION_DEFAULT,...el.props.animation};
  if (!ANIMATION_PRESETS.some(([preset])=>preset===value.preset)) value.preset='none';
  if (!['load','scroll','hover'].includes(value.trigger)) value.trigger='load';
  value.duration=Math.max(100,Math.min(10000,num(value.duration,800)));
  value.delay=Math.max(0,Math.min(30000,num(value.delay,0)));
  value.repeat=value.repeat==='infinite'?'infinite':'once';
  return value;
}
function cssForElement(el, layout, z) {
  const p = el.props, animation=animationFor(el);
  return `left:${num(layout.x)/WIDTHS[device]*100}%;top:${num(layout.y)}px;width:${Math.max(1,num(layout.w))/WIDTHS[device]*100}%;height:${Math.max(1,num(layout.h))}px;z-index:${z};color:${p.color};background:${p.bg};font-family:${p.fontFamily};font-size:${num(layout.fontSize,16)}px;font-weight:${p.fontWeight};text-align:${p.align};border:${num(p.borderWidth)}px solid ${p.borderColor};border-radius:${num(p.radius)}px;box-shadow:${num(p.shadow) ? `0 ${num(p.shadow)}px ${num(p.shadow)*2}px #26372d38` : 'none'};padding:${num(p.padding)}px;margin:${num(p.margin)}px;white-space:pre-wrap;--animation-duration:${animation.duration}ms;--animation-delay:${animation.delay}ms;--animation-count:${animation.repeat==='infinite'?'infinite':'1'};`;
}
function elementInner(el) {
  const p = el.props;
  if (el.type === 'image') return p.src ? `<img src="${esc(p.src)}" alt="${esc(p.alt)}">` : '<div style="height:100%;display:grid;place-items:center;color:#98a99a;background:#edf1eb;font:14px Arial">▧ &nbsp; Přidejte obrázek</div>';
  if (el.type === 'input') return `<input type="${esc(p.inputType || 'text')}" name="${esc(p.fieldName || 'zprava')}" ${p.formTarget ? `form="${esc(p.formTarget)}-form"` : ''} aria-label="${esc(p.placeholder || 'Vstupní pole')}" placeholder="${esc(p.placeholder)}" ${p.required?'required':''} style="width:100%;height:100%;border:0;outline:0;background:transparent;color:inherit;text-align:inherit">`;
  if (el.type === 'form') return `<form id="${esc(el.id)}-form" class="canvas-form" ${p.formAction ? `action="${esc(p.formAction)}"` : ''} method="post"><label>${esc(p.formNameLabel || 'Jméno')}<input name="name" placeholder="Vaše jméno" required></label><label>${esc(p.formEmailLabel || 'E-mail')}<input type="email" name="email" placeholder="vas@email.cz" required></label><button type="submit">${esc(p.formButton || 'Odeslat')}</button></form>`;
  return esc(el.text).replace(/\n/g,'<br>');
}
function elementTag(el) { return el.type === 'button' ? 'button' : el.type === 'link' ? 'a' : el.type === 'heading' ? 'h1' : el.type === 'section' ? 'section' : 'div'; }
function elementMarkup(el, z, editing, exporting = false) {
  const tag = elementTag(el), p = el.props;
  const animation=animationFor(el), animationAttrs=animation.preset==='none'?'':` data-animation="${animation.preset}" data-animation-trigger="${animation.trigger}"`;
  const actionData=actionsFor(el).filter(item=>item?.type && item.type!=='none').map(item=>{
    const targetPage = exporting && item.type==='page' ? site.pages.find(page=>page.id===item.target) : null;
    return exporting && item.type==='page' ? {...item,value:targetPage ? pageFilename(targetPage) : ''} : item;
  });
  const action = actionData.length ? ` data-action="${esc(JSON.stringify(actionData))}"` : '';
  const attrs = tag === 'button' ? ' type="button"' : tag === 'a' ? ' href="#"' : '';
  return `<${tag} id="${esc(el.id)}" class="canvas-element${editing && selected === el.id ? ' selected' : ''}"${attrs}${action}${animationAttrs} style="${esc(cssForElement(el,el.layouts[device],z))}">${elementInner(el)}</${tag}>`;
}

function fitCanvas() {
  const width = WIDTHS[device], available = Math.max(180, $('#canvas-scroll').clientWidth - 60);
  zoom = Math.min(1, available / width);
  const page = $('#page'), wrap = $('#page-wrap');
  page.style.width = width + 'px'; page.style.height = project.pageHeights[device] + 'px'; page.style.transform = `scale(${zoom})`;
  wrap.style.width = width * zoom + 'px'; wrap.style.height = project.pageHeights[device] * zoom + 'px';
  $('#zoom-label').textContent = Math.round(zoom * 100) + ' %'; $('#canvas-size').textContent = `${width} × ${project.pageHeights[device]} px`;
}
function renderCanvas() {
  const page = $('#page');
  if (page._atelierAnimationObserver) page._atelierAnimationObserver.disconnect();
  page.classList.toggle('editing', !preview);
  page.innerHTML = project.elements.map((el,index) => elementMarkup(el,index+1,!preview)).join('');
  fitCanvas(); renderLayers();
  if (preview) startAnimations(page);
}
function renderLayers() {
  $('#layer-count').textContent = project.elements.length;
  $('#layers-list').innerHTML = [...project.elements].reverse().map(el => `<button class="layer ${selected===el.id?'active':''}" data-layer="${esc(el.id)}"><span>${typeIcons[el.type]}</span>${esc(el.name)}<span>⋮</span></button>`).join('');
}
function field(label, key, value, options = {}) {
  const type = options.type || 'text', scope = options.scope || 'props';
  const data=`data-key="${key}" data-scope="${scope}"${Number.isInteger(options.actionIndex)?` data-action-index="${options.actionIndex}"`:''}`;
  if (type === 'select') return `<label class="field"><span>${label}</span><select ${data}>${options.options.map(([v,n]) => `<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`;
  if (type === 'textarea') return `<label class="field"><span>${label}</span><textarea ${data}>${esc(value)}</textarea></label>`;
  if (type === 'color') return `<label class="field"><span>${label}</span><div class="color-row"><input type="color" ${data} value="${/^#[0-9a-f]{6}$/i.test(value)?value:'#ffffff'}"><input type="text" ${data} value="${esc(value)}" aria-label="${label} hodnota"></div></label>`;
  if (type === 'checkbox') return `<label class="field"><input type="checkbox" ${data} ${value?'checked':''}> ${label}</label>`;
  return `<label class="field"><span>${label}</span>${type==='number'?`<div class="input-wrap"><input type="number" ${data} value="${esc(value)}"><span>${esc(options.unit || 'px')}</span></div>`:`<input type="${type}" ${data} value="${esc(value)}">`}</label>`;
}
const section = (title, content) => `<div class="property-section"><div class="section-title"><strong>${title}</strong><span>⌃</span></div>${content}</div>`;
function renderProperties() {
  const el = current(), summary = $('#selected-summary'), box = $('#properties');
  if (!el) { summary.innerHTML = '<div class="selected-icon">✧</div><div><strong>Stránka</strong><small>Vyberte prvek na ploše</small></div><span>⌄</span>'; box.innerHTML = section('Nastavení stránky',field('Výška stránky · '+DEVICE_LABELS[device], 'height', project.pageHeights[device], {type:'number',scope:'page'})+'<p class="hint">Výšku stránky i umístění prvků můžete nastavit zvlášť pro počítač, tablet a mobil.</p>') + '<div class="empty-properties">Kliknutím na prvek upravíte jeho obsah, vzhled i chování.</div>'; return; }
  const p = el.props, pos = el.layouts[device];
  summary.innerHTML = `<div class="selected-icon">${typeIcons[el.type]}</div><div><strong>${esc(el.name)}</strong><small>${typeNames[el.type]} · ${DEVICE_LABELS[device]}</small></div><span>⌄</span>`;
  if (propTab === 'animation') {
    const a=animationFor(el);
    let html=field('Efekt','preset',a.preset,{type:'select',scope:'animation',options:ANIMATION_PRESETS});
    if (a.preset!=='none') {
      html+=field('Kdy se spustí','trigger',a.trigger,{type:'select',scope:'animation',options:[['load','Při načtení stránky'],['scroll','Při posunutí na prvek'],['hover','Při najetí myší']]});
      html+='<div class="property-grid">'+field('Délka','duration',a.duration,{type:'number',scope:'animation',unit:'ms'})+field('Zpoždění','delay',a.delay,{type:'number',scope:'animation',unit:'ms'})+'</div><p class="hint">1 000 ms = 1 sekunda. Délka může být 100–10 000 ms, zpoždění až 30 000 ms.</p>';
      html+=field('Opakování','repeat',a.repeat,{type:'select',scope:'animation',options:[['once','Jednou'],['infinite','Stále dokola']]});
      html+='<button class="small-btn animation-play" data-preview-animation>▷ &nbsp; Přehrát animaci</button><p class="hint">Efekt si vyzkoušejte zde nebo v náhledu. Animace platí pro všechna zařízení a bude součástí exportu.</p>';
    } else html+='<p class="hint">Vyberte efekt a nastavte, kdy a jak se má prvek rozpohybovat.</p>';
    box.innerHTML=section('Animace prvku',html); return;
  }
  if (propTab === 'action') {
    const actions=actionsFor(el);
    const choices = [['none','Žádná akce'],['page','Otevřít stránku webu'],['link','Otevřít externí odkaz'],['scroll','Posunout na prvek'],['toggle','Zobrazit / skrýt prvek'],['text','Změnit text prvku'],['alert','Zobrazit upozornění'],['submit','Odeslat formulář']];
    let html=actions.length ? '<p class="hint">Akce se provedou shora dolů, ve zvoleném pořadí.</p>' : '<p class="hint">Zatím tu není žádná akce. Přidejte, co se má stát po kliknutí.</p>';
    html+=actions.map((a,index)=>{
      const actionOptions={scope:'action',actionIndex:index};
      const targets = project.elements.filter(item => (item.id !== el.id || a.type === 'text') && (a.type !== 'submit' || item.type === 'form') && (a.type !== 'text' || ['heading','text','button','link'].includes(item.type))).map(item => [item.id, item.name+(item.id===el.id?' (tento prvek)':'')]);
      let fields=field('Co se má stát', 'type', a.type, {...actionOptions,type:'select',options:choices});
      if (a.type === 'page') fields += field('Cílová stránka','target',a.target,{...actionOptions,type:'select',options:[['','Vyberte stránku'],...site.pages.map(page=>[page.id,page.title])]});
      if (['scroll','toggle','text','submit'].includes(a.type)) fields += field('Cílový prvek','target',a.target,{...actionOptions,type:'select',options:[['','Vyberte prvek'],...targets]});
      if (['link','alert','text'].includes(a.type)) fields += field(a.type === 'link' ? 'Adresa odkazu' : a.type === 'alert' ? 'Text upozornění' : 'Nový text','value',a.value,{...actionOptions,type:'textarea'});
      return `<div class="action-card"><div class="action-card-header"><strong>Akce ${index+1}</strong><div class="action-card-buttons"><button type="button" data-action-op="up" data-index="${index}" aria-label="Posunout akci ${index+1} nahoru" title="Posunout nahoru" ${index===0?'disabled':''}>↑</button><button type="button" data-action-op="down" data-index="${index}" aria-label="Posunout akci ${index+1} dolů" title="Posunout dolů" ${index===actions.length-1?'disabled':''}>↓</button><button type="button" data-action-op="remove" data-index="${index}" aria-label="Odebrat akci ${index+1}" title="Odebrat akci">×</button></div></div>${fields}</div>`;
    }).join('');
    html += `<button type="button" class="small-btn add-action" data-action-op="add">＋ &nbsp; ${actions.length?'Přidat další akci':'Přidat akci'}</button><p class="hint">Akce fungují v náhledu i v exportu. Přechod na jinou stránku nebo odeslání formuláře může zbývající akce přerušit, proto je zařaďte nakonec.</p>`;
    if (el.type === 'form') html += `<div class="notice">Formulář kontroluje povinná pole. Skutečné odeslání vyžaduje adresu serveru nebo formulářové služby v záložce Vzhled.</div>`;
    box.innerHTML = section('Chování prvku',html); return;
  }
  let content = field('Název vrstvy','name',el.name,{scope:'element'});
  if (['heading','text','button','link'].includes(el.type)) content += field('Obsah','text',el.text,{type:'textarea',scope:'element'});
  if (el.type === 'image') content += field('Adresa obrázku','src',p.src) + field('Alternativní text','alt',p.alt) + '<label class="field"><span>Nebo nahrát obrázek do projektu</span><input id="image-upload" type="file" accept="image/*"></label><p class="hint">Nahraný obrázek se vloží přímo do exportovaného HTML.</p>';
  if (el.type === 'input') content += field('Zástupný text','placeholder',p.placeholder) + field('Název pole pro odeslání','fieldName',p.fieldName || 'zprava') + field('Typ pole','inputType',p.inputType || 'text',{type:'select',options:[['text','Text'],['email','E-mail'],['tel','Telefon'],['number','Číslo']]}) + field('Připojit k formuláři','formTarget',p.formTarget || '',{type:'select',options:[['','Bez formuláře'],...project.elements.filter(item=>item.type==='form').map(item=>[item.id,item.name])]}) + field('Povinné pole','required',p.required,{type:'checkbox'});
  if (el.type === 'form') content += field('Popisek prvního pole','formNameLabel',p.formNameLabel || 'Jméno') + field('Popisek e-mailu','formEmailLabel',p.formEmailLabel || 'E-mail') + field('Text tlačítka','formButton',p.formButton || 'Odeslat') + field('Adresa pro odeslání (URL)','formAction',p.formAction) + '<div class="notice">Povinná pole se ověřují v prohlížeči. Pro skutečné doručení zadejte adresu serveru nebo externí služby; bez ní se formulář neodešle. Další pole připojíte v jeho vlastnostech.</div>';
  let geometry = `<p class="hint">Rozměry a pozice platí pro: <strong>${DEVICE_LABELS[device]}</strong>.</p><div class="property-grid">${field('Pozice X','x',pos.x,{type:'number',scope:'layout'})}${field('Pozice Y','y',pos.y,{type:'number',scope:'layout'})}${field('Šířka','w',pos.w,{type:'number',scope:'layout'})}${field('Výška','h',pos.h,{type:'number',scope:'layout'})}</div><label class="aspect-lock"><input type="checkbox" data-key="aspectLocked" data-scope="props" ${aspectLocked(el)?'checked':''}><span><strong>Zachovat poměr stran</strong><small>Šířka a výška se mění společně</small></span><span class="aspect-lock-icon" aria-hidden="true">${aspectLocked(el)?'🔒':'🔓'}</span></label>`;
  if (['heading','text','button','link','input','form'].includes(el.type)) geometry += field('Velikost písma','fontSize',pos.fontSize,{type:'number',scope:'layout'});
  let typography = field('Písmo','fontFamily',p.fontFamily,{type:'select',options:[['Arial','Arial'],['Georgia','Georgia'],['Verdana','Verdana'],['Tahoma','Tahoma'],['Trebuchet MS','Trebuchet MS'],['Courier New','Courier New']]}) + field('Řez','fontWeight',p.fontWeight,{type:'select',options:[['400','Běžný'],['700','Tučný']]}) + field('Barva textu','color',p.color,{type:'color'}) + field('Zarovnání','align',p.align,{type:'select',options:[['left','Vlevo'],['center','Na střed'],['right','Vpravo']]});
  let appearance = field('Pozadí (barva nebo transparent)','bg',p.bg,{type:'color'}) + '<div class="property-grid">' + field('Rámeček','borderWidth',p.borderWidth,{type:'number'}) + field('Zaoblení','radius',p.radius,{type:'number'}) + field('Vnitřní mezera','padding',p.padding,{type:'number'}) + field('Vnější mezera','margin',p.margin,{type:'number'}) + field('Stín','shadow',p.shadow,{type:'number'}) + '</div>' + field('Barva rámečku','borderColor',p.borderColor,{type:'color'});
  box.innerHTML = section('Obsah',content) + section('Rozložení',geometry) + section('Typografie',typography) + section('Vzhled',appearance) + section('Pořadí a úpravy','<div class="property-actions"><button class="small-btn" data-operation="back">↓ Dozadu</button><button class="small-btn" data-operation="front">↑ Dopředu</button></div><div class="property-actions" style="margin-top:7px"><button class="small-btn" data-operation="duplicate">⧉ Kopírovat</button><button class="small-btn" data-operation="delete">× Smazat</button></div>');
}
function renderAll() { renderPages(); renderCanvas(); renderProperties(); }

function addElement(type, x, y) {
  remember(); const scale = WIDTHS[device] / 1200;
  const el = makeElement(type, x === undefined ? 100 : x/scale, y === undefined ? 100 : y);
  if (x !== undefined) { el.layouts[device].x = Math.round(x); el.layouts[device].y = Math.round(y); }
  project.elements.push(el); selected = el.id; renderAll();
  if (window.innerWidth <= 700) $('.right-panel').classList.add('mobile-open');
  toast(`${typeNames[type]} přidán na stránku`);
}
function operate(op) {
  const index = project.elements.findIndex(el=>el.id===selected); if(index<0) return;
  remember();
  if (op==='delete') { project.elements.splice(index,1); selected=null; }
  if (op==='duplicate') { const el=clone(project.elements[index]); el.id=uid(); el.name += ' kopie'; Object.values(el.layouts).forEach(l=>{l.x+=15;l.y+=15}); project.elements.splice(index+1,0,el); selected=el.id; }
  if (op==='front' && index<project.elements.length-1) [project.elements[index],project.elements[index+1]]=[project.elements[index+1],project.elements[index]];
  if (op==='back' && index>0) [project.elements[index],project.elements[index-1]]=[project.elements[index-1],project.elements[index]];
  renderAll();
}

function mountActions(root) {
  root.addEventListener('click', event => {
    if (root.classList && root.classList.contains('editing')) return;
    const source = event.target.closest('[data-action]'); if (!source || !root.contains(source)) return;
    let stored; try { stored=JSON.parse(source.dataset.action); } catch { return; }
    const actions=Array.isArray(stored)?stored:[stored];
    event.preventDefault();
    for (const action of actions) {
      if (!action || typeof action!=='object') continue;
      const target = action.target ? root.querySelector('#' + CSS.escape(action.target)) : null;
      if (action.type==='page') {
        const navigation = new CustomEvent('atelier:navigate',{detail:action.target,cancelable:true});
        root.dispatchEvent(navigation);
        if (!navigation.defaultPrevented && action.value) window.location.href=action.value;
        // A page change ends this sequence in both preview and export.
        break;
      }
      if (action.type==='link' && action.value) {
        const url=action.value.trim();
        try { const parsed=new URL(url,document.baseURI); if (!['http:','https:','mailto:','tel:','file:'].includes(parsed.protocol)) throw Error('unsupported protocol'); window.open(url, '_blank', 'noopener'); }
        catch { alert('Zadejte platnou adresu, například https://example.com nebo dalsi-stranka.html.'); }
      }
      if (action.type==='scroll' && target) target.scrollIntoView({behavior:'smooth',block:'start'});
      if (action.type==='toggle' && target) target.hidden = !target.hidden;
      if (action.type==='text' && target) target.textContent = action.value || '';
      if (action.type==='alert') alert(action.value || 'Upozornění');
      if (action.type==='submit' && target) { const form=target.matches('form') ? target : target.querySelector('form'); if (form) form.requestSubmit(); }
    }
  });
  root.addEventListener('submit', event => {
    if (root.classList && root.classList.contains('editing')) { event.preventDefault(); return; }
    const form = event.target;
    if (!form.getAttribute('action')) { event.preventDefault(); alert('Formulář je vyplněn správně, ale není nastavena adresa pro odeslání. Pro doručení je potřeba server nebo externí služba.'); }
  });
}
function startAnimations(root) {
  if (root._atelierAnimationObserver) root._atelierAnimationObserver.disconnect();
  const elements=[...root.querySelectorAll('[data-animation]')];
  elements.filter(node=>node.dataset.animationTrigger==='load').forEach(node=>node.classList.add('anim-start'));
  const onScroll=elements.filter(node=>node.dataset.animationTrigger==='scroll');
  if (!onScroll.length) return;
  if (!('IntersectionObserver' in window)) { onScroll.forEach(node=>node.classList.add('anim-start')); return; }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('anim-start');observer.unobserve(entry.target);}});
  },{threshold:0.1});
  root._atelierAnimationObserver=observer;
  onScroll.forEach(node=>observer.observe(node));
}
mountActions($('#page'));
$('#page').addEventListener('atelier:navigate',event=>{event.preventDefault();if(site.pages.some(page=>page.id===event.detail)) switchPage(event.detail);else toast('Nejdříve vyberte cílovou stránku.');});

function exportedCSS() {
  const originalDevice=device;
  const rules = key => { device=key; return site.pages.map(page=>`body[data-page="${page.id}"] .page{height:${page.pageHeights[key]}px}\n`+page.elements.map((el,index)=>`body[data-page="${page.id}"] #${el.id}{${cssForElement(el,el.layouts[key],index+1)}}`).join('\n')).join('\n'); };
  const base=rules('desktop'), tablet=rules('tablet'), mobile=rules('mobile'); device=originalDevice;
  return `/* Vygenerováno v Ateliéru. Rozměry odpovídají návrhu pro jednotlivá zařízení. */\n*{box-sizing:border-box}\nhtml{scroll-behavior:smooth}\nbody{margin:0}\n.page{position:relative;width:100%;overflow:hidden;background:#fff}\n.canvas-element{position:absolute;box-sizing:border-box;overflow:hidden;margin:0}\n.canvas-element[hidden]{display:none!important}\n.canvas-element img{display:block;width:100%;height:100%;object-fit:cover}\n.canvas-form{display:flex;flex-direction:column;gap:10px;font:inherit;height:100%}\n.canvas-form label{font-size:.8em;font-weight:600;display:flex;flex-direction:column;gap:5px}\n.canvas-form input{font:inherit;height:38px;border:1px solid #dcded8;border-radius:4px;padding:0 10px;background:#fff}\n.canvas-form button{border:0;background:#283b30;color:#fff;border-radius:4px;padding:11px;cursor:pointer}\n${ANIMATION_CSS}\n${base}\n@media(max-width:1024px){\n${tablet}\n}\n@media(max-width:600px){\n${mobile}\n}\n`;
}
function exportFiles() {
  const originalDevice=device; device='desktop';
  const files={};
  site.pages.forEach(page=>{
    const elements=page.elements.map((el,index)=>elementMarkup(el,index+1,false,true).replace(/ style="[^"]*"(?=>)/,'')).join('\n    ');
    files[pageFilename(page)]=`<!doctype html>\n<html lang="cs">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${esc(page.title)}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body data-page="${esc(page.id)}">\n  <main class="page">\n    ${elements}\n  </main>\n  <script src="script.js"><\/script>\n</body>\n</html>\n`;
  });
  device=originalDevice;
  files['style.css']=exportedCSS();
  files['script.js']=`/* Interakce a animace stránek vygenerovaných v Ateliéru. */\n(${mountActions.toString()})(document);\n(${startAnimations.toString()})(document);\n`;
  return files;
}
function updateExport() { generated=exportFiles(); if(!generated[activeFile])activeFile='index.html'; $('#code-tabs').innerHTML=Object.keys(generated).map(name=>`<button data-file="${esc(name)}" class="${name===activeFile?'active':''}">${esc(name)}</button>`).join(''); $('#export-code').textContent=generated[activeFile]; }
function download(name, content) { const blob=content instanceof Blob ? content : new Blob([content],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
function zipFiles(files) {
  const encoder=new TextEncoder(), chunks=[], central=[]; let offset=0, directorySize=0;
  const crc32=bytes=>{let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^(0xedb88320 & -(crc&1));}return (crc^0xffffffff)>>>0;};
  for(const [name,content] of Object.entries(files)) {
    const filename=encoder.encode(name), data=encoder.encode(content), checksum=crc32(data);
    const local=new Uint8Array(30+filename.length), l=new DataView(local.buffer);
    l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);l.setUint16(12,33,true);l.setUint32(14,checksum,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,filename.length,true);local.set(filename,30);
    const entry=new Uint8Array(46+filename.length), c=new DataView(entry.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,33,true);c.setUint32(16,checksum,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,filename.length,true);c.setUint32(42,offset,true);entry.set(filename,46);
    chunks.push(local,data);central.push(entry);offset+=local.length+data.length;directorySize+=entry.length;
  }
  const end=new Uint8Array(22), e=new DataView(end.buffer); e.setUint32(0,0x06054b50,true);e.setUint16(8,central.length,true);e.setUint16(10,central.length,true);e.setUint32(12,directorySize,true);e.setUint32(16,offset,true);
  return new Blob([...chunks,...central,end],{type:'application/zip'});
}

function accountDisplay() {
  $('#account-title').textContent='Ukládání v prohlížeči';
  $('#account-description').textContent='Projekty se ukládají pouze v tomto prohlížeči na tomto zařízení. Pro zálohu hotového webu použijte Exportovat kód → Stáhnout ZIP.';
}
function saveProject() {
  try {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(site));
    hadLocalProject=true;dirty=false;
    $('#save-status').textContent='Uloženo v prohlížeči';
    toast('Projekt je uložen v tomto prohlížeči.');
  } catch {
    dirty=true;
    $('#save-status').textContent='Uložení se nepodařilo';
    toast('Projekt se nepodařilo uložit. Zkontrolujte dostupné místo v prohlížeči.');
  }
}

// Editor controls
$$('[data-left-tab]').forEach(button=>button.addEventListener('click',()=>{ $$('[data-left-tab]').forEach(b=>b.classList.toggle('active',b===button)); ['elements','layers','pages'].forEach(name=>$('#'+name+'-pane').classList.toggle('hidden',button.dataset.leftTab!==name)); }));
$('#add-page').addEventListener('click',()=>{
  remember(); let number=site.pages.length+1; while(site.pages.some(page=>page.filename===`stranka-${number}.html`))number++;
  const page={id:uid(),title:`Nová stránka ${number}`,filename:`stranka-${number}.html`,pageHeights:{desktop:1000,tablet:1100,mobile:1330},elements:[]};site.pages.push(page);switchPage(page.id);toast('Nová stránka je připravená.');
});
$('#pages-list').addEventListener('click',event=>{
  const select=event.target.closest('[data-page-select]'); if(select){switchPage(select.dataset.pageSelect);return;}
  const remove=event.target.closest('[data-page-delete]'); if(!remove || site.pages.length<2)return;
  const page=site.pages.find(item=>item.id===remove.dataset.pageDelete);if(!page || !confirm(`Smazat stránku „${page.title}“ a její prvky?`))return;
  remember();site.pages=site.pages.filter(item=>item.id!==page.id);site.pages.forEach(item=>item.elements.forEach(el=>actionsFor(el).forEach(action=>{if(action.type==='page'&&action.target===page.id)action.target='';})));switchPage(site.pages[0].id);toast('Stránka byla smazána.');
});
$('#pages-list').addEventListener('change',event=>{const id=event.target.dataset.pageTitle;if(!id)return;const page=site.pages.find(item=>item.id===id);if(!page)return;const title=event.target.value.trim()||'Stránka';if(title!==page.title){remember();page.title=title;}renderAll();});
function applyTheme(dark) {document.body.classList.toggle('dark',dark);$('#theme-btn').setAttribute('aria-pressed',String(dark));$('#theme-btn').title=dark?'Přepnout světlý režim':'Přepnout tmavý režim';$('#theme-btn').setAttribute('aria-label',$('#theme-btn').title);$('#theme-btn').innerHTML=dark?'<span>☼</span> <b>Světlý režim</b>':'<span>☾</span> <b>Tmavý režim</b>';}
try { applyTheme(localStorage.getItem('atelier-theme')==='dark'); } catch { applyTheme(false); }
$('#theme-btn').addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');applyTheme(dark);try{localStorage.setItem('atelier-theme',dark?'dark':'light');}catch{toast('Nastavení vzhledu nelze v tomto prohlížeči uložit.');}});
$$('[data-add]').forEach(button=>{ button.addEventListener('click',()=>addElement(button.dataset.add)); button.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',button.dataset.add)); });
$('#page').addEventListener('dragover',event=>{ if (!preview) event.preventDefault(); });
$('#page').addEventListener('drop',event=>{ event.preventDefault(); const type=event.dataTransfer.getData('text/plain'); if (!typeNames[type] || preview) return; const rect=$('#page').getBoundingClientRect(); addElement(type,(event.clientX-rect.left)/zoom,(event.clientY-rect.top)/zoom); });
$('#layers-list').addEventListener('click',event=>{const layer=event.target.closest('[data-layer]'); if(layer){selected=layer.dataset.layer;renderAll();}});
$$('[data-prop-tab]').forEach(button=>button.addEventListener('click',()=>{propTab=button.dataset.propTab;$$('[data-prop-tab]').forEach(b=>b.classList.toggle('active',b===button));renderProperties();}));
$$('[data-device]').forEach(button=>button.addEventListener('click',()=>{device=button.dataset.device;$$('[data-device]').forEach(b=>b.classList.toggle('active',b===button));renderAll();}));
$('#fit-btn').addEventListener('click',fitCanvas); window.addEventListener('resize',fitCanvas);
$('#undo-btn').addEventListener('click',()=>changeHistory('undo')); $('#redo-btn').addEventListener('click',()=>changeHistory('redo'));
$('#save-btn').addEventListener('click',saveProject);
$('#account-btn').addEventListener('click',()=>{const panel=$('#account-panel');panel.classList.toggle('hidden');$('#account-btn').setAttribute('aria-expanded',String(!panel.classList.contains('hidden')));});
$('#preview-btn').addEventListener('click',()=>{preview=!preview;document.body.classList.toggle('previewing',preview);$('#preview-btn').innerHTML=preview?'<span>✎</span> Zpět do editoru':'<span>▷</span> Náhled';$('.workspace-note span:last-child').textContent=preview?'Režim náhledu':'Režim úprav';renderAll();});
$('#export-btn').addEventListener('click',()=>{activeFile='index.html';updateExport();$('#export-modal').classList.remove('hidden');});
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).classList.add('hidden')));
$('#export-modal').addEventListener('click',e=>{if(e.target.id==='export-modal') e.currentTarget.classList.add('hidden');});
$('#code-tabs').addEventListener('click',event=>{const b=event.target.closest('[data-file]');if(b){activeFile=b.dataset.file;updateExport();}});
$('#download-code').addEventListener('click',()=>download(activeFile,generated[activeFile]));
$('#download-zip').addEventListener('click',()=>{download('muj-web.zip',zipFiles(generated));toast('ZIP obsahuje všechny stránky, styly a skript.');});
$('#copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(generated[activeFile]);toast('Obsah souboru zkopírován.');}catch{const area=document.createElement('textarea');area.value=generated[activeFile];document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();toast('Obsah souboru zkopírován.');}});
function applyProperty(input) {
  const el=current(), {key,scope}=input.dataset;
  if(!key || (!el && scope!=='page')) return;
  // Incomplete numbers or colors stay in the field until they become valid.
  if(input.type==='number' && (input.value==='' || !Number.isFinite(Number(input.value)))) return;
  if(input.closest('.color-row') && !CSS.supports('color',input.value)) return;
  let value=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;
  if (scope==='page') value=Math.max(200,value);
  if (['w','h','fontSize'].includes(key)) value=Math.max(1,value);
  if (['borderWidth','radius','padding','shadow'].includes(key)) value=Math.max(0,value);
  if (scope==='animation' && key==='duration') value=Math.max(100,Math.min(10000,value));
  if (scope==='animation' && key==='delay') value=Math.max(0,Math.min(30000,value));
  const actionIndex=Number(input.dataset.actionIndex);
  if(scope==='action' && (!Number.isInteger(actionIndex) || !actionsFor(el)[actionIndex])) return;
  let target=scope==='page'?project.pageHeights:scope==='element'?el:scope==='layout'?el.layouts[device]:scope==='action'?actionsFor(el)[actionIndex]:scope==='animation'?(el.props.animation ||= {...ANIMATION_DEFAULT}):el.props;
  const targetKey=scope==='page'?device:key;
  const previous=key==='aspectLocked'?aspectLocked(el):target[targetKey];
  if(previous===value) return;
  if(!input._atelierSnapshot) { remember(); input._atelierSnapshot=true; }
  if(scope==='action') {
    target=editableActions(el)[actionIndex];
    if(key==='type') { target.value='';target.target=''; }
  }
  if(scope==='layout' && (key==='w'||key==='h') && aspectLocked(el)) {
    // Freeze the ratio for the whole edit, even while the user types a number.
    const pos=el.layouts[device];
    input._atelierRatio ||= Math.max(1,num(pos.w,1))/Math.max(1,num(pos.h,1));
    const other=key==='w'?'h':'w';
    pos[other]=Math.max(1,Math.round(key==='w'?value/input._atelierRatio:value*input._atelierRatio));
    const otherInput=$(`[data-scope="layout"][data-key="${other}"]`,$('#properties'));
    if(otherInput) otherInput.value=pos[other];
  }
  target[targetKey]=value;
  const colorRow=input.closest('.color-row');
  if(colorRow) {
    const colorInput=$('input[type="color"]',colorRow), textInput=$('input[type="text"]',colorRow);
    if(input===colorInput) textInput.value=value;
    else if(/^#[0-9a-f]{6}$/i.test(value)) colorInput.value=value;
  }
  renderCanvas();
  if(scope==='element' && key==='name') $('#selected-summary strong').textContent=value;
}
$('#properties').addEventListener('input',event=>{
  const input=event.target;
  if(input.id==='image-upload' || input.type==='checkbox' || input.tagName==='SELECT') return;
  applyProperty(input);
});
$('#properties').addEventListener('change',event=>{
  const input=event.target, el=current();
  if(input.id==='image-upload' && el && input.files?.[0]) { const reader=new FileReader();reader.onload=()=>{remember();el.props.src=reader.result;renderAll();};reader.readAsDataURL(input.files[0]);return; }
  applyProperty(input);
  // Refresh dependent controls only after editing finishes, keeping focus and the color picker open during input.
  renderAll();
});
$('#properties').addEventListener('click',e=>{
  const actionButton=e.target.closest('[data-action-op]');
  if(actionButton) {
    const el=current();if(!el)return;
    const op=actionButton.dataset.actionOp, index=Number(actionButton.dataset.index), existing=actionsFor(el);
    if(op!=='add' && (!Number.isInteger(index) || index<0 || index>=existing.length))return;
    if((op==='up' && index===0) || (op==='down' && index===existing.length-1))return;
    remember();const actions=editableActions(el);
    if(op==='add') actions.push({type:'none',value:'',target:''});
    if(op==='remove') actions.splice(index,1);
    if(op==='up') [actions[index-1],actions[index]]=[actions[index],actions[index-1]];
    if(op==='down') [actions[index],actions[index+1]]=[actions[index+1],actions[index]];
    renderAll();return;
  }
  const b=e.target.closest('[data-operation]');if(b){operate(b.dataset.operation);return;}
  if(!e.target.closest('[data-preview-animation]'))return;
  const el=current(),node=el&&document.getElementById(el.id);if(!node)return;
  const a=animationFor(el),originalCount=a.repeat==='infinite'?'infinite':'1';
  node.classList.remove('anim-start');void node.offsetWidth;
  node.style.setProperty('--animation-count','1');node.classList.add('anim-start');
  clearTimeout(node._animationTimer);
  node._animationTimer=setTimeout(()=>{node.classList.remove('anim-start');node.style.setProperty('--animation-count',originalCount);},a.duration+a.delay+100);
});

let drag=null;
$('#page').addEventListener('pointerdown',event=>{
  if(preview) return;
  const node=event.target.closest('.canvas-element');
  if(!node){selected=null;renderAll();return;}
  if(node.isContentEditable) return;
  event.preventDefault(); const el=project.elements.find(item=>item.id===node.id);if(!el)return;
  selected=el.id; const rect=node.getBoundingClientRect();
  const resize=event.clientX>rect.right-14 && event.clientY>rect.bottom-14;
  drag={id:el.id,startX:event.clientX,startY:event.clientY,layout:clone(el.layouts[device]),resize,changed:false};
  $$('.canvas-element', $('#page')).forEach(item=>item.classList.toggle('selected',item.id===selected));renderLayers();renderProperties();
  if(window.innerWidth<=700) $('.right-panel').classList.add('mobile-open');
});
document.addEventListener('pointermove',event=>{
  if(!drag)return; const el=project.elements.find(item=>item.id===drag.id);if(!el)return;
  const dx=Math.round((event.clientX-drag.startX)/zoom),dy=Math.round((event.clientY-drag.startY)/zoom);
  if(!drag.changed && (Math.abs(dx)>2||Math.abs(dy)>2)){remember();drag.changed=true;}
  if(!drag.changed)return;
  const pos=el.layouts[device]; if(drag.resize){
    if(aspectLocked(el)) {
      const width=Math.max(1,drag.layout.w), height=Math.max(1,drag.layout.h);
      const change=Math.abs(dx/width)>=Math.abs(dy/height)?dx/width:dy/height;
      const scale=Math.max(20/width,20/height,1+change);
      pos.w=Math.round(width*scale);pos.h=Math.round(height*scale);
    } else {pos.w=Math.max(20,drag.layout.w+dx);pos.h=Math.max(20,drag.layout.h+dy);}
  }else{pos.x=drag.layout.x+dx;pos.y=drag.layout.y+dy;}renderCanvas();
});
document.addEventListener('pointerup',()=>{if(drag?.changed)renderProperties();drag=null;});
$('#page').addEventListener('dblclick',event=>{
  if(preview)return; const node=event.target.closest('.canvas-element'),el=node&&project.elements.find(item=>item.id===node.id);
  if(!el||!['heading','text','button','link'].includes(el.type))return;
  remember();node.contentEditable='true';node.focus();const range=document.createRange();range.selectNodeContents(node);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
  node.addEventListener('blur',()=>{el.text=node.innerText.replace(/\n+$/,'');node.contentEditable='false';renderAll();},{once:true});
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){$('#export-modal').classList.add('hidden');$('.right-panel').classList.remove('mobile-open');return;}
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||document.activeElement.isContentEditable;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!typing){event.preventDefault();changeHistory(event.shiftKey?'redo':'undo');return;}
  if(typing||preview||!current())return;
  if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();operate('delete');}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='d'){event.preventDefault();operate('duplicate');}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();remember();const l=current().layouts[device],step=event.shiftKey?10:1;l.x+=(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0);l.y+=(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0);renderAll();}
});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
renderAll();
try { if(localStorage.getItem(STORAGE_KEY)) $('#save-status').textContent='Uloženo v prohlížeči'; } catch { /* Storage may be disabled by the browser. */ }
accountDisplay();
