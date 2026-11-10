# GymProgress

Spletna aplikacija za načrtovanje treningov in spremljanje napredka.
Implementirane so **US-01 do US-07**: registracija in prijava, lastni programi,
povabila in potrditev povezave s trenerjem, dodelitev programa, beleženje serij,
zaključek treninga z volumnom ter zaznavanje in prikaz novih osebnih rekordov.
Vmesnik je preprost, v sivinskih odtenkih. Funkcionalnosti po US-07 še niso implementirane.

## Lokalni zagon

Potrebujete **Node.js 20.19 ali Node.js 22.12 ali novejši**, npm in gostovani projekt Supabase.
Lokalna podatkovna baza ni potrebna.

1. V Supabase SQL Editorju izvedite [migracijo US-01](supabase/migrations/202611100001_us01_auth.sql).
   Nato izvedite še [migracijo za ime in priimek](supabase/migrations/202611100002_registration_names.sql).
   Če je prva migracija že izvedena, izvedite samo drugo.
   Za programe nato izvedite še `supabase/migrations/202611100003_programs.sql`.
   Za povezave izvedite `supabase/migrations/202611100004_connections.sql`.
   Za dodelitve izvedite `supabase/migrations/202611100005_assignments.sql`.
   Za treninge izvedite `supabase/migrations/202611100006_workouts.sql`.
   Za zaključek izvedite `supabase/migrations/202611100007_complete_workout.sql`.
   Za rekorde izvedite `supabase/migrations/202611100008_personal_records.sql`.
   Za združljivost starih vlog izvedite `supabase/migrations/202611100009_legacy_role_compatibility.sql`.
   Migracije izvajajte po vrstnem redu in vsako samo enkrat. Če je del že izveden,
   izvedite samo preostale datoteke. Popravek v `supabase/repairs` je ločen in ponovljiv.
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
   ```

   Ustvarite `frontend/.env` (obstoječe datoteke ne prepisujte):

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

   Ustvarite `backend/.env`:

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   PORT=3001
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

Če prijava uspe, profil pa ni dostopen, uporabite diagnostiko
`supabase/diagnostics/profile_access.sql`. Če SQL Editor javi, da shema `private`
ne obstaja, je obstoječa baza pripravljena po starejši shemi. V istem Supabase
projektu kot v `.env` izvedite `supabase/repairs/auth_access.sql`, nato se odjavite
in prijavite. Popravek ohrani račune, zamenja politike dostopa na `public.users`
in zagotovi zahtevane funkcije ter sprožilce za registracijo.

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
  `signUp({ email, password })` pošlje geslo prek HTTPS v Supabase Auth, ki
  uporabi bcrypt z naključno soljo in shrani zgoščeno vrednost v
  `auth.users.encrypted_password`. Ob prijavi `signInWithPassword` preveri
  ujemanje; aplikacija ne shranjuje izvirnega gesla ali lastne kopije hasha.
  [Uradna razlaga shranjevanja gesel](https://supabase.com/docs/guides/auth/password-security).
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

## Programi in treningi

Po prijavi so na voljo zavihki Programi, Povezave, Dodelitve in Treningi.
Katalog bere obstoječe zapise iz `public.exercises`, vključno z vašimi imeni,
mišičnimi skupinami in opremo. Migracija 0003 doda začetni nabor samo ob prvi
pripravi nove baze. Obstoječih tabel zaradi dodajanja vaj ne ustvarjajte ponovno.
Če SQL Editor vidi vaje, aplikacija pa vrne prazen seznam, izvedite
`supabase/repairs/catalog_access.sql`. Popravek uredi samo pravice branja in ne
spreminja nobene vaje. Program in njegove vaje se shranijo atomarno; lastnik
ga lahko spreminja, prejemnik dodelitve pa uporablja za svoje treninge.

Katalog je mogoče iskati po imenu, mišični skupini in opremi ter dodatno filtrirati
po mišični skupini in opremi. Filtri izhajajo iz dejanskih vrednosti v bazi in ne
spreminjajo zapisov. Števec pokaže število ujemanj, Počisti filtre pa obnovi celoten seznam.

Migracija 0009 v preverjanju pravic enotno obravnava tudi stare vloge `client`
in `trainer` (vključno s presledki iz stolpca CHAR). Bere jih iz zaščitenega
profila; uporabniški metapodatki ne dajejo pravic. Računov, povezav ali vaj ne
spreminja. Program lahko ustvari stranka ali trener, dodeli pa ga lahko le trener
potrjeni stranki. Po izvedbi migracije osvežite stran, da API vrne enotno vlogo.

Trening shrani posnetek programa. Serije lahko ureja samo lastnik in samo pred
zaključkom; potrjen trener ima bralni dostop prek API-ja. Zaključek zaklene
trening, izračuna volumen in primerja največjo težo pri vsaki vaji z vsemi
prejšnjimi zaključenimi treningi istega uporabnika. Prvi zaključeni rezultat
vzpostavi začetni rekord; enaka ali nižja teža pozneje ni rekord. Vrednost 0 kg
je dovoljena. Rekordni dogodki ostanejo vezani na trening in se ne podvojijo
ob ponovnem zaključku.

Vsa pisanja izvajajo preverjene SQL funkcije prek Express API-ja. Neposredna
pisanja tabelam so uporabnikom odvzeta, branja pa omejuje RLS. Zato enaka
pravila veljajo tudi za neposredne klice Supabase RPC.

[Ročno preverjanje US-02 do US-07](docs/08-preverjanje-mvp.md) dopolnjuje
avtomatizirane preizkuse PostgreSQL, API-ja in obrazcev.

## Preverjanje UI po wireframe-ih

```powershell
npx playwright install chromium
npm run test:ui
```

Playwright zažene ločen frontend na vratih 4173. Uporablja izmišljene račune in
prestrezanje zahtev samo v testnem brskalniku; ne bere ali spreminja vašega
Supabase projekta. Preveri katalog in vrstni red vaj (WF-01), sprejem povabila
(WF-02), pregled pred dodelitvijo (WF-03), mobilno širino ter kombiniranje in
ponastavitev filtrov kataloga. Posnetki zaslona
so v `test-results/`. Dejanska aplikacija še naprej bere podatke iz Supabase.

Pri omrežni napaki `AUTH_UNAVAILABLE` pot `/api/health/auth` vrne dosegljivost
Supabase iz dejansko zagnanega API procesa. Odgovor vsebuje status in omrežno
kodo, ne vsebuje gesel ali žetonov.

## Dokumentacija

- [Zasnova rešitve](docs/01-zasnova-resitve.md)
- [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
- [Podatkovni model](docs/03-podatkovni-model.md)
- [Arhitektura in sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
- [Wireframe-i](docs/06-wireframes.md)
- [Arhitekturne odločitve](docs/adr/)
