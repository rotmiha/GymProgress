# US-04 – dodeljevanje programov povezanim strankam

Closes #9
Closes #10

Trener izbere lasten program in potrjeno stranko. Pred potrditvijo vidi program,
vaje in prejemnika. Stranka vidi dodelitve ter vsebino programa, ne more pa
spreminjati trenerjevega programa. Ponovljena dodelitev ne ustvari dvojnika.

Migracija 0005 doda dodelitve, preverjanje povezave in RLS za dodeljene programe.
RPC vedno preveri lastništvo in potrjeno povezavo; neposredno pisanje je zavrnjeno.
Veja izhaja iz main po združitvi US-03.

Preverjanje: PostgreSQL testi dovoljenj in idempotentnosti ter preizkus obveznega
pregleda dodelitve v Reactu; `npm test` in `npm run build`.
Gostovani Supabase še ni preverjen. Ročni scenariji: docs/08-preverjanje-mvp.md.
