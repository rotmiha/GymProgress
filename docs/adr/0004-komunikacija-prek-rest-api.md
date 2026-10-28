

# REST API med odjemalcem in Express backendom

## Kontekst in problem

React frontend potrebuje dostop do programov, povezav, treningov in serij
ter možnost izvajanja operacij, kot sta dodelitev programa in zaključek
treninga. Vmesnik mora omogočati preverjanje zahtev s Postmanom in uporabo
iz morebitne prihodnje mobilne aplikacije, neodvisno od prikaza v Reactu.
Trenutni MVP ne zahteva poljubno sestavljenih poizvedb ali stalnega prenosa
dogodkov v realnem času.

## Obravnavane alternative

* **REST API prek HTTP:** razdeli vmesnik po virih in operacijah ter ga je
  mogoče preverjati z običajnimi HTTP orodji; nekateri pogledi potrebujejo
  več zahtev.
* **GraphQL:** odjemalcu omogoča izbiro povezanih podatkov v eni poizvedbi,
  vendar zahteva shemo, razreševalnike in preverjanje pravic pri njih.
* **RPC vmesnik za posamezna opravila:** neposredno izrazi ukaze, vendar
  pogodbo močneje poveže s konkretnimi opravili in zahteva lastno ureditev
  imenovanja ter pravil za dostop do podatkov.

## Sprejeta odločitev in utemeljitev

Izbrana možnost: **REST API**, ker so glavni podatkovni viri in operacije
MVP vnaprej znani, vmesnik pa lahko neposredno preverjamo s Postmanom.
Prilagodljivost GraphQL za trenutni obseg ne odtehta dodatne sheme in
razreševalnikov. Pri RPC za celoten vmesnik ne dobimo bistvene prednosti
pri običajnem ustvarjanju, branju in urejanju programov ter treningov.

Frontend z backendom izmenjuje JSON prek HTTP; pri nameščenem sistemu
komunikacija poteka prek HTTPS. Za zaščitene zahteve pošlje dostopni žeton.
Vmesnik uporablja vire, kot so programi, treningi in serije, ter izrecne
operacije za poslovne prehode, kot je zaključek treninga. Poslovna pravila
ostanejo v backendu, zato jih prihodnjemu mobilnemu odjemalcu ni treba
izvajati namesto strežnika.

### Posledice

#### Pozitivne posledice

* Zahteve in odgovore lahko preverjamo s Postmanom brez zagona UI.
* Pogodba API-ja ni vezana na React in jo lahko uporablja drug odjemalec.
* Jasne operacije omogočajo preverjanje uspešnih in zavrnjenih zahtev.

#### Negativne posledice

* Sestavljen pogled lahko zahteva več klicev ali namenski zbirni odgovor.
* Usklajevati moramo oblike zahtev, odgovorov in napak med frontendom ter
  backendom; sam TypeScript ne preverja prejetega JSON med izvajanjem.
* Spreminjanje pogodbe zahteva skrb za združljivost vseh odjemalcev.

## Povezave

* Izhodišče: [arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md).
* Prihodnji odjemalec: [kasnejše nadgradnje](../02-funkcionalnosti-in-obseg.md#kasnejše-nadgradnje).
* Sorodno: [ADR 0003 – Express backend](0003-locen-express-backend.md) in [ADR 0002 – avtentikacija](0002-avtentikacija-supabase-auth.md).
