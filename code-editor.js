/* Standalone HTML pages coexist with visual pages in the project. */
function composeCodeDocument(code) {
  const html = String(code.html || ''), css = String(code.css || ''), js = String(code.js || '');
  const style = css ? '<style>\n' + css.replace(/<\/style/gi, '<\\/style') + '\n</style>' : '';
  const script = js ? '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>' : '';
  if (/<html[\s>]|<!doctype/i.test(html)) {
    let doc = html;
    if (style) doc = /<\/head\s*>/i.test(doc) ? doc.replace(/<\/head\s*>(?![\s\S]*<\/head\s*>)/i, () => style + '\n</head>') : style + doc;
    if (script) doc = /<\/body\s*>/i.test(doc) ? doc.replace(/<\/body\s*>(?![\s\S]*<\/body\s*>)/i, () => script + '\n</body>') : doc + script;
    return doc;
  }
  return '<!doctype html>\n<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Vlastní stránka</title>' + style + '</head><body>' + html + script + '</body></html>';
}
function renderCodeCanvas(page) {
  page.replaceChildren();
  const iframe = document.createElement('iframe');
  iframe.title = project.title + ' – náhled kódu';
  iframe.setAttribute('sandbox','allow-scripts allow-forms');
  iframe.className = 'code-page-frame';
  iframe.srcdoc = composeCodeDocument(project.customCode);
  page.appendChild(iframe); fitCanvas(); renderLayers();
}
function renderCodeProperties(summary, box) {
  summary.innerHTML = '<div class="selected-icon">&lt;/&gt;</div><div><strong>Stránka z kódu</strong><small>HTML · CSS · JavaScript</small></div>';
  box.innerHTML = section('Úprava kódu','<p class="hint">Tato stránka se upravuje přímo v kódu. Funkčnost vyzkoušíte tlačítkem Náhled.</p><button class="small-btn code-wide" data-code-edit>Upravit kód stránky</button><button class="small-btn code-wide" data-code-download>Stáhnout tuto stránku HTML</button>') + section('Výška náhledu',field('Výška · '+DEVICE_LABELS[device], 'height', project.pageHeights[device], {type:'number',scope:'page'})) + '<p class="hint">Vizuální prvky můžete dál používat na ostatních stránkách projektu.</p>';
}
function openCodeEditor(mode) {
  const dialog = document.getElementById('code-editor-dialog');
  const existing = mode === 'edit' && project.customCode;
  dialog._pageId = existing ? project.id : null;
  const draft = mode === 'template' ? clone(ESCAPE_TEMPLATE) : existing ? clone(project.customCode) : {html:'<main>\n  <h1>Moje nová stránka</h1>\n  <p>Sem vložte vlastní HTML.</p>\n</main>',css:'body { margin: 0; padding: 40px; font: 18px/1.6 system-ui; background: #f6f5ef; color: #26372d; }',js:'// Sem vložte JavaScript.\n'};
  ['html','css','js'].forEach(key => { document.getElementById('source-'+key).value = draft[key] || ''; });
  document.getElementById('source-title').value = existing ? project.title : mode === 'template' ? 'Šablona únikovky' : 'Vlastní stránka';
  document.getElementById('code-dialog-title').textContent = existing ? 'Upravit kód stránky' : mode === 'template' ? 'Tvoje vzdělávací únikovka' : 'Vložit vlastní kód';
  document.getElementById('code-apply').textContent = existing ? 'Použít změny' : 'Přidat jako novou stránku';
  document.getElementById('code-import-message').textContent = mode === 'template' ? 'Příběh, úkoly a odpovědi upravte na začátku části JavaScript. Ukázkové odpovědi: KLÍČ, MOST, SVĚTLO.' : 'Vložte HTML nebo načtěte soubor. CSS a JavaScript můžete doplnit v dalších záložkách.';
  document.getElementById('code-preview-frame').removeAttribute('srcdoc');
  document.getElementById('code-preview-frame').src = 'about:blank';
  document.getElementById('code-preview-label').textContent = 'Po změně kódu klikněte na Spustit náhled.';
  dialog._changed = false; selectCodeTab(mode === 'template' ? 'js' : 'html');
  dialog.showModal(); document.getElementById('source-title').focus();
}
function selectCodeTab(key) {
  document.querySelectorAll('[data-source-tab]').forEach(button => {const active=button.dataset.sourceTab===key;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
  ['html','css','js'].forEach(name => {document.getElementById('source-panel-'+name).hidden=name!==key;});
}
function codeDraft() {return Object.fromEntries(['html','css','js'].map(key=>[key,document.getElementById('source-'+key).value]));}
function closeCodeEditor() {
  const dialog = document.getElementById('code-editor-dialog');
  if(dialog._changed && !confirm('Zahodit neuložené změny kódu?'))return;
  document.getElementById('code-preview-frame').removeAttribute('srcdoc');
  dialog.close();
}
function initializeCodeEditor() {
  document.getElementById('code-new').addEventListener('click',()=>openCodeEditor('new'));
  document.getElementById('code-template').addEventListener('click',()=>openCodeEditor('template'));
  document.getElementById('code-template-download').addEventListener('click',()=>download('unikovka-sablona.html',composeCodeDocument(ESCAPE_TEMPLATE)));
  const dialog=document.getElementById('code-editor-dialog');
  dialog.addEventListener('input',()=>{dialog._changed=true;});
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeCodeEditor();});
  document.getElementById('code-close').addEventListener('click',closeCodeEditor);
  document.querySelectorAll('[data-source-tab]').forEach(button=>{
    button.addEventListener('click',()=>selectCodeTab(button.dataset.sourceTab));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const tabs=[...document.querySelectorAll('[data-source-tab]')], index=tabs.indexOf(button);
      const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;
      selectCodeTab(tabs[next].dataset.sourceTab);tabs[next].focus();
    });
  });
  document.getElementById('code-run').addEventListener('click',()=>{
    document.getElementById('code-preview-frame').srcdoc=composeCodeDocument(codeDraft());
    document.getElementById('code-preview-label').textContent='Náhled spuštěn. Po další úpravě jej spusťte znovu.';
  });
  document.getElementById('code-apply').addEventListener('click',()=>{
    const code=codeDraft(), title=document.getElementById('source-title').value.trim()||'Vlastní stránka';
    if(new Blob([JSON.stringify(code)]).size>2*1024*1024){document.getElementById('code-import-message').textContent='Kód je příliš velký. Limit pro jednu stránku je 2 MB.';return;}
    let page=dialog._pageId?site.pages.find(item=>item.id===dialog._pageId):null;
    if(dialog._pageId&&!page){toast('Stránka už neexistuje. Otevřete editor znovu.');return;}
    remember();
    if(!page) {
      let number=1;while(site.pages.some(item=>item.filename==='kod-'+number+'.html'))number++;
      page={id:uid(),title,filename:'kod-'+number+'.html',pageHeights:{desktop:1000,tablet:1100,mobile:1400},elements:[]};
      site.pages.push(page);
    }
    page.customCode=code;page.title=title;dialog._changed=false;
    document.getElementById('code-preview-frame').removeAttribute('srcdoc');
    dialog.close();switchPage(page.id);
    document.querySelector('[data-left-tab="pages"]').click();
    saveProject();
  });
  document.getElementById('code-import').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    const message=document.getElementById('code-import-message');
    if(file.size>2*1024*1024){message.textContent='Soubor je příliš velký. Limit je 2 MB.';event.target.value='';return;}
    try {
      const content=await file.text();
      document.getElementById('source-html').value=content;
      document.getElementById('source-css').value='';
      document.getElementById('source-js').value='';
      document.getElementById('source-title').value=file.name.replace(/\.html?$/i,'');
      dialog._changed=true;selectCodeTab('html');
      message.textContent='Načteno: '+file.name+'. Relativní odkazy na další soubory se nenahrávají; styly a skripty vložte přímo nebo použijte úplné URL.';
    }catch{message.textContent='Soubor se nepodařilo přečíst.';}
    event.target.value='';
  });
  document.getElementById('properties').addEventListener('click',event=>{
    if(event.target.closest('[data-code-edit]'))openCodeEditor('edit');
    if(event.target.closest('[data-code-download]'))download(pageFilename(project),composeCodeDocument(project.customCode));
  });
}
