// Vercel Serverless Function: /api/motoffensiv
// Motstanderagent — henter siste utspill fra Frp (via Google Nyheter site:frp.no
// + brede Frp-søk), klassifiserer på tema, og kobler til utredninger/budsjettdata
// som gir faktagrunnlag for motoffensiv.
//
// Ingen data publiseres. Kun internt beslutningsgrunnlag.
//
// Auth: krever ?key=<TOKEN> match mot MOTOFFENSIV_TOKEN env var.
// Uten korrekt token svarer vi 401 slik at siden ikke kan indekseres av søkemotorer
// eller brukes anonymt.

import { decodeGoogleNewsUrl, parseRssItems } from '../lib/gnews.js';
import { UTREDNINGER } from '../lib/utredninger-esm.js';
import { FRP_PROGRAM } from '../lib/frp-program-esm.js';
import { hentFrpSporsmal } from '../lib/stortinget.js';

// Fjernet maxDuration — Hobby-plan tillater ikke > 10s. Vi bygger derfor
// funksjonen slik at den holder seg innenfor grensen: aggressive timeouts,
// mindre Stortinget-data, hard cap på total tid.

const UA =
  'Mozilla/5.0 (compatible; UsminketBot/1.0; +https://usminket.vercel.app)';

// Feeds vi henter fra:
// 1. Site:frp.no — offisielle Frp-pressemeldinger og temasider
// 2. Frp-topper i offentlig rolle — Listhaug, Amundsen, sentrale stortingsrepresentanter
// 3. Frp OG «alternativt budsjett»-varianter — fanger opp finanspolitiske utspill
const FRP_FEEDS = [
  'https://news.google.com/rss/search?q=site:frp.no+when:14d&hl=no&gl=NO&ceid=NO:no',
  'https://news.google.com/rss/search?q=(Listhaug+OR+%22Sylvi+Listhaug%22+OR+%22Ketil+Solvik-Olsen%22+OR+%22Roy+Steffensen%22+OR+%22Hans+Andreas+Limi%22)+when:7d&hl=no&gl=NO&ceid=NO:no',
  'https://news.google.com/rss/search?q=(%22Fremskrittspartiet%22+OR+%22FrP%22)+when:7d&hl=no&gl=NO&ceid=NO:no',
];

// Tema-klassifisering — samme ordbok som news.js, men re-implementert her
// for isolasjon (motoffensiv-API-et bør ikke ha noen usikker kobling til
// den offentlige news-endpointen).
const TEMA_KEYWORDS = {
  skatt: [
    'skatt', 'skatte', 'formuesskatt', 'skattekutt', 'skattelette',
    'arveavgift', 'moms', 'avgift', 'grunnrente', 'bilavgift', 'engangsavgift',
    'eiendomsskatt', 'inntektsskatt', 'selskapsskatt', 'utbytteskatt',
    'skattereform', 'skattetrykk', 'skattelegging', 'skatteregning',
  ],
  velferd: [
    'velferd', 'helse', 'sykehus', 'eldre', 'eldreomsorg', 'pensjon',
    'trygd', 'nav', 'privatiser', 'kommersialiser', 'fritt behandlingsvalg',
    'egenandel', 'sykehjem', 'barnehage', 'skole', 'utdanning',
    'barnetrygd', 'kontantstøtte', 'fastlege',
  ],
  arbeidsliv: [
    'arbeidsliv', 'arbeidsmiljølov', 'innleie', 'bemanning', 'lo ',
    'tariff', 'lønn', 'fagforening', 'streik', 'a-krim', 'sosial dumping',
    'midlertidig ansett', 'fast ansett', 'trepart',
  ],
  klima: [
    'klima', 'utslipp', 'olje', 'gass', 'petroleum', 'havvind',
    'vindkraft', 'elbil', 'bensinbil', 'dieselbil', 'co2', 'co₂',
    'klimatiltak', 'klimaavgift', 'grønn omstilling', 'fornybar',
    'strømpris', 'strømstøtte', 'energi',
  ],
  innvandring: [
    'innvandring', 'asyl', 'flyktning', 'ukrainer', 'integrer',
    'utlending', 'udi', 'grens', 'schengen', 'retur', 'utvisning',
    'kvoteflyktning', 'islamsk', 'muslim', 'assimilering',
  ],
  justis: [
    'kriminal', 'straff', 'politi', 'gjeng', 'narkotika', 'vold',
    'voldtekt', 'overgrep', 'fengsel', 'soning', 'utvisning',
    'strengere straff', 'strafferabatt', 'nabolagspoliti', 'terror',
    'beredskap',
  ],
  distrikt: [
    'distrikt', 'landsbygd', 'landbruk', 'bonde', 'fiske', 'havbruk',
    'kommune', 'fylke', 'nord-norge', 'kommuneøkonomi', 'ferge',
    'næringsliv', 'reindrift',
  ],
  samferdsel: [
    'samferdsel', 'motorvei', 'firefelts', 'jernbane', 'tog', 'bompeng',
    'bomring', 'nye veier', 'statens vegvesen', 'ntp', 'transportplan',
    'bilavgift', 'ferge', 'fartsgrense', 'kollektiv',
  ],
  budsjett: [
    'alternativt statsbudsjett', 'alt.budsjett', 'oljepengebruk',
    'handlingsregel', 'statsbudsjett', 'saldert', 'oljefond',
    'finanspolitikk',
  ],
};

function klassifiser(title, summary) {
  const t = ((title || '') + ' ' + (summary || '')).toLowerCase();
  const treff = [];
  for (const [tema, ord] of Object.entries(TEMA_KEYWORDS)) {
    if (ord.some((k) => t.includes(k))) treff.push(tema);
  }
  return treff;
}

// Rens tittel — fjerner Frp-suffix og kilde-suffix
function renseTittel(raw) {
  return raw
    .replace(/\s*[-–—]\s*Fremskrittspartiet\s*[-–—]?\s*FrP\.?\s*$/i, '')
    .replace(/\s*[-–—]\s*Frp\s*$/i, '')
    .replace(/\s*[-–—]\s*(NRK|VG|Dagbladet|Aftenposten|TV\s?2|Nettavisen|Dagsavisen|Klassekampen|Nationen|Vårt Land|Khrono)\s*$/i, '')
    .replace(/\s*-\s*[a-z]+\.no\s*$/i, '')
    .trim();
}

// For hvert tema — finn matchende utredninger vi kan bruke som motargument
function faktaKobling(temaer) {
  const kilder = [];
  for (const tema of temaer) {
    const data = UTREDNINGER[tema];
    if (!data || !data.items) continue;
    for (const item of data.items) {
      kilder.push({
        tema,
        tittel: item.tittel,
        undertittel: item.undertittel,
        aar: item.aar,
        type: item.type,
        beskrivelse: item.beskrivelse,
        url: item.url,
      });
    }
  }
  return kilder;
}

// Konkrete motargument-forslag per tema — kort tekst som redaksjonelt utgangspunkt.
// Dette er ikke ferdig innhold, men vinklinger med tallgrunnlag.
const MOTVINKLINGER = {
  skatt: [
    {
      overskrift: 'Hvem taper på Frps skattekutt?',
      argument: 'Frps alt.budsjett 2026 gir 35,7 mrd i skattekutt og 16 mrd i avgiftskutt. Torvik-utvalget (NOU 2022:20) viser at kutt i formuesskatt og arveavgift går til de 1 % rikeste. En sykepleier taper mer på fjernet feriepengefradrag enn hun sparer på lavere trinnskatt.',
      formidler: 'SSB-forsker eller LO-økonom',
      kilde: 'https://www.regjeringen.no/no/dokumenter/nou-2022-20/id2951826/',
    },
    {
      overskrift: '15 milliarder i økt oljepengebruk',
      argument: 'Frps alternative statsbudsjett øker oljepengebruken med 15 mrd utover regjeringens. Det er handlingsregelen som forsvinner — nøyaktig det finansministre fra alle partier har advart mot i 30 år.',
      formidler: 'Finansminister eller Norges Bank-referanse',
      kilde: 'https://www.regjeringen.no/no/tema/okonomi-og-budsjett/norsk_okonomi/handlingsregelen/id449350/',
    },
  ],
  velferd: [
    {
      overskrift: 'Sverige-eksperimentet med velferd',
      argument: 'Frp vil åpne mer for kommersielle aktører i eldreomsorg og skole. Sverige gjorde det på 2000-tallet — resultatet var Attendo-skandalene, konkurser i skolen og lavere kvalitet i utsatte områder. Helsepersonellkommisjonen (NOU 2023:4) anbefaler det motsatte.',
      formidler: 'Sykepleier eller lærer med Sverige-erfaring',
      kilde: 'https://www.regjeringen.no/no/dokumenter/nou-2023-4/id2961552/',
    },
  ],
  arbeidsliv: [
    {
      overskrift: 'Innleiereformen — Frp vil reversere',
      argument: 'Innleiereformen 2023 (Prop. 131 L) tok tilbake tusenvis av faste stillinger fra bemanningsbyråer. Frp vil reversere. Det betyr midlertidighet, lavere lønn og svakere fagforeningsdekning. Fougner-utvalget (NOU 2021:9) advarte mot akkurat den utviklingen Frp nå vil ha.',
      formidler: 'Bygningsarbeider eller LO-tillitsvalgt',
      kilde: 'https://www.regjeringen.no/no/dokumenter/prop.-131-l-20212022/id2921815/',
    },
  ],
  klima: [
    {
      overskrift: 'Frp mot fagmiljøene',
      argument: 'Klimautvalget 2050 (NOU 2023:25) anbefaler 55 % utslippskutt innen 2030. Energikommisjonen (NOU 2023:3) anbefaler massiv fornybar-utbygging. Frp går imot begge — vil kutte klimatiltak, avvikle CO2-avgifter og satse mer på olje.',
      formidler: 'Klimaforsker eller ordfører i havvind-kommune',
      kilde: 'https://www.regjeringen.no/no/dokumenter/nou-2023-25/id3006059/',
    },
    {
      overskrift: 'Arbeidsplasser i Mo i Rana, Heim, Porsgrunn',
      argument: 'Batterifabrikker, havvind-serviceanlegg og hydrogenprosjekter gir tusenvis av arbeidsplasser i distriktene. Frps program om å bremse grønn omstilling truer disse investeringene.',
      formidler: 'Ordfører eller industrileder i berørt kommune',
      kilde: 'https://www.regjeringen.no/no/dokumenter/nou-2023-3/id2961311/',
    },
  ],
  innvandring: [
    {
      overskrift: 'Fakta over frykt',
      argument: 'Nærmere halvparten av ukrainerne er allerede i jobb — raskere enn noen tidligere flyktninggruppe. Integreringsloven virker. Brochmann II (NOU 2017:2) viste at norsk integreringsmodell er effektiv når vi bruker den, ikke bremser den.',
      formidler: 'NAV-veileder eller ukrainsk arbeidstaker',
      kilde: 'https://www.regjeringen.no/no/aktuelt/narmere-halvparten-av-ukrainerne-er-i-jobb/id3111244/',
    },
  ],
  justis: [
    {
      overskrift: 'Strengere straff virker ikke alene',
      argument: 'Frp krever alltid strengere straffer. Barnevoldsutvalget II (NOU 2023:31) og Totalberedskapskommisjonen (NOU 2023:17) viser at forebygging, nabolagspoliti og tidlig innsats er det som faktisk reduserer kriminalitet. Regjeringen har nettopp økt bruken av omvendt voldsalarm — konkrete tiltak, ikke tomme trusler.',
      formidler: 'Politibetjent eller kriminolog',
      kilde: 'https://www.regjeringen.no/no/aktuelt/markant-okning-i-bruken-av-omvendt-voldsalarm/id3169017/',
    },
  ],
  distrikt: [
    {
      overskrift: 'Distriktspolitikk er mer enn bompengekutt',
      argument: 'Demografiutvalget (NOU 2020:15) og Inntektssystemutvalget (NOU 2022:10) viser at distriktene trenger sterkere kommuneøkonomi, ikke svakere. Frp vil kutte kommunerammene og fjerne distriktstilskudd — konsekvensen er færre lærere, dårligere eldreomsorg og lengre reisetid til fastlege.',
      formidler: 'Distriktsordfører (helst Sp eller Ap)',
      kilde: 'https://www.regjeringen.no/no/dokumenter/nou-2022-10/id2924789/',
    },
  ],
  samferdsel: [
    {
      overskrift: 'Motorvei eller vedlikehold?',
      argument: 'NTP 2025-2036 (Meld. St. 14) prioriterer vedlikehold, jernbane og trafikksikkerhet. Frp vil bygge flere firefeltsveier — Statens vegvesen har advart mot dette fordi det bryter med Nullvisjonen og øker klimagassutslipp. Bilavgiftsutvalget (NOU 2019:22) anbefaler det motsatte av Frps program.',
      formidler: 'Vegvesen-fagperson eller trafikksikkerhetsekspert',
      kilde: 'https://www.regjeringen.no/no/dokumenter/meld.-st.-14-20232024/id3033168/',
    },
  ],
  budsjett: [
    {
      overskrift: 'Handlingsregelen — Frps blindsone',
      argument: 'Frps alt.budsjett 2026 øker oljepengebruken med 15 mrd. Kombinert med 53,7 mrd i skatte- og avgiftskutt gir dette en makroøkonomisk skjøttet finansminister har advart mot. Norges Bank har historisk vært klar: brudd på handlingsregelen presser opp renta og svekker krona.',
      formidler: 'Finansminister eller uavhengig økonom',
      kilde: 'https://www.regjeringen.no/no/tema/okonomi-og-budsjett/norsk_okonomi/handlingsregelen/id449350/',
    },
  ],
};

export default async function handler(req, res) {
  try {
    // Auth-sjekk
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const token = (url.searchParams.get('key') || '').trim();
    const expected = (process.env.MOTOFFENSIV_TOKEN || '').trim();
    if (!expected || token !== expected) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="motoffensiv"');
      return res.status(401).json({ error: 'unauthorized' });
    }

    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1),
      50,
    );
    const filterTema = (url.searchParams.get('tema') || '').toLowerCase().trim();

    // Hent alle Frp-feeds OG Stortinget-data parallelt — sparer 3-6 sekunder
    // på total responstid siden Stortinget-API-et er tregt (henter ~1MB JSON).
    const headers = {
      'User-Agent': UA,
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.5',
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,en;q=0.7',
    };

    // Vercel Hobby-plan cap: 10s total. Aggressive timeouts på 4s per feed
    // og en hard 6s cap på Stortinget, så vi har buffer til dekoding + respons.
    const stortingetPromise = Promise.race([
      hentFrpSporsmal(),
      new Promise((resolve) => setTimeout(() => resolve({ items: [] }), 6000)),
    ]).catch((e) => {
      console.error('Stortinget-fetch feilet:', e.message);
      return { items: [] };
    });

    const [responses, stortingetResult] = await Promise.all([
      Promise.allSettled(
        FRP_FEEDS.map((u) =>
          fetch(u, { headers, signal: AbortSignal.timeout(4000) }).then(async (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
          }),
        ),
      ),
      stortingetPromise,
    ]);

    // Slå sammen alle items
    const seenTitle = new Set();
    const seenLink = new Set();
    let items = [];
    for (const r of responses) {
      if (r.status !== 'fulfilled') continue;
      for (const it of parseRssItems(r.value)) {
        const title = renseTittel(it.title);
        const titleKey = title.toLowerCase().trim();
        if (!title || seenTitle.has(titleKey) || seenLink.has(it.link)) continue;
        seenTitle.add(titleKey);
        seenLink.add(it.link);

        const temaer = klassifiser(title, it.summary);
        // Filtrer bort saker uten tema-treff — de er ikke motoffensiv-materiale
        if (temaer.length === 0) continue;
        if (filterTema && !temaer.includes(filterTema)) continue;

        // Google Nyheter-sammendrag er bare en HTML-lenke til samme sak
        // — vi dropper det. Kilde og tittel er nok.
        items.push({
          tittel: title,
          link: it.link,
          pubDate: it.pubDate,
          kilde: it.source || 'Google Nyheter',
          sammendrag: '',
          temaer,
        });
      }
    }

    // 14-dagers cutoff — eldre saker er ikke ferske utspill
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    items = items.filter((it) => {
      const ts = new Date(it.pubDate).getTime();
      return ts && ts >= cutoff;
    });

    // Sorter nyeste først
    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    items = items.slice(0, limit);

    // Dekod Google Nyheter-lenker til ekte kildeadresser — hver dekoding
    // kan ta 1-3s, så vi setter en hard 2s cap per lenke. Feiler dekodingen
    // beholder vi Google-lenken (brukeren kommer til samme sak uansett).
    items = await Promise.all(
      items.map(async (it) => {
        if (it.link && it.link.includes('news.google.com')) {
          const decoded = await Promise.race([
            decodeGoogleNewsUrl(it.link).catch(() => it.link),
            new Promise((resolve) => setTimeout(() => resolve(it.link), 2000)),
          ]);
          it.link = decoded || it.link;
        }
        return it;
      }),
    );

    // For hver sak — koble til faktagrunnlag, motvinklinger og Frps eget program
    items = items.map((it) => ({
      ...it,
      kildeType: 'nyhet',
      motvinklinger: it.temaer
        .flatMap((t) => MOTVINKLINGER[t] || [])
        .slice(0, 2),
      utredninger: faktaKobling(it.temaer).slice(0, 3),
      frpProgram: it.temaer
        .flatMap((t) => {
          const p = FRP_PROGRAM[t];
          if (!p || !p.programpunkter) return [];
          return p.programpunkter.slice(0, 3).map((pp) => ({ tema: t, ...pp }));
        })
        .slice(0, 4),
    }));

    // Bearbeid Stortinget-data som allerede er hentet parallelt over
    const stortingsItems = (stortingetResult.items || [])
      .map((s) => ({
        ...s,
        temaer: klassifiser(s.tittel, ''),
      }))
      .filter((s) => s.temaer.length > 0)
      .filter((s) => !filterTema || s.temaer.includes(filterTema))
      .slice(0, 15)
      .map((s) => ({
        kildeType: 'stortinget',
        tittel: s.tittel,
        link: s.kilde_url,
        pubDate: s.datert,
        kilde: `Stortinget · ${s.type} · ${s.fra}`,
        fra_representant: s.fra,
        til_minister: s.til_minister,
        type: s.type,
        status: s.status,
        sammendrag: '',
        temaer: s.temaer,
        motvinklinger: s.temaer
          .flatMap((t) => MOTVINKLINGER[t] || [])
          .slice(0, 2),
        utredninger: faktaKobling(s.temaer).slice(0, 2),
        frpProgram: s.temaer
          .flatMap((t) => {
            const p = FRP_PROGRAM[t];
            if (!p || !p.programpunkter) return [];
            return p.programpunkter.slice(0, 2).map((pp) => ({ tema: t, ...pp }));
          })
          .slice(0, 3),
      }));

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({
      items,
      stortinget: stortingsItems,
      fetchedAt: new Date().toISOString(),
      count: items.length,
      stortingetCount: stortingsItems.length,
      tema: filterTema || null,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'fetch_failed',
      message: err.message || String(err),
    });
  }
}
