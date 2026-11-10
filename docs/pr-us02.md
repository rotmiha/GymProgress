# US-02 – ustvarjanje in urejanje programov

Closes #5
Closes #6

Prijavljeni stranki ali trenerju omogoči sestavljanje programa iz kataloga vaj,
nastavitev serij in ponovitev, dodajanje/odstranjevanje ter premikanje vaj.
Obstoječ program lahko lastnik ponovno odpre in uredi.

SQL funkcija shrani program atomarno in preveri lastništvo. RLS skrije tuje
programe; neposredno pisanje tabel ni dovoljeno. Dodana je migracija 0003.

Preverjanje: `npm test` (27 uspešnih testov) in `npm run build`.
PostgreSQL testi preverjajo validacijo, transakcijo in zavrnitev tujih zapisov.
Ročni scenariji: docs/08-preverjanje-mvp.md. Gostovani Supabase še ni preverjen.
