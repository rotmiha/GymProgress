# Preverjanje US-02 do US-07

Vsaka zgodba ima lastno razvojno vejo, ustvarjeno iz posodobljenega `main`, in
PR proti `main`. Po dokončanju in preverjanju zgodbe najprej združite njen PR,
posodobite lokalni `main` in šele nato ustvarite vejo za naslednjo zgodbo.
Naloge se zaprejo po združitvi njihovih sprememb v `main`.

## US-02 – programi (#5, #6)

- Po prijavi ustvarite program z imenom in vsaj eno vajo iz kataloga.
- Nastavite pozitivna cela števila serij in ponovitev; preverite tudi zavrnitev 0.
- Dodajte več vaj, zamenjajte vrstni red z Gor/Dol in eno odstranite.
- Shranite, osvežite stran in uredite obstoječ program.
- Drugi račun ne vidi ali spreminja vašega programa.
- Katalog filtrirajte po mišični skupini in opremi, dodajte še iskalni izraz
  ter preverite števec in ponastavitev. Imena in podatki vaj ostanejo iz Supabase.
- Pri obstoječi bazi s starima vlogama client/trainer izvedite migracijo 0009;
  oba uporabnika lahko ustvarita lasten program, dodelitev pa ostane trenerjevo dejanje.

Avtomatizirani testi izvajajo migracije, RPC in RLS v PostgreSQL (PGlite).
Preverjanje na gostovanem Supabase z resničnimi računi je ločen ročni korak.

## US-03 – povezave (#7, #8)

- Kot trener pošljite povabilo obstoječi stranki po e-naslovu.
- Podatki stranke pred sprejemom niso dostopni prek `/api/clients/:id`.
- Kot stranka v ločenem brskalniku povabilo sprejmite ali zavrnite.
- Po sprejemu trener lahko prebere profil. Po zavrnitvi ga ne more.
- Nepovezan trener in druga stranka ne moreta sprejeti tujega povabila.

## US-04 – dodelitve (#9, #10)

- Trener v Dodelitvah izbere lasten program in potrjeno stranko.
- Pred potrditvijo vidi program z vajami in podatke prejemnika.
- Stranka po osvežitvi vidi dodeljeni program v Dodelitvah in Programih.
- Čakajoča povezava ne omogoči dodelitve. Drug račun ne vidi dodeljenega programa.
- Ponovitev dodelitve istega programa isti stranki ne ustvari dvojnikov.
- Za starejšo bazo brez sestavljene omejitve UNIQUE izvedite migracijo 0010.
  Dodelitev mora uspeti tudi tam; prejemnik vidi program in vaje, drug račun pa ne.

## US-05 – beleženje serij (#11, #12)

- V Treningih izberite lasten ali dodeljen program in začnite trening.
- Prikažejo se njegove vaje, ciljne serije in ponovitve.
- Dodajte, popravite in izbrišite serijo. Ponovitve morajo biti pozitivno celo
  število; teža je v kg in je lahko 0, ne sme pa biti negativna.
- Po osvežitvi strani ponovno odprite trening in preverite ohranjene serije.
- Sprememba programa ne spremeni posnetka že začetega treninga.
- Drug račun ne vidi ali spreminja vaših serij. Potrjen trener jih lahko le bere.

## US-06 – zaključek in volumen (#13, #14)

- Prazen trening nima omogočenega zaključka; tudi API ga zavrne.
- Shranite 10 × 20 kg in 5 × 12,5 kg. Zaključek pokaže 262,5 kg.
- Shranjena sta čas zaključka in rezultat, ki ostaneta po osvežitvi.
- Ponoven klic zaključka vrne isti čas in rezultat, brez novih zapisov.
- Zaključenemu treningu ni mogoče dodajati, spreminjati ali brisati serij.

## US-07 – osebni rekordi (#15, #16)

- Prvi zaključen trening z vajo ustvari začetni rekord.
- Naslednji trening z enako ali nižjo največjo težo ne prikaže novega rekorda.
- Višja teža prikaže nov rekord ter prejšnjo vrednost pri ustrezni vaji.
- Višja teža na nedokončanem ali tujem treningu ne vpliva na primerjavo.
- Rekord ostane prikazan ob ponovnem odprtju treninga; ponovljen zaključek
  ne ustvari dodatnih dogodkov. Tuj račun dogodkov ne vidi.
