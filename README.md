# Ateliér webu

Jednoduchý vizuální editor jednostránkových webů. Aplikace je statická a běží v prohlížeči; její zdrojové soubory jsou v adresáři `dist`.

## Použití

- Prvek vložte kliknutím v levém panelu nebo jej přetáhněte na stránku. Na ploše jej můžete přemístit, v pravém dolním rohu změnit jeho velikost a dvojklikem upravit text.
- V pravém panelu nastavte vzhled, rozměry, pořadí a případnou interakci. Pozice, rozměry a velikost písma se nastavují samostatně pro počítač, tablet a mobil; ostatní vzhledové vlastnosti jsou společné.
- Kliknutím na prázdné místo nastavíte výšku stránky pro aktuální zařízení. Sekce a kontejnery jsou vizuální vrstvy: ostatní prvky lze umístit nad ně, ale nepřesouvají se automaticky společně s nimi.
- Projekt se ukládá tlačítkem **Uložit projekt** do úložiště daného prohlížeče a adresy webu. Vymazání dat prohlížeče jej může odstranit.
- V náhledu můžete vyzkoušet nastavené akce. Export zobrazí a samostatně stáhne `index.html`, `style.css` a `script.js`; všechny tři musí být ve stejné složce.

Nahrané obrázky jsou vložené přímo do exportovaného HTML. Obrázky z externích adres vyžadují pro zobrazení dostupnost dané adresy. Formulář používá kontrolu povinných polí v prohlížeči, ale skutečné doručení vyžaduje nastavenou adresu serveru nebo formulářové služby. Samostatná vstupní pole lze v jejich vlastnostech připojit k formuláři.

Pro lokální spuštění stačí v `dist` otevřít `index.html` v prohlížeči. Úložiště pro lokální soubory se může podle prohlížeče chovat jinak než na hostované adrese.
