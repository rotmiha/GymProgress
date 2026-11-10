

# React in TypeScript za spletni uporabniški vmesnik

## Kontekst in problem

Sestavljanje programa zahteva dodajanje in odstranjevanje vaj, spreminjanje
njihovega vrstnega reda ter urejanje ciljnih serij. Beleženje treninga in
potrjevanje povezave s trenerjem prav tako zahtevata interaktiven vmesnik.
Potrebujemo način gradnje teh pogledov, ki omogoča ponovno uporabo delov
obrazcev in komunicira z ločenim backend API-jem.

## Obravnavane alternative

* **React in TypeScript:** omogočata sestavljanje pogledov iz komponent
  in statično preverjanje podatkovnih tipov, zahtevata pa gradnjo odjemalske
  aplikacije ter upravljanje njenega stanja.
* **Vue in TypeScript:** prav tako podpirata komponente in interaktivne
  obrazce, vendar za navedene zahteve ne prineseta odločilne prednosti
  pred Reactom.
* **Strežniško izrisane HTML strani:** zmanjšajo obseg odjemalske aplikacije,
  vendar bi dinamično urejanje vaj in serij še vedno zahtevalo dodatno
  odjemalsko logiko ter povezovanje z izrisom strani.
* **HTML in JavaScript brez komponentnega ogrodja:** zmanjšata odvisnosti,
  vendar bi morali sami urediti usklajevanje stanja in večkrat uporabljenih
  obrazcev pri rastočem številu pogledov.

## Sprejeta odločitev in utemeljitev

Izbrana možnost: **React in TypeScript**, ker lahko vaje, serije in izbire
strank predstavimo s ponovno uporabljivimi komponentami, TypeScript pa
pomaga odkrivati neskladja v podatkih med razvojem. Isti jezik kot v
backendu zmanjša preklapljanje med jeziki pri razvoju MVP.

React in Vue sta za opisane potrebe obe izvedljivi izbiri; zasnova iz
1. naloge že določa React in ni posebne zahteve, ki bi upravičila menjavo.
Ne predpostavljamo izmerjene prednosti hitrosti ali večjega predznanja
ekipe. Vite uporabljamo za razvoj in gradnjo frontenda, Tailwind CSS pa
za prilagodljiv prikaz, kot določa obstoječi tehnološki sklad. Poslovna
pravila in dostopne pravice ostanejo odgovornost backenda.

### Posledice

#### Pozitivne posledice

* Sestavne dele obrazcev za programe in serije lahko ponovno uporabljamo.
* TypeScript pomaga pri usklajevanju podatkovnih struktur v odjemalski kodi.
* Vmesnik lahko nadgrajujemo neodvisno od izvajanja poslovnih pravil v API-ju.

#### Negativne posledice

* Vzdrževati moramo odjemalsko stanje, odvisnosti in postopek gradnje.
* Interaktivni del aplikacije je odvisen od izvajanja JavaScripta v brskalniku.
* Statični tipi ne nadomestijo preverjanja vhodnih podatkov na strežniku,
  komponente in Tailwind pa sami ne zagotovijo dostopnosti obrazcev.

## Povezave

* Izhodišče: [tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md) in [wireframe-i](../06-wireframes.md).
* Sorodno: [ADR 0003 – backend](0003-locen-express-backend.md) in [ADR 0004 – REST API](0004-komunikacija-prek-rest-api.md).
