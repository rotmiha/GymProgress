# feat: registracija in prijava s Supabase Auth (US-01)

Closes #3
Closes #4

Implementacija US-01 omogoča registracijo z e-naslovom, geslom z najmanj
8 znaki ter izbiro vloge stranka ali trener. Uporabnik se lahko prijavi,
pregleda svoj profil in odjavi; obrazci prikazujejo napake in obravnavajo
potrditev e-pošte. Druge uporabniške zgodbe niso implementirane.

React/TypeScript frontend uporablja Supabase Auth. Express preveri žeton
in vrne samo profil preverjenega uporabnika. Migracija doda profil,
omeji začetne vloge, prepreči uporabniško pisanje profilov in z RLS preverja
lastništvo ter aktivno sejo. Gesla ostanejo v Supabase Auth.

README vsebuje lokalni zagon, konfiguracijo Supabase, migracijo in navodila
za preverjanje. Gostovani sprejemni scenariji so v docs/07-preverjanje-us01.md.

## Preverjanje

- `npm test`: 23 uspešnih testov, vključno z migracijo in RLS v PGlite.
- `npm run typecheck`: uspešno.
- `npm run build`: uspešno.
- `npm audit`: 0 ranljivosti ob namestitvi odvisnosti.

Za preverjanje s pravimi računi je treba na gostovanem projektu izvesti
migracijo, nastaviti najmanjšo dolžino gesla 8, e-pošto in dovoljene
preusmeritve ter dopolniti lokalni datoteki `.env`.

Predlagano commit sporočilo:
`feat: implementacija registracije in prijave z Supabase Auth (#3, #4)`

Predloga za dejanski PR; njena prisotnost ne pomeni, da je PR že ustvarjen
ali da sta GitHub Issues oziroma Project board že posodobljena.
