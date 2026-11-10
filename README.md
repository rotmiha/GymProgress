# GymProgress

Spletna aplikacija za načrtovanje treningov in spremljanje napredka.
Implementirana je **samo US-01 – Registracija in prijava**: registracija z
e-naslovom, geslom in vlogo stranka/trener, prijava, odjava in lasten profil.
Preostale funkcionalnosti so načrtovane v dokumentaciji.

## Lokalni zagon

Potrebujete **Node.js 22.12 ali novejši**, npm in gostovani projekt Supabase.
Lokalna podatkovna baza ni potrebna.

1. V Supabase SQL Editorju izvedite [migracijo US-01](supabase/migrations/202611100001_us01_auth.sql).
   Nato izvedite še [migracijo za ime in priimek](supabase/migrations/202611100002_registration_names.sql).
   Če je prva migracija že izvedena, izvedite samo drugo.
   Namenjena je svežemu projektu brez aplikacijske tabele `public.users`.
   Obstoječih Auth uporabnikov ne uvaža; za preverjanje ustvarite nove račune.
2. V nastavitvah **Authentication** omogočite e-pošto in geslo. Nastavite
   **najmanjšo dolžino gesla na 8** tudi v Supabase, ker se preverjanje obrazca
   lahko obide z neposredno zahtevo. Vključite **Confirm email**.
3. V **Authentication → URL Configuration** nastavite Site URL na
   `http://127.0.0.1:5173` in ga dodajte med Redirect URLs. Če uporabljate
   `localhost`, dodajte tudi `http://localhost:5173`.
4. V korenu repozitorija zaženite:

   ```powershell
   npm install
   Copy-Item frontend/.env.example frontend/.env
   Copy-Item backend/.env.example backend/.env
   ```

5. V obeh `.env` nastavite URL projekta in njegov **publishable** ključ
   (ali starejši `anon` ključ). **Nikoli ne uporabite secret/service_role ključa**,
   zlasti ne v frontendu. `.env` ni vključen v Git.
6. Zaženite oba procesa:

   ```powershell
   npm run dev
   ```

   Odprite `http://127.0.0.1:5173`. API posluša na `127.0.0.1:3001`;
   Vite posreduje `/api` backendu. Vrata 5173 naj bodo prosta, da naslov
   ustreza dovoljenim preusmeritvam v Supabase.

Registrirajte se, potrdite povezavo v e-pošti in se prijavite. Če v razvoju
izklopite potrditev e-pošte, registracija uporabnika prijavi takoj. Pri omejitvi
pošiljanja Supabase e-pošte počakajte ali nastavite lasten SMTP.

Če pri testiranju dobite `over_email_send_rate_limit`, je dosežena projektna
omejitev potrditvenih e-poštnih sporočil. Vgrajeni ponudnik dovoli 2 sporočili
na uro. Za lokalni razvoj lahko začasno izklopite **Confirm email** v
**Authentication → Sign In / Providers → Email** in ponovite registracijo.
Pri preverjanju potrditvenega toka ga ponovno vključite in uporabite lasten SMTP.
Napaka `over_request_rate_limit` pomeni omejitev zahtev; v tem primeru počakajte.

## Preverjanje in gradnja

```powershell
npm test
npm run typecheck
npm run build
```

Za enotno oblikovanje TypeScript, TSX, HTML, CSS in JSON datotek uporabite
`npm run format`. Ukaz `npm run format:check` preveri oblikovanje brez spreminjanja datotek.

Frontend se zgradi v `frontend/dist`, backend v `backend/dist`. Zgrajeni backend
zaženete z `npm start -w backend`. Pri gostovanju frontenda je treba `/api`
posredovati backendu prek HTTPS; Vite proxy deluje samo v razvoju.

Avtomatizirani testi preverijo tudi migracijo in RLS v lokalnem PostgreSQL
okolju PGlite z nadomestkom Supabase Auth tabel in JWT funkcij. Ne dokazujejo
nastavitev gostovanega projekta. Za preverjanje dejanske baze izvedite še
[SQL teste RLS](supabase/tests/us01.sql) v SQL Editorju; začasne zapise povrnejo
v transakciji. [Sprejemni scenariji US-01](docs/07-preverjanje-us01.md) opisujejo
preverjanje s pravimi računi.

## Zaščita podatkov

- Gesla in seje upravlja Supabase Auth; profil ne hrani gesel.
- Sprožilec dovoli le začetni vlogi `stranka` in `trener`. Vloga izvira iz
  `public.users`; sprememba uporabniških metapodatkov je ne spremeni.
  Običajni uporabniki nimajo dovoljenja za pisanje profilov.
- `GET /api/me` preveri žeton prek Supabase Auth in uporabi preverjeni ID.
- RLS omejuje tudi neposredne podatkovne zahteve na lasten profil. Zasebna
  funkcija preveri obstoj seje v `auth.sessions`, zato odjavljeni žeton ne more
  več brati profila, tudi če še ni pretekel. Sheme `private` ne izpostavljajte
  prek Supabase Data API.
- Odjava prekliče uporabnikove seje in odstrani profil iz vmesnika. Pri napaki
  prikaže sporočilo in omogoči ponovni poskus.
- API ne beleži žetonov in vrača `Cache-Control: no-store`. Supabase odjemalec
  hrani sejo v brskalniku za obnovitev ob ponovnem odprtju.

## Dokumentacija

- [Zasnova rešitve](docs/01-zasnova-resitve.md)
- [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
- [Podatkovni model](docs/03-podatkovni-model.md)
- [Arhitektura in sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
- [Wireframe-i](docs/06-wireframes.md)
- [Arhitekturne odločitve](docs/adr/)
