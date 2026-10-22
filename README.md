# ArdaZamek: seznam povolených serverů

Seznam serverů, na kterých smí běžet mody serveru Příběhy Ardy. Po každé změně v tomto repozitáři
GitHub seznam podepíše a zveřejní na `povolene.json` (GitHub Pages). Servery se do něj dívají každou minutu.

## Zamknout nebo odemknout server (jde i z mobilu)

1. Otevři `stavy.json`, klikni na tužku (Edit).
2. U serveru přepiš `"povoleno"` na `"zamceno"` nebo zpět.
3. Dole „Commit changes“. Do pár minut je nový seznam venku: zamčený server odpojí hráče, uloží svět a vypne se.

`platnost_hodin` říká, jak dlouho server poběží bez spojení s tímto seznamem.

## Přidat nebo změnit server

Servery podepisuje jen majitel doma hlavním klíčem (`ArdaZamek\nastroje\podepis-servery.bat`).
Hotový `servery.podepsane.json` nahraj sem (Add file → Upload files) a přidej serveru stav do `stavy.json`.

## Soubory

| Soubor | Kdo mění | K čemu |
|---|---|---|
| `stavy.json` | majitel v prohlížeči | povoleno / zamceno |
| `servery.podepsane.json` | nástroj doma, pak nahrát | servery, jejich IP a port, podepsáno hlavním klíčem |
| `hlavni.verejny.txt` | nikdy | veřejný hlavní klíč, Action jím kontroluje podpis serverů |
| `podepis.mjs`, `.github/workflows/podepis.yml` | nikdy | podpis a zveřejnění |

Tajný klíč seznamu je jen v Settings → Secrets → `SEZNAM_TAJNY`. Hlavní tajný klíč tu není a nikdy nebude.
