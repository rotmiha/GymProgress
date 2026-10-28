

# Ločen Express backend za poslovna pravila

## Kontekst in problem

Dodelitev programa zahteva potrjeno povezavo s stranko, zaključek treninga
pa preverjanje shranjenih serij in izračun rezultatov. Teh pravil ne smemo
prepustiti samo kodi v brskalniku, saj odjemalec lahko pošlje spremenjene
zahteve. Potrebujemo skupno strežniško mesto za pravila in dostop do
poslovnih podatkov, ki ga lahko pozneje uporablja tudi mobilni odjemalec.

## Obravnavane alternative

* **Ločen Node.js/Express backend:** združi pravila in preverjanje zahtev
  v eni aplikacijski storitvi, zahteva pa dodaten proces poleg frontenda.
* **Neposreden dostop frontenda do Supabase:** zmanjša količino backend
  kode, vendar mora zanesljivo izvajanje pravil prenesti v podatkovne
  politike in funkcije; samo preverjanje v UI ne zadošča.
* **Posamezne strežniške funkcije za operacije:** omogočajo ločeno izvajanje
  operacij, vendar dodajo usklajevanje skupnih pravil, konfiguracije in
  lokalnega razvoja med funkcijami.

## Sprejeta odločitev in utemeljitev

Izbrana možnost: **ločen Node.js/Express backend v TypeScriptu**, ker omogoča
enotno izvajanje preverjanja dostopa in poslovnih operacij za vse odjemalce.
Za obseg MVP je ena backend aplikacija dovolj; posamezne funkcije ne
prinesejo koristi, ki bi odtehtale dodatno razporeditev skupnih pravil.
Neposreden dostop do baze bi ta pravila prenesel v drug izvedbeni sloj,
medtem ko želimo poslovni tok pregledno izraziti v aplikacijski kodi.

Frontend uporablja Supabase neposredno za avtentikacijo, poslovne podatke
pa bere in spreminja prek Express API-ja. Backend preverja vhodne podatke,
identiteto in dovoljenja ter izvaja zaključevanje treningov. Poslovna logika
je del iste backend aplikacije, ne ločena omrežna storitev. Node.js in npm
omogočata skupno osnovno razvojno okolje za frontend in backend.

### Posledice

#### Pozitivne posledice

* Pravila dodeljevanja, dostopa in zaključevanja se izvajajo na strežniku.
* Različni odjemalci lahko uporabljajo isto poslovno vedenje prek API-ja.
* Logiko lahko preverjamo neodvisno od uporabniškega vmesnika.

#### Negativne posledice

* Razvijati, zaganjati in pozneje namestiti moramo tudi backend aplikacijo.
* Zahteve do podatkov opravijo dodaten prehod prek API-ja.
* Ločen backend sam po sebi ne prepreči obhoda prek podatkovnih vmesnikov;
  pri izvedbi moramo uskladiti tudi dostopne pravice v Supabase in
  zagotoviti, da privilegirane poverilnice ostanejo na strežniku.

## Povezave

* Izhodišče: [arhitektura](../04-arhitektura-in-tehnoloski-sklad.md) in [US-04 do US-07](../05-uporabniske-zgodbe.md).
* Sorodno: [ADR 0004 – REST API](0004-komunikacija-prek-rest-api.md), [ADR 0006 – zaključek treninga](0006-izracuni-ob-zakljucku-treninga.md) in [ADR 0008 – pravila dostopa](0008-dostop-po-vlogah-in-povezavah.md).
