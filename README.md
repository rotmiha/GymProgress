# GymProgress

Spletna aplikacija za načrtovanje treningov in spremljanje napredka.
Implementirane so **US-01 do US-07**: registracija in prijava, lastni programi,
povabila in potrditev povezave s trenerjem, dodelitev programa, beleženje serij,
zaključek treninga z volumnom ter zaznavanje in prikaz novih osebnih rekordov.
Vmesnik je preprost, v sivinskih odtenkih. Funkcionalnosti po US-07 še niso implementirane.

## Lokalni zagon

Potrebujete **Node.js 20.19 ali Node.js 22.12 ali novejši**, npm in gostovani projekt Supabase.
Lokalna podatkovna baza ni potrebna.

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

 Zaženite oba procesa:

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
na uro.
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


## Programi in treningi

Po prijavi so uporabniku na voljo zavihki **Programi, Povezave, Dodelitve in Treningi**.

Uporabnik lahko ustvarja in ureja programe treningov ter dodaja vaje iz obstoječega kataloga. Vaje lahko išče in filtrira po imenu, mišični skupini in opremi.

Stranka se lahko poveže s trenerjem, ki ji po potrditvi povezave dodeli program. Dodeljeni program lahko stranka uporabi za začetek treninga.

Med treningom uporabnik beleži serije, ponovitve in težo v kilogramih. Podatke lahko spreminja do zaključka treninga. Ob zaključku se samodejno izračuna skupni volumen in preverijo novi osebni rekordi.

Podatki se shranjujejo v PostgreSQL (Supabase). Dostop je zaščiten z avtentikacijo in pravili RLS, ki zagotavljajo, da uporabniki dostopajo samo do dovoljenih podatkov. Vsa pisanja potekajo prek preverjenih SQL funkcij in Express API-ja.

Funkcionalnosti US-02 do US-07 so preverjene z avtomatiziranimi in ročnimi testi.


## Dokumentacija

- [Zasnova rešitve](docs/01-zasnova-resitve.md)
- [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
- [Podatkovni model](docs/03-podatkovni-model.md)
- [Arhitektura in sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
- [Wireframe-i](docs/06-wireframes.md)
- [Arhitekturne odločitve](docs/adr/)
