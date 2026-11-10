# US-03 – povezava trenerja in stranke

Closes #7
Closes #8

Trener pošlje povabilo obstoječi stranki po e-naslovu, stranka pa ga v svojem
pogledu sprejme ali zavrne. Profil je trenerju dostopen šele po sprejemu.
Ponovna povabila niso podvojena; zavrnjeno povabilo je mogoče poslati ponovno.

Migracija 0004 uvede povezave, RLS ter transakcijske funkcije s preverjanjem
vloge in prejemnika. Nepovezan uporabnik ne more obravnavati tujega povabila
ali prebrati strankinega profila. Vejo smo posodobili iz main po združitvi US-02.

Preverjanje: `npm test` (30 uspešnih testov) in `npm run build`.
PostgreSQL testi preverjajo sprejem, zavrnitev, podvojitve in nedovoljene dostope.
Ročni scenariji: docs/08-preverjanje-mvp.md. Gostovani Supabase še ni preverjen.
