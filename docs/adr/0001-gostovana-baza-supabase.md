# Gostovana baza Supabase namesto lokalne infrastrukture

## Kontekst in problem

GymProgress mora trajno hraniti programe, povezave trener–stranka in rezultate
treningov, dostopne po prijavi. Pri razvoju MVP želimo lokalno zaganjati le
frontend in backend, brez nameščanja ter upravljanja lokalnega podatkovnega
strežnika. Odločitev obravnava gostovanje baze; izbiro relacijskega modela
ločeno utemeljuje ADR 0005.

## Obravnavane alternative

* **Gostovani Supabase:** ponudi PostgreSQL in povezano storitev Auth brez
  lokalnega podatkovnega strežnika, vendar razvoj potrebuje omrežno povezavo.
* **Lokalni PostgreSQL:** omogoča razvoj brez interneta in nadzor nad okoljem,
  vendar zahteva namestitev, usklajevanje nastavitev ter ločeno rešitev za
  dostop do skupnih podatkov in kasnejše gostovanje.
* **Samostojno upravljani PostgreSQL na oddaljenem strežniku:** omogoča skupno
  bazo in več nadzora, vendar ekipi nalaga upravljanje strežnika, posodobitev
  in varnostnih kopij.

## Sprejeta odločitev in utemeljitev

Izbrana možnost: **gostovani Supabase**, ker za MVP zmanjša obseg
infrastrukture, ki jo moramo vzpostaviti in vzdrževati. Z lokalnim Node.js
okoljem za frontend in backend ter oddaljeno bazo lahko delo usmerimo v
programe, beleženje serij in rezultate. Supabase vključuje tudi storitev
Auth, izbrano v ADR 0002, zato ne potrebujemo še ločenega ponudnika zanjo.

Prednost lokalne baze pri razvoju brez interneta za trenutni obseg ne
odtehta dodatne postavitve. Večji nadzor samostojnega gostovanja prav tako
ne odtehta upravljanja strežnika. Odločitev ne predpisuje konkretnega
naročniškega paketa ali načina produkcijske namestitve aplikacije.

### Posledice

#### Pozitivne posledice

* Za lokalni razvoj ni treba namestiti ali zaganjati podatkovnega strežnika.
* Baza in avtentikacija sta dosegljivi v istem gostovanem okolju.
* Manj dela z infrastrukturo ostane ekipi med pripravo MVP.

#### Negativne posledice

* Dostop do podatkov je odvisen od omrežja in razpoložljivosti ponudnika.
* Sprejmemo omejitve in morebitne stroške izbranega paketa ter odvisnost
  od Supabaseovih vmesnikov za storitve zunaj samega PostgreSQL.
* Upravljana storitev ne odpravi odgovornosti za shemo, dostopne pravice,
  migracije in preverjanje možnosti obnovitve podatkov.

## Povezave

* Izhodišče: [arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md).
* Sorodno: [ADR 0002 – Supabase Auth](0002-avtentikacija-supabase-auth.md).
* Sorodno: [ADR 0005 – relacijski podatkovni model](0005-relacijski-podatkovni-model.md).
