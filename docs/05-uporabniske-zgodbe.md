# GymProgress – uporabniške zgodbe in sprejemni kriteriji

## Izhodišča

Dokument vsebuje 15 uporabniških zgodb za aplikacijo GymProgress. US-01 je registracija in prijava, US-02 do US-07 spadajo v MVP, ostale funkcionalnosti pa so načrtovane za kasneje. Stranka upravlja svoje treninge, trener pa lahko spremlja le stranke, ki so potrdile povezavo. Administrator upravlja uporabnike in vaje.

Težo beležimo v kg. Pri izračunih in statistiki upoštevamo samo zaključene treninge.

## Pregled zgodb

| Zgodba | Funkcionalnost | Faza |
|---|---|---|
| US-01 | Registracija in prijava | Predpogoj MVP |
| US-02 | Sestavljanje programa (F-01) | MVP |
| US-03 | Povezava s trenerjem (F-02) | MVP |
| US-04 | Dodelitev programa (F-03) | MVP |
| US-05 | Beleženje serij (F-04) | MVP |
| US-06 | Zaključek treninga in volumen (F-05) | MVP |
| US-07 | Osebni rekordi (F-06) | MVP |
| US-08 | Zgodovina treningov (F-07) | Kasneje |
| US-09 | Graf napredka (F-08) | Kasneje |
| US-10 | Telesna masa (F-09) | Kasneje |
| US-11 | Komentar trenerja (F-10) | Kasneje |
| US-12 | Predloge programov (F-11) | Kasneje |
| US-13 | Rednost treningov (F-12) | Kasneje |
| US-14 | Primerjava načrta in izvedbe (F-13) | Kasneje |
| US-15 | Pregled strank (F-14) | Kasneje |

## US-01 – Registracija in prijava
**Vloga:** obiskovalec | **Faza:** predpogoj MVP

**Zgodba:** Kot obiskovalec želim ustvariti račun in se prijaviti, da lahko uporabljam aplikacijo.

**Sprejemni kriteriji:**
- Registracija zahteva veljaven e-naslov, geslo z vsaj 8 znaki in izbiro vloge stranka ali trener.
- Ob napačnih podatkih se prikaže napaka, administratorja pa si uporabnik ne more dodeliti sam.
- Po prijavi lahko uporabnik dostopa do svojih podatkov, po odjavi pa ne več.

## US-02 – Sestavljanje programa
**Vloga:** stranka ali trener | **Faza:** MVP | **Wireframe:** WF-01

**Zgodba:** Kot stranka želim sestaviti program vaj, da imam pripravljen načrt za trening.

**Sprejemni kriteriji:**
- Program mora imeti ime in vsaj eno vajo z določenimi serijami ter ponovitvami.
- Vaje lahko dodajam, odstranjujem in jim spreminjam vrstni red.
- Program se shrani in je dostopen njegovemu lastniku oziroma osebi, ki ji je dodeljen.

## US-03 – Povezava s trenerjem
**Vloga:** stranka in trener | **Faza:** MVP | **Wireframe:** WF-02

**Zgodba:** Kot stranka želim potrditi ali zavrniti trenerjevo povabilo, da sama odločam, kdo lahko spremlja moje treninge.

**Sprejemni kriteriji:**
- Trener lahko pošlje povabilo obstoječi stranki.
- Stranka lahko povabilo sprejme ali zavrne.
- Šele po potrditvi trener dobi dostop do strankinih podatkov in ji lahko dodeli program.

## US-04 – Dodelitev programa
**Vloga:** trener | **Faza:** MVP | **Wireframe:** WF-03

**Zgodba:** Kot trener želim dodeliti program povezani stranki, da lahko trenira po njem.

**Sprejemni kriteriji:**
- Trener lahko izbere svoj program in stranko s potrjeno povezavo.
- Pred dodelitvijo vidi izbrani program in prejemnika.
- Dodeljen program se prikaže stranki, drugim uporabnikom pa ne.

## US-05 – Beleženje serij
**Vloga:** stranka ali trener zase | **Faza:** MVP

**Zgodba:** Kot stranka želim beležiti ponovitve in težo pri vajah, da imam zapis opravljenega treninga.

**Sprejemni kriteriji:**
- Ob začetku treninga se prikažejo vaje iz izbranega programa.
- Pri seriji vnesem število ponovitev in težo v kg; ponovitve morajo biti pozitivno celo število, teža pa ne sme biti negativna.
- Serije lahko pred zaključkom popravim ali izbrišem; tujih treningov ne morem spreminjati.

## US-06 – Zaključek treninga
**Vloga:** stranka ali trener zase | **Faza:** MVP

**Zgodba:** Kot stranka želim zaključiti trening in videti skupni volumen, da lahko spremljam opravljeno delo.

**Sprejemni kriteriji:**
- Trening lahko zaključim, ko je shranjena vsaj ena serija.
- Volumen se izračuna kot vsota ponovitve × teža za vse opravljene serije
- Ob zaključku se shranita datum in rezultat treninga; ponovno zaključevanje ne podvoji podatkov.

## US-07 – Osebni rekord
**Vloga:** stranka ali trener zase | **Faza:** MVP

**Zgodba:** Kot stranka želim videti, kdaj dosežem nov osebni rekord, da lahko spremljam napredek.

**Sprejemni kriteriji:**
- Ob zaključku treninga aplikacija primerja največjo težo pri vaji s prejšnjimi rezultati.
- Če je nova teža višja, se prikaže nov rekord.
- Enaka ali nižja teža ni nov rekord; upoštevajo se le zaključeni treningi.

## US-08 – Zgodovina treningov
**Vloga:** stranka | **Faza:** kasneje

**Zgodba:** Kot stranka želim pregledati stare treninge, da vidim pretekle rezultate.

**Sprejemni kriteriji:**
- Prikazani so moji zaključeni treningi od najnovejšega naprej.
- Treninge lahko filtriram po datumu.
- Ob izbiri treninga vidim vaje, serije in skupni volumen.

## US-09 – Graf napredka
**Vloga:** stranka | **Faza:** kasneje

**Zgodba:** Kot stranka želim videti graf napredka pri vaji, da lažje spremljam spremembe v teži.

**Sprejemni kriteriji:**
- Izberem vajo, za katero imam shranjene rezultate.
- Graf prikazuje največjo uporabljeno težo po datumih zaključenih treningov.
- Prikazani so samo moji rezultati.

## US-10 – Beleženje telesne mase
**Vloga:** stranka | **Faza:** kasneje

**Zgodba:** Kot stranka želim beležiti telesno maso, da lahko spremljam njeno spreminjanje.

**Sprejemni kriteriji:**
- Vnesem datum in telesno maso v kg; masa mora biti pozitivna, datum pa ne sme biti v prihodnosti.
- Meritve so prikazane po datumu.
- Obstoječo meritev lahko popravim ali izbrišem; za isti datum je le ena meritev.

## US-11 – Komentar trenerja
**Vloga:** trener | **Faza:** kasneje

**Zgodba:** Kot trener želim komentirati zaključen trening stranke, da ji dam povratno informacijo.

**Sprejemni kriteriji:**
- Komentar lahko doda le trener s potrjeno povezavo.
- Komentar mora imeti od 1 do 1.000 znakov.
- Komentar vidita trener in stranka, ne vpliva pa na podatke treninga.

## US-12 – Predloge programov
**Vloga:** stranka ali trener | **Faza:** kasneje

**Zgodba:** Kot stranka želim uporabiti predlogo, da lahko hitreje ustvarim program.

**Sprejemni kriteriji:**
- Na voljo so predloge za različne cilje, npr. moč in hipertrofijo.
- Pred uporabo lahko pregledam vaje in serije.
- Predlogo lahko kopiram med svoje programe in jo prilagodim.

## US-13 – Rednost treningov
**Vloga:** stranka | **Faza:** kasneje

**Zgodba:** Kot stranka želim videti število treningov po tednih, da spremljam svojo rednost.

**Sprejemni kriteriji:**
- Prikazan je trenutni teden in prejšnjih sedem tednov.
- Štejejo samo zaključeni treningi.
- Tedni brez treningov imajo prikazano vrednost 0.

## US-14 – Primerjava načrta in izvedbe
**Vloga:** stranka | **Faza:** kasneje

**Zgodba:** Kot stranka želim primerjati načrtovane in opravljene serije, da vidim, koliko programa sem izvedla.

**Sprejemni kriteriji:**
- Pri vsaki vaji vidim število načrtovanih in opravljenih serij.
- Prikazana je razlika
- Primerjava ostane enaka tudi, če kasneje spremenim program.

## US-15 – Pregled strank
**Vloga:** trener | **Faza:** kasneje

**Zgodba:** Kot trener želim videti napredek svojih strank na enem mestu, da jih lahko lažje spremljam.

**Sprejemni kriteriji:**
- Trener vidi samo stranke, s katerimi ima potrjeno povezavo.
- Pri vsaki vidi zadnji trening ter število treningov in volumen v zadnjih 28 dneh.
- Z izbiro stranke lahko odpre njeno zgodovino treningov.

## INVEST

Zgodbe so razdeljene po posameznih funkcionalnostih, zato jih je lažje oceniti, razviti in testirati. Vsaka pove, kaj želi uporabnik doseči in kdaj funkcionalnost deluje pravilno. Podrobnosti izvedbe se lahko še prilagodijo med razvojem.
