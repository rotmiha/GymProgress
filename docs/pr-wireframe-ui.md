# UI MVP po wireframe-ih WF-01 do WF-03

Refs #5, #6, #7, #8, #9, #10, #11, #12, #13, #14, #15, #16

Prijavljen uporabnik dobi široko glavo z računom in navigacijo. Programi sledijo
WF-01: katalog ob tabeli z urejanjem serij, ponovitev in vrstnega reda. Povezave
sledijo WF-02 z ločenim pogledom glede na vlogo; dodelitev sledi WF-03 z izbiro
potrjene stranke ob predogledu programa. Treningi uporabljajo isti vzorec z
izbiro treninga in podrobnostmi. Vmesnik ostane v sivinskih odtenkih.

Na mobilnih zaslonih se stolpca zložita navpično, široke tabele pa se pomikajo
znotraj svojega vsebnika. Manjkajoče ime računa nadomesti e-naslov.

Katalog uporablja obstoječe podatke iz Supabase in se naloži tudi, kadar seznam
programov ni dosegljiv. Ponovljiv popravek `catalog_access.sql` obnovi branje
starega kataloga brez spremembe zapisov. Omrežna diagnostika loči napake povezave
do Auth od zavrnitve prijave in ne izpisuje poverilnic.

Preverjanje: `npm test` (64 uspešnih testov), `npm run build`, `npm run format:check` in pet
Playwright preizkusov za WF-01, WF-02, WF-03, mobilno širino in filtre kataloga. Posnetki zaslona
so bili pregledani. Brskalniški testi uporabljajo prestrežene zahteve in ne
spreminjajo gostovane baze; pravila baze preverjajo testi v PostgreSQL.

Migracija 0009 doda podporo vlogama client/trainer iz obstoječe baze pri vseh
preverjanjih pravic ter izbiri prejemnika povabila. API normalizira zaupanja
vredno vlogo profila za isti prikaz. Ne spreminja računov ali podatkov; tuji
programi, trenerjeva dejanja za stranko in neaktivne seje ostanejo zavrnjeni.
Katalog ima kombinirano iskanje, filtre po mišični skupini in opremi ter števec
ujemanj in ponastavitev filtrov.
