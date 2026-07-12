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

## Følg oss

- **Nettside:** https://usminket.vercel.app
- **Nyhetsbrev:** https://usminket.vercel.app/folg
- **RSS-feeder per tema:** https://usminket.vercel.app/folg#rss

## Lisens

Alle analyser og tekster er skrevet av redaksjonen og lisensiert under CC BY-SA 4.0 med mindre annet er oppgitt. Kildehenvisninger er markert i teksten på hver side.
