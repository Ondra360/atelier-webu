# Ateliér webu

Jednoduchý vizuální editor webů s více stránkami. Editor je v `public/editor`, přihlášení a online ukládání zajišťuje serverová část pro Sites.

## Použití

- Prvek vložte kliknutím v levém panelu nebo jej přetáhněte na stránku. Na ploše jej můžete přemístit, v pravém dolním rohu změnit jeho velikost a dvojklikem upravit text.
- V pravém panelu nastavte vzhled, rozměry, pořadí a případnou interakci. Pozice, rozměry a velikost písma se nastavují samostatně pro počítač, tablet a mobil; ostatní vzhledové vlastnosti jsou společné.
- Kliknutím na prázdné místo nastavíte výšku stránky pro aktuální zařízení. Sekce a kontejnery jsou vizuální vrstvy: ostatní prvky lze umístit nad ně, ale nepřesouvají se automaticky společně s nimi.
- V levé záložce **Stránky** přidáte, přejmenujete a přepnete stránky webu. V interakcích tlačítka nebo odkazu vyberte **Otevřít stránku webu** a cílovou stránku. Úvodní stránka je vždy `index.html`.
- Tlačítkem **Tmavý režim** přepnete vzhled editoru; návrh stránky si zachová vlastní barvy.
- Po označení prvku v záložce **Animace** vyberte efekt, spuštění při načtení, při posunutí na prvek nebo při najetí myší, délku, zpoždění a opakování. Tlačítkem **Přehrát animaci** si efekt vyzkoušíte přímo v editoru; v náhledu a exportu se spouští podle nastavených pravidel. Jde o přednastavené efekty, nikoliv časovou osu s vlastními klíčovými snímky. Prohlížečům s omezeným pohybem se přizpůsobí.
- V nasazené aplikaci se přihlašuje přes ChatGPT účet a tlačítkem **Uložit projekt** se všechny stránky uloží na účet i pokud možno do prohlížeče. Z jiného zařízení se stejným účtem se načtou z online úložiště. Online limit je 10 MB na projekt. Pokud jsou online a místní kopie rozdílné, editor požádá o výběr a před načtením online verze vytvoří místní zálohu; před souběžným přepsáním na více zařízeních chrání kontrola verze. Starší jednostránkový projekt se při načtení převede automaticky. Offline či při výpadku lze ukládat pouze do prohlížeče a stav je označený jako místní.
- Sites používá přihlášení ChatGPT. Pokud se uživatel přihlašuje ke svému ChatGPT účtu přes Google, může tento způsob použít v přihlašovacím procesu ChatGPT. Samostatný Google OAuth pro editor zatím není nakonfigurován.
- V náhledu můžete vyzkoušet nastavené akce i přechody mezi stránkami. Export zobrazí a samostatně stáhne každé HTML a sdílené `style.css` a `script.js`. Můžete také stáhnout ZIP s celým webem. Po rozbalení ponechte všechny soubory ve stejné složce a otevřete `index.html`.

Nahrané obrázky jsou vložené přímo do exportovaného HTML. Obrázky z externích adres vyžadují pro zobrazení dostupnost dané adresy. Formulář používá kontrolu povinných polí v prohlížeči, ale skutečné doručení vyžaduje nastavenou adresu serveru nebo formulářové služby. Samostatná vstupní pole lze v jejich vlastnostech připojit k formuláři.

Lokální vývoj vyžaduje závislosti a prostředí Sites/Vinext. Pro předvedení stačí `npm run dev` a místní migrace D1 popsané v návodu ke starteru; lokální simulované přihlášení a databáze jsou oddělené od produkce. Otevření `public/editor/index.html` jako souboru funguje jen s místním ukládáním.
