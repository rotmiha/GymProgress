# US-01 – preverjanje sprejemnih kriterijev

Obseg: samo registracija, prijava, odjava in varen dostop do lastnega profila.
Izvedba sledi [US-01](05-uporabniske-zgodbe.md), ADR 0002 in ADR 0007.

`npm test` preveri validacijo e-naslova, dolžino gesla, obe dovoljeni vlogi,
zavrnitev administratorske vloge, registracijo s potrditvijo e-pošte, napačno
prijavo, prikaz profila in odjavo. Testi API-ja preverijo žeton, vezavo na
preverjeno identiteto, zavrnitev nedostopnega profila in napake storitve.
Supabase je v teh testih nadomeščen.

Poleg tega avtomatizirani test izvede migracijo in spodnje SQL scenarije
v lokalnem PostgreSQL okolju PGlite. Nadomeščene so le Supabase Auth tabele
in JWT funkcije; dovoljenja, sprožilci ter RLS se izvajajo v PostgreSQL.

`supabase/tests/us01.sql` preveri dejansko zaščito baze: lasten profil, anonimni
dostop, prepoved administratorske registracije, spremembe vloge ter dostop po
preklicu seje. Izvedete ga ločeno v SQL Editorju nastavljenega projekta.

## Ročni sprejemni scenariji

Predpogoj: migracija in nastavitve iz README, posebej najmanj 8 znakov tudi v Auth.

| Korak | Pričakovani rezultat |
|---|---|
| Neveljaven naslov, 7 znakov ali neizbrana vloga | Napaka v obrazcu. |
| Registracija stranke in trenerja z vsaj 8 znaki | Auth uporabnik in ustrezen profil; navodilo za potrditev e-pošte. |
| Neposreden Auth signUp s 7 znaki | Supabase zavrne zahtevo zaradi nastavljene dolžine gesla. |
| Neposreden Auth signUp z vlogo administrator | Sprožilec zavrne registracijo. |
| Napačno geslo ali nepotrjen naslov | Razumljiva napaka brez profila. |
| Pravilna prijava in osvežitev strani | Lasten e-naslov in vloga; seja se obnovi. |
| Dva uporabnika v ločenih brskalniških profilih | Vsak vidi le svoj profil, tudi pri neposredni poizvedbi za tuji ID. |
| Odjava in osvežitev strani | Prijavni obrazec, brez osebnega profila. |
| API brez žetona po odjavi | 401. |
| Ponovna uporaba starega žetona po uspešni odjavi | API ne vrne profila (401 ali 403); neposreden SELECT ne vrne vrstic. |

Gostovani scenariji potrebujejo dostop do konkretnega projekta in niso označeni
kot opravljeni samo na podlagi lokalnih testov.
