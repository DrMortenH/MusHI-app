---
name: smertesyn-forsker
description: Analyserer en videnskabelig forfatter/forsker ud fra navn og profillink og vurderer på dansk, hvad forskningen handler om, og i hvilken grad forskerens syn på smerte svarer til Morten Hoeghs moderne, biopsykosociale smertesyn. Indeholder også kommandoer til at opdatere referenceprofilen fra ORCID eller manuelt. Brug når brugeren skriver /smertesyn-forsker, "analyser forsker", "hvad mener <forsker> om smerte", eller indsætter en forskerprofil og spørger om match med sit smertesyn.
---

# Smertesyn – forskeranalyse

Skillen har tre kommandoer. Læs argumentet og vælg:

| Kommando | Handling |
|---|---|
| `/smertesyn-forsker <navn> <link>` | **Analyse** af en forsker (afsnit A) |
| `/smertesyn-forsker opdater` | **Opdater** referenceprofilen fra ORCID (afsnit B) |
| `/smertesyn-forsker tilføj <DOI/PMID/tekst>` | **Tilføj** manuelt materiale til profilen (afsnit C) |

Filer i denne mappe:
- `smerteprofil.md` – referenceprofilen (brugerens smertesyn). Altid udgangspunktet for sammenligning.
- `kilder.md` – de artikler/noter profilen bygger på (bruges til at se, hvad der er nyt).

Brugeren: Morten Hoegh, Aalborg Universitet, ORCID `0000-0002-9724-767X`.

---

## Før alt andet: tjek profilens status

Læs `smerteprofil.md`. Står der `Status: UDKAST`, så sig det kort til brugeren før analysen
("Bemærk: din smerteprofil er endnu ikke bekræftet") og tilbyd at gennemgå den.

---

## A. Analyse af en forsker

### 1. Indsaml data (brug alle kilder, der virker – fald roligt tilbage)

1. **Profillinket** – hent med WebFetch. Udtræk navn, affiliering, forskningsområder,
   ORCID-id hvis det står der, og evt. publikationsliste.
2. **PubMed** (PubMed MCP-værktøjerne `search_articles` / `get_article_metadata`):
   - Har du et ORCID: søg `<ORCID>[auid]`.
   - Ellers: `"<Efternavn> <Initialer>"[Author]` kombineret med affiliering eller `pain`.
     Tjek affilieringer, så du ikke blander navnebrødre sammen.
   - Hent 20–40 af de nyeste artikler, sorteret efter dato. Læs abstracts.
   - Hent metadata i batches på højst ~10 PMID'er ad gangen (store svar bliver ellers for lange).
3. **OpenAlex / ORCID** (bibliometri og emner), hvis netværket tillader det:
   - `https://api.openalex.org/authors/orcid:<ORCID>` eller `https://api.openalex.org/authors?search=<navn>`
     → `topics`, `summary_stats`, `works_count`, `last_known_institutions`.
   - `https://api.openalex.org/works?filter=author.id:<id>&sort=publication_date:desc&per_page=50`
   - `https://pub.orcid.org/v3.0/<ORCID>/works` med header `Accept: application/json`.
   - Hvis en kilde er blokeret eller fejler: skriv kort hvilken i svaret og fortsæt med resten.

Brug kun det, kilderne faktisk viser. Gæt ikke på holdninger, der ikke kan underbygges.
Hvis materialet er for tyndt til en vurdering (fx få eller rent basalvidenskabelige artikler),
så sig det tydeligt i stedet for at overfortolke.

### 2. Vurder mod referenceprofilen

Sammenlign forskerens arbejde med hvert princip i `smerteprofil.md`. Kig efter:

- **Tegn på overensstemmelse**: smerte adskilt fra vævsskade; multifaktorielle/biopsykosociale
  modeller brugt reelt (ikke kun nævnt); mekanismebaseret neurovidenskab (sensitisering,
  modulation, nociplastisk smerte); patientuddannelse og sundhedskompetence; kritik af
  overdiagnostik/billeddiagnostik; personcentreret og inddragende forskning.
- **Tegn på afvigelse**: rent biomekaniske/strukturelle forklaringer på kroniske smerter;
  billedfund eller belastning som primær årsag; smerte = skade; passive behandlinger som
  hovedløsning; "psykosocialt" brugt som "det sidder i hovedet"; ensidigt farmakologisk fokus.
- **Nuancer**: Forskning i fx neuropatisk smerte eller røde flag er *ikke* i modstrid med
  profilen – biologien tages alvorligt i et biopsykosocialt syn. Vurder *hvordan* biologien
  indrammes, ikke *om* den studeres.

Skeln mellem forskerens egne udsagn (editorials, reviews, diskussioner) og ren empiri,
hvor holdningen kun kan udledes indirekte. Angiv hvor sikker vurderingen er.

### 3. Svarformat (dansk, kun i chatten – gem ikke filer)

Kun tekst – ingen talscore. Brug disse overskrifter:

```
## <Navn> – <affiliering>

**Datagrundlag:** <hvilke kilder, antal artikler, periode; hvilke kilder fejlede>

### Forskningsområde
<3–6 sætninger: hovedtemaer, metoder, populationer, udvikling over tid>

### Overensstemmelse med dit smertesyn
<Narrativ vurdering. Samlet konklusion først (fx "i høj grad enig", "delvist", "overvejende
anderledes"), derefter hvor der er enighed og hvor der er forskel – knyttet til konkrete
principper i din profil og konkrete artikler. Afslut med hvor sikker vurderingen er og hvorfor.>

### Artikler du bør læse
<3–5 artikler: titel, år, én linje om hvorfor – med DOI-link (https://doi.org/...)>

### Samarbejdspotentiale
<Overlap med dine temaer (fx patientuddannelse, pain literacy, arbejdsrelateret smerte,
digital sundhed, pain science i klinikken), komplementære kompetencer, mulige roller:
samarbejdspartner, reviewer, ekstern bedømmer, oplægsholder. Nævn evt. fælles medforfattere.>

*Kilder: PubMed (+ evt. OpenAlex/ORCID/profilside)*
```

Når PubMed bruges, skal det fremgå ("Baseret på artikler fra PubMed"), og DOI-links skal med.

---

## B. Opdater profilen fra ORCID

1. Hent brugerens værker: først `https://pub.orcid.org/v3.0/0000-0002-9724-767X/works`
   (Accept: application/json). Hvis blokeret: PubMed `0000-0002-9724-767X[auid]` **og**
   `(Hoegh M[Author] OR Hoegh MS[Author]) AND (Aalborg[Affiliation] OR pain)`.
2. Sammenlign med `kilder.md`. Find de artikler, der ikke står der.
3. Hvis intet nyt: sig det og stop.
4. Læs abstracts for de nye artikler. Foreslå konkrete ændringer til `smerteprofil.md`
   (nye principper, skærpede formuleringer, nye temaer) som en tydelig før/efter-liste.
5. **Gem intet, før brugeren har godkendt.** Efter godkendelse: opdater `smerteprofil.md`
   (inkl. "Sidst opdateret"), tilføj de nye artikler i `kilder.md`, og tilbyd at committe.

## C. Tilføj manuelt

Argumentet kan være en DOI, et PMID, et link eller fri tekst (fx brugerens egne noter eller
et citat fra et oplæg).

1. DOI/PMID/link: hent metadata og abstract (PubMed MCP eller WebFetch).
   Fri tekst: brug teksten direkte.
2. Foreslå hvordan profilen bør justeres – eller sig, at materialet allerede er dækket.
3. **Gem intet, før brugeren har godkendt.** Efter godkendelse: opdater `smerteprofil.md`
   og tilføj en linje i `kilder.md` under "Manuelt tilføjet" med dato.

## Bekræftelse af udkast

Når brugeren bekræfter profilen (evt. med rettelser): ret teksten, sæt
`Status: BEKRÆFTET` og datoen, og tilbyd at committe.
