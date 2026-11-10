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

Avtomatizirani testi izvajajo migracije, RPC in RLS v PostgreSQL (PGlite).
Preverjanje na gostovanem Supabase z resničnimi računi je ločen ročni korak.

## US-03 – povezave (#7, #8)

- Kot trener pošljite povabilo obstoječi stranki po e-naslovu.
- Podatki stranke pred sprejemom niso dostopni prek `/api/clients/:id`.
- Kot stranka v ločenem brskalniku povabilo sprejmite ali zavrnite.
- Po sprejemu trener lahko prebere profil. Po zavrnitvi ga ne more.
- Nepovezan trener in druga stranka ne moreta sprejeti tujega povabila.
