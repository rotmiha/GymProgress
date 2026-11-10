# US-05 – začetek treninga in beleženje serij

Closes #11
Closes #12

Uporabnik začne trening iz lastnega ali dodeljenega programa, izbere vajo in
beleži ponovitve ter težo v kg. Serije lahko pred zaključkom popravi ali izbriše.
Ob ponovnem odprtju se ohranijo podatki; začetek s ponovljeno zahtevo ne podvoji treninga.

Migracija 0006 shrani posnetek programa in uvede RPC za serije. Preveri lastništvo,
veljavnost vaje, pozitivne cele ponovitve in nenegativno težo. RLS skrije tuje
treninge, potrjeni trener pa ima le bralni dostop do strankinih treningov.
Veja je ustvarjena iz main po združitvi US-04.

Preverjanje: PostgreSQL testi validacije, posnetka programa, dostopov in operacij
na serijah, React preizkus začetka in vnosa serije; `npm test`, `npm run build`.
Gostovani Supabase še ni preverjen. Ročni scenariji: docs/08-preverjanje-mvp.md.
