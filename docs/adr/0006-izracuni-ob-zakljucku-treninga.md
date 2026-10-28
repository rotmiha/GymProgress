

# Izračun volumna in preverjanje rekordov ob zaključku treninga

## Kontekst in problem

Med treningom lahko uporabnik serije dodaja, popravlja ali briše, zato
vmesni podatki še niso končni rezultat. US-06 in US-07 zahtevata izračun
volumna ter preverjanje osebnih rekordov ob zaključku; upoštevajo se samo
zaključeni treningi. Ponovljena zahteva za zaključek ne sme podvojiti podatkov.

## Obravnavane alternative

* **Izračun ob zaključku treninga:** uporabi shranjene opravljene serije
  ob jasno določeni spremembi stanja; zahteva usklajen zaključek in izračun.
* **Posodabljanje rezultatov ob vsaki spremembi serije:** omogoča sprotne
  rezultate, vendar mora ob popravkih in brisanju razveljavljati že
  izračunane vsote ter morebitne rekorde.
* **Izračun šele ob prikazu rezultatov:** zmanjša shranjevanje izpeljanih
  podatkov, vendar ponavlja agregacije ob branju in sam po sebi ne določi
  trenutka obvestila o novem rekordu.

## Sprejeta odločitev in utemeljitev

Izbrana možnost: **strežniški izračun ob zaključku treninga**, ker ustreza
uporabnikovemu potrjevanju končne izvedbe in izloči nedokončane poskuse iz
rezultatov. Izračun temelji na shranjenih serijah, ne na ciljnih vrednostih
programa ali rezultatu, ki ga pošlje frontend. Sprotno vzdrževanje rekordov
bi za MVP zahtevalo nepotrebno razveljavljanje začasnih rezultatov.

Backend dovoli zaključek z vsaj eno shranjeno veljavno serijo. Volumen
izračuna kot `vsota(reps × weight_kg)` vseh opravljenih serij treninga in
shrani `total_volume_kg` ter `completed_at`. Za vsako vajo primerja največjo
težo tega treninga z največjo težo istega uporabnika v predhodno zaključenih
treningih. Enaka ali nižja teža ni nov rekord. Pravila vnosa ostanejo:
pozitivno celo število ponovitev in nenegativna teža v kg.

Ponovljena zahteva za že zaključen trening ne ustvari novega zaključka
ali podvojenih rezultatov. Pri izvedbi moramo uskladiti shranjevanje
zaključka in izračuna ter preprečiti tekmovanje s spremembami serij.
Konkretni transakcijski mehanizem še ni določen s tem ADR-jem.

### Posledice

#### Pozitivne posledice

* Uradni rezultat temelji na dejansko opravljenih serijah potrjenega treninga.
* Brskalnik in morebitni prihodnji odjemalci dobijo enako strežniško pravilo.
* Med urejanjem serij ni treba vzdrževati in razveljavljati uradnih rekordov.

#### Negativne posledice

* Uradni rezultat in obvestilo o rekordu sta na voljo šele po zaključku.
* Zaključek poleg spremembe stanja vključuje agregacije in primerjavo s
  preteklimi treningi, kar poveča delo te operacije.
* Izvedba mora posebej zagotoviti pravilnost pri ponovljenih in sočasnih
  zahtevah; polji za datum in volumen sama tega ne zagotavljata.

## Povezave

* Izhodišče: [US-05 do US-07](../05-uporabniske-zgodbe.md) in [arhitekturne odločitve](../04-arhitektura-in-tehnoloski-sklad.md).
* Podatki: [WORKOUT_SESSIONS in WORKOUT_SETS](../03-podatkovni-model.md).
* Sorodno: [ADR 0003 – backend](0003-locen-express-backend.md) in [ADR 0005 – relacijski model](0005-relacijski-podatkovni-model.md).
