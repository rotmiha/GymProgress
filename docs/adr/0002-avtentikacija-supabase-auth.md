

# Upravljanje identitete in sej s Supabase Auth

## Kontekst in problem

Uporabniška zgodba US-01 zahteva registracijo, prijavo in odjavo pred
dostopom do osebnih podatkov. Lastna rešitev bi zahtevala shranjevanje
zgoščenih gesel, preverjanje prijave in upravljanje žetonov ter sej.
Ker že uporabljamo Supabase, potrebujemo odločitev, kdo upravlja identiteto
in kako jo backend poveže z dovoljenji aplikacije.

## Obravnavane alternative

* **Supabase Auth:** prevzame upravljanje prijavnih podatkov in sej ter je
  del že izbranega okolja; aplikacijo veže na njegov način avtentikacije.
* **Lastna avtentikacija v Express backendu:** omogoča popoln nadzor, vendar
  zahteva razvoj in vzdrževanje celotnega prijavnega mehanizma.
* **Ločen zunanji ponudnik identitete:** lahko upravlja prijavo neodvisno
  od baze, vendar uvede dodatno storitev in povezovanje njenih identitet
  s profili v Supabase.

## Sprejeta odločitev in utemeljitev

Izbrana možnost: **Supabase Auth**, ker izpolni potrebo po registraciji in
prijavi brez lastnega shranjevanja gesel ali izdajanja žetonov. V trenutnem
obsegu ni zahteve, ki bi upravičila še enega ponudnika identitete ali lastno
izvedbo prijave.

Frontend uporablja Supabase Auth za prijavo in sejo, dostopni žeton pa
pošlje Express API-ju. Backend preveri veljavnost žetona in identiteto
uporabnika. Vlogo, lastništvo in potrjeno povezavo s trenerjem preveri
ločeno po ADR 0008; veljavna prijava sama ne daje dostopa do tujih podatkov.
Tabela `USERS` v modelu predstavlja aplikacijski profil, katerega `id`
se navezuje na `auth.users.id`. V njej ne hranimo `password_hash`;
prijavne podatke upravlja Supabase Auth.

### Posledice

#### Pozitivne posledice

* Aplikacijska koda ne potrebuje lastnega shranjevanja gesel in izdajanja žetonov.
* Za profil, programe in treninge uporabljamo isto uporabniško identiteto.
* Razvoj se lahko osredotoči na dovoljenja in funkcionalnosti GymProgress.

#### Negativne posledice

* Prijava in upravljanje sej sta odvisna od storitve Supabase Auth.
* Menjava ponudnika bi zahtevala prilagoditev prijavnega toka in povezav
  med identitetami ter aplikacijskimi profili.
* Še vedno moramo pravilno preverjati žetone, obravnavati potek sej in
  preprečiti, da bi uporabnik sam pridobil administratorsko vlogo.

## Povezave

* Izhodišče: [arhitektura](../04-arhitektura-in-tehnoloski-sklad.md) in [US-01](../05-uporabniske-zgodbe.md#us-01--registracija-in-prijava).
* Podatki: [aplikacijski uporabniški profil](../03-podatkovni-model.md).
* Sorodno: [ADR 0001 – Supabase](0001-gostovana-baza-supabase.md) in [ADR 0008 – pravila dostopa](0008-dostop-po-vlogah-in-povezavah.md).
