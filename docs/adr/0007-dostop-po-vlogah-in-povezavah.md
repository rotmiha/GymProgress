

# Strežniško preverjanje vlog, lastništva in povezav trener–stranka

## Kontekst in problem

Osebni podatki treningov so namenjeni njihovemu lastniku in trenerju,
ki mu je stranka potrdila povezavo. Sama vloga »trener« zato ne zadošča
za dostop do vseh strank, administratorska vloga pa po opisu projekta
ne daje splošnega dostopa do osebnih zapisov. Pravila morajo veljati tudi
pri neposrednih zahtevah API-ju z drugačnimi identifikatorji podatkov.

## Obravnavane alternative

* **Preverjanje vloge, lastništva in potrjene povezave na backendu:** izrazi
  dejanska dovoljenja iz projekta, vendar zahteva preverjanje konteksta
  vsake zaščitene operacije.
* **Preverjanje samo uporabniške vloge:** je preprostejše, vendar ne loči
  med povezanimi in nepovezanimi strankami ali med lastnimi in tujimi treningi.
* **Omejitve samo v uporabniškem vmesniku:** olajšajo prikaz dovoljenih
  možnosti, vendar jih uporabnik lahko obide z neposrednim klicem API-ja.

## Sprejeta odločitev in utemeljitev

Izbrana možnost: **strežniško preverjanje vloge skupaj z lastništvom in
potrjeno povezavo**, ker natančno odraža zahteve vlog ter US-02 do US-05.
Preverjanje same vloge bi trenerju omogočilo preširok dostop; skrivanje
gumbov pa ne bi zaščitilo podatkov pri neposrednih zahtevah.

Backend po preverjanju identitete za zahtevano operacijo preveri dovoljenje:

* Stranka upravlja svoje programe in treninge ter dostopa do programov,
  ki so ji dodeljeni. Tujih treningov ne spreminja.
* Trener dodeljuje svoje programe le strankam s potrjeno povezavo in lahko
  spremlja njihove treninge. Njihovih opravljenih serij ne spreminja;
  svoje treninge lahko beleži kot drugi uporabniki.
* Povabilo ali še nepotrjena povezava ne da pravice do spremljanja stranke.
  Stranka mora povezavo sprejeti.
* Administrator upravlja račune, vloge in katalog vaj. Ta vloga mu ne daje
  pravice posegati v osebne treninge ali nastopati kot trener brez povezave.
* Uporabnik si ob registraciji ne more dodeliti administratorske vloge.

Identiteta izhaja iz preverjenega žetona; aplikacijsko vlogo in odnose
backend preveri iz zaupanja vrednih podatkov. Podatki, poslani v zahtevi,
sami ne dokazujejo identitete ali pravice dostopa. UI lahko prilagodi
prikaz, vendar backend pri vsaki zaščiteni operaciji uveljavi ta pravila.

### Posledice

#### Pozitivne posledice

* Trener vidi le podatke strank, ki so potrdile povezavo z njim.
* Zamenjava identifikatorja v zahtevi ne sme omogočiti dostopa do tujih podatkov.
* Dovoljenja imajo enako veljavo za spletni in morebitni mobilni odjemalec.

#### Negativne posledice

* Preverjanje zahteva poizvedbe o lastništvu, dodelitvah ali stanju povezave.
* Vsako novo zaščiteno operacijo moramo uskladiti s pravili in preveriti
  tudi z nedovoljenimi zahtevami, ne le z uspešnim primerom v UI.
* Pravila v backendu morajo biti usklajena z dostopom do Supabase, da
  neposreden podatkovni vmesnik ne omogoča njihovega obhoda.

## Povezave

* Izhodišče: [uporabniške vloge](../02-funkcionalnosti-in-obseg.md#uporabniške-vloge) in [US-01 do US-05](../05-uporabniske-zgodbe.md).
* Model: [TRAINER_CLIENTS in PROGRAM_ASSIGNMENTS](../03-podatkovni-model.md).
* Sorodno: [ADR 0002 – avtentikacija](0002-avtentikacija-supabase-auth.md) in [ADR 0003 – backend](0003-locen-express-backend.md).
