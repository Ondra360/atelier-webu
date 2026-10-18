# Ateliér webu

Jednoduchý vizuální editor webů s více stránkami. Aplikace je statická a běží v prohlížeči; její zdrojové soubory jsou v adresáři `dist`.

## Použití

- Prvek vložte kliknutím v levém panelu nebo jej přetáhněte na stránku. Na ploše jej můžete přemístit, v pravém dolním rohu změnit jeho velikost a dvojklikem upravit text.
- V pravém panelu nastavte vzhled, rozměry, pořadí a případnou interakci. Pozice, rozměry a velikost písma se nastavují samostatně pro počítač, tablet a mobil; ostatní vzhledové vlastnosti jsou společné.
- Kliknutím na prázdné místo nastavíte výšku stránky pro aktuální zařízení. Sekce a kontejnery jsou vizuální vrstvy: ostatní prvky lze umístit nad ně, ale nepřesouvají se automaticky společně s nimi.
- V levé záložce **Stránky** přidáte, přejmenujete a přepnete stránky webu. V interakcích tlačítka nebo odkazu vyberte **Otevřít stránku webu** a cílovou stránku. Úvodní stránka je vždy `index.html`.
- Tlačítkem **Tmavý režim** přepnete vzhled editoru; návrh stránky si zachová vlastní barvy.
- Projekt včetně všech stránek se ukládá tlačítkem **Uložit projekt** do úložiště daného prohlížeče a adresy webu. Vymazání dat prohlížeče jej může odstranit. Starší jednostránkový projekt se při načtení převede automaticky.
- V náhledu můžete vyzkoušet nastavené akce i přechody mezi stránkami. Export zobrazí a samostatně stáhne každé HTML a sdílené `style.css` a `script.js`. Můžete také stáhnout ZIP s celým webem. Po rozbalení ponechte všechny soubory ve stejné složce a otevřete `index.html`.

Nahrané obrázky jsou vložené přímo do exportovaného HTML. Obrázky z externích adres vyžadují pro zobrazení dostupnost dané adresy. Formulář používá kontrolu povinných polí v prohlížeči, ale skutečné doručení vyžaduje nastavenou adresu serveru nebo formulářové služby. Samostatná vstupní pole lze v jejich vlastnostech připojit k formuláři.

Pro lokální spuštění stačí v `dist` otevřít `index.html` v prohlížeči. Úložiště pro lokální soubory se může podle prohlížeče chovat jinak než na hostované adrese.
