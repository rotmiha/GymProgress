# US-07 – preverjanje in prikaz osebnih rekordov

Closes #15
Closes #16

Ob zaključku treninga primerja največjo težo vsake vaje s prejšnjimi zaključenimi
treningi istega uporabnika. Višja teža ustvari dogodek in prikaže nov ter prejšnji
rezultat. Prvi zaključeni rezultat vzpostavi začetni rekord. Enaki, nižji,
nedokončani in tuji rezultati ne ustvarijo napačnega rekorda.

Migracija 0008 shrani rekordne dogodke, ohrani obstoječe preverjanje lastništva,
zaklepanje zaključka in idempotentnost. Rekordi ostanejo prikazani ob ponovnem
odprtju treninga. RLS omeji njihovo branje enako kot treninge.

Dodana je diagnostika dostopa do profila in ponovljiv SQL popravek za obstoječe
baze z manjkajočo shemo private. Popravek je namenjen uporabi v SQL Editorju,
ohrani račune in obnovi varne politike ter registracijske sprožilce.

Dodano je tudi enkratno osveževanje neveljavne seje in vrnitev na prijavni obrazec,
če obnova ne uspe. Izpad Supabase Auth se vrne kot 503, ne kot napačno geslo.
Popravek stare baze pretvori vloge client/trainer/admin v dokumentirane vrednosti.

Veja izhaja iz main po združitvi US-06. Preverjanje: `npm test`,
`npm run build` in `npm run format:check`. Preizkusi vključujejo točne,
višje in nižje teže, nedokončane in tuje treninge, idempotentnost in prikaz rekorda.
Gostovani sprejemni scenariji: docs/08-preverjanje-mvp.md.
