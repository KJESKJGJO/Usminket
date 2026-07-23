# Usminket politikk

Nettside for politisk uavhengig gruppe — fakta og analyse om norsk politikk, uten sminke.

**Live:** https://usminket.vercel.app

## Om prosjektet

Nettsiden dokumenterer og analyserer norsk politikk med særlig blikk på Fremskrittspartiets programmatiske linje og hva den betyr i praksis. Alle analyser er kildebelagt.

## Tema-sider

- **Skatt og økonomi** — analyse av skattepolitikk, formuesskatt og skattekommisjonen
- **Velferd og pensjon** — velferdsordninger, pensjon og trygdeytelser
- **Arbeidsliv** — lønn, tariff og arbeidsmarked
- **Klima og miljø** — klimapolitikk og oppfølging av Paris-avtalen
- **Justis og beredskap** — politi, kriminalitet og samfunnssikkerhet
- **Innvandring** — asyl, integrering og utlendingsfeltet
- **Distrikt og kommune** — kommuneøkonomi og regional utvikling
- **Samferdsel** — transport, vei, jernbane og kollektiv
- **Utenriks og forsvar** — EU/EØS, sikkerhetspolitikk og bistand
- **Statsbudsjett** — budsjettanalyse
- **Folk flest** — argumentsamling

## Teknisk

Statisk HTML/CSS/JS med noen Vercel Serverless Functions for RSS-integrasjon og nyhetshenting.

### Struktur

```
usminket/
├── *.html               # Tema-sider
├── api/                 # Vercel Serverless Functions
│   ├── rss-tema.js      # RSS-feed fra regjeringen.no per tema
│   ├── news.js          # Nyhetsintegrasjon
│   ├── stortinget.js    # Stortinget-integrasjon
│   └── ...
├── css/style.css        # Hovedstilark
├── js/main.js           # Klient-JS
├── data/                # Statisk data (Frp-program, utredninger)
├── lib/                 # Delt server-side kode
└── vercel.json          # Vercel-konfig
```

### Deploy

Prosjektet deployes automatisk til Vercel ved push til `main`.

Manuell deploy:
```bash
vercel deploy --prod
```

### Miljøvariabler

Disse settes i Vercel-dashboardet under **Project → Settings → Environment Variables**. Aldri commit til git.

| Variabel | Kreves? | Beskrivelse |
|---|---|---|
| `OPENAI_API_KEY` | Valgfri | Nøkkel til OpenAI-API for AI-generert kritisk analyse på hver sak i nyhetsfeeden (`/nyheter`). Uten nøkkel viser feeden vanlig ingress — alt fungerer, bare uten AI-tekst. |
| `OPENAI_MODEL` | Valgfri | Overstyrer OpenAI-modellen. Default: `gpt-4o-mini` (billigst og raskest). |
| `MOTOFFENSIV_TOKEN` | For `/motoffensiv` | Auth-token til intern motoffensiv-siden. |

#### Slik setter du opp `OPENAI_API_KEY`

1. Lag en nøkkel på [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (Create new secret key).
2. Åpne Vercel-dashboardet → velg `Usminket`-prosjektet → **Settings** → **Environment Variables**.
3. Legg til:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** `sk-...` (nøkkelen din)
   - **Environments:** Kryss av for **Production**, **Preview** og **Development**.
4. Klikk **Save**.
5. Trigg en ny deploy — enten push til main, eller **Deployments → Redeploy** på siste build.
6. Test på `/nyheter` — hver nyhetssak bør nå få en rødstripet «Kritisk analyse»-blokk under ingressen.

#### Kostnader

Med `gpt-4o-mini` og 50 saker per lastning (batchet 10 av gangen = 5 kall) er hver sideinnlasting typisk **under én øre** i API-kostnader. Endepunktet cacher svar i CDN i 1 time, så gjentatte visninger av samme sak er gratis.

Hvis du vil skru av AI-analysen midlertidig, slett `OPENAI_API_KEY` fra Vercel — feeden fortsetter å fungere med bare ingress.

## Følg oss

- **Nettside:** https://usminket.vercel.app
- **Nyhetsbrev:** https://usminket.vercel.app/folg
- **RSS-feeder per tema:** https://usminket.vercel.app/folg#rss

## Lisens

Alle analyser og tekster er skrevet av redaksjonen og lisensiert under CC BY-SA 4.0 med mindre annet er oppgitt. Kildehenvisninger er markert i teksten på hver side.
