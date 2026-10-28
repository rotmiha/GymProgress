

# Relacijski podatkovni model v PostgreSQL

## Kontekst in problem

Program vsebuje urejen seznam vaj, isti program pa je lahko dodeljen več
strankam. Trening povezuje uporabnika, program in opravljene serije, trener
pa sme podatke stranke spremljati šele po potrjeni povezavi. Potrebujemo
jasne odnose med podatki in poizvedbe za seštevke, največje obremenitve ter
poznejše preglede zgodovine.

## Obravnavane alternative

* **Relacijski model v PostgreSQL:** odnose izrazi s tabelami in tujimi
  ključi ter podpira združevanje in agregacije; zahteva načrtovano shemo.
* **Dokumentna baza:** omogoča shranjevanje celotnega programa ali treninga
  kot dokumenta, vendar bi skupne vaje, dodelitve in povezave med uporabniki
  zahtevale reference ali podvajanje ter dodatno skrb za skladnost.
* **Datoteke JSON ali preglednice:** omogočajo hiter začetni zapis, vendar
  mora aplikacija sama reševati sočasne spremembe, povezave med zapisi in
  učinkovite poizvedbe za več uporabnikov.

## Sprejeta odločitev in utemeljitev

Izbrana možnost: **relacijski model v PostgreSQL**, ker so odnosi in
celovitost podatkov osrednji del problema. Model loči profile `USERS`,
povezave `TRAINER_CLIENTS`, katalog `EXERCISES`, programe `WORKOUT_PROGRAMS`,
njihovo sestavo `PROGRAM_EXERCISES`, dodelitve `PROGRAM_ASSIGNMENTS`,
treninge `WORKOUT_SESSIONS` in izvedene serije `WORKOUT_SETS`.

Tako vaje in programe povezujemo brez kopiranja celotnih vsebin za vsako
dodelitev. Načrtovane serije ostanejo ločene od dejansko opravljenih,
zato volumen in rekordi temeljijo na izvedbi. PostgreSQL je hkrati baza
že izbranega Supabase. Prožnejša dokumentna shema za te znane odnose ne
odtehta dodatnega usklajevanja podvojenih podatkov.

### Posledice

#### Pozitivne posledice

* Tuji ključi omogočajo preverjanje, da povezani uporabniki, vaje in treningi
  obstajajo; veljavnost poslovnih dovoljenj dodatno preveri backend.
* Agregacije nad opravljenimi serijami podprejo izračun volumna in rekordov.
* Ločitev programa in treninga razlikuje namenjeno vadbo od dejanske izvedbe.

#### Negativne posledice

* Spremembe sheme zahtevajo migracije in usklajevanje z aplikacijsko kodo.
* Pri poizvedbah čez več tabel bomo morali načrtovati indekse in preverjati
  čas izvajanja glede na količino podatkov.
* Relacijski model sam ne ohrani pretekle različice spremenjenega programa.
  Pred izvedbo US-14 bo treba opredeliti shranjevanje takratnega načrta;
  osnutek modela tega še ne rešuje.

## Povezave

* Izhodišče: [podatkovni model](../03-podatkovni-model.md) in [arhitektura](../04-arhitektura-in-tehnoloski-sklad.md).
* Zahteve: [US-02, US-04 do US-07 in prihodnja US-14](../05-uporabniske-zgodbe.md).
* Sorodno: [ADR 0001 – gostovanje baze](0001-gostovana-baza-supabase.md) in [ADR 0006 – izračuni](0006-izracuni-ob-zakljucku-treninga.md).
