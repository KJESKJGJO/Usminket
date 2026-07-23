// Vercel Serverless Function: /api/frp-nyheter
// Samlet nyhetsfeed — Frps utspill i norske medier (nasjonalt + lokalt).
// Skiller ikke på tema som utgangspunkt, men klassifiserer hver sak slik at
// brukeren kan filtrere klientside.
//
// Query:
//   ?omraade=nasjonalt|lokalt|alle   (default: alle)
//   ?tema=<slug>                      (valgfritt tema-filter)
//   ?limit=<n>                        (default 40, maks 60)
//
// Retur: { items: [{ tittel, link, kilde, kildeType, pubDate, sammendrag, temaer }], fetchedAt, count }

import { decodeGoogleNewsUrl, parseRssItems } from '../lib/gnews.js';

const UA =
  'Mozilla/5.0 (compatible; UsminketBot/1.0; +https://usminket.vercel.app)';

// Brede søk på Frp-utspill i norske medier — vi ekskluderer site:frp.no for å
// unngå at deres egne pressemeldinger fyller feeden. Vi vil ha *andres* omtale.
// Flere parallelle søk gir bedre dekning enn ett bredt.
const FEEDS = [
  // Bredt: alle norske treff på Frp/Fremskrittspartiet siste 14 dager
  'https://news.google.com/rss/search?q=(%22Fremskrittspartiet%22+OR+%22FrP%22)+-site:frp.no+when:14d&hl=no&gl=NO&ceid=NO:no',
  // Frp-toppene i offentlig rolle — fanger utspill der partinavnet ikke nevnes eksplisitt
  'https://news.google.com/rss/search?q=(%22Sylvi+Listhaug%22+OR+%22Ketil+Solvik-Olsen%22+OR+%22Hans+Andreas+Limi%22+OR+%22Silje+Hjemdal%22+OR+%22Roy+Steffensen%22+OR+%22Erlend+Wiborg%22+OR+%22Tor+Andr%C3%A9+Johnsen%22+OR+%22Bengt+Rune+Strifeldt%22+OR+%22Morten+Wold%22+OR+%22Christian+Tybring-Gjedde%22)+-site:frp.no+when:14d&hl=no&gl=NO&ceid=NO:no',
  // Finanspolitikk — Frp + alternativt budsjett
  'https://news.google.com/rss/search?q=(%22Frp%22+OR+%22Fremskrittspartiet%22)+(%22alternativt+budsjett%22+OR+%22skattekutt%22+OR+%22formuesskatt%22+OR+%22bompenge%22)+-site:frp.no+when:14d&hl=no&gl=NO&ceid=NO:no',
];

// Kilde-klassifisering. Google Nyheter oppgir "source"-feltet med publikasjonsnavn
// (f.eks. "VG", "Nord24"). Vi matcher mot en liste over nasjonale medier —
// alt annet regnes som lokalt/regionalt (eller "annet" hvis kilden er ukjent).
const NASJONALE_KILDER = new Set([
  'vg', 'nrk', 'aftenposten', 'dagbladet', 'tv 2', 'tv2',
  'nettavisen', 'dagsavisen', 'klassekampen', 'nationen',
  'vårt land', 'vart land', 'morgenbladet', 'dn', 'dagens næringsliv',
  'dagens naringsliv', 'e24', 'finansavisen', 'aldrimer.no',
  'faktisk.no', 'faktisk', 'khrono', 'forskning.no', 'abc nyheter',
  'abcnyheter', 'resett', 'document', 'document.no', 'filter nyheter',
  'filternyheter', 'medier24', 'journalisten', 'kommunal rapport',
]);

// Domene-basert fallback for kilde-klassifisering. Brukes hvis Google Nyheter
// ikke oppgir <source>, eller hvis source-navnet ikke er kjent.
const NASJONALE_DOMENER = new Set([
  'vg.no', 'nrk.no', 'aftenposten.no', 'dagbladet.no', 'tv2.no',
  'nettavisen.no', 'dagsavisen.no', 'klassekampen.no', 'nationen.no',
  'vl.no', 'morgenbladet.no', 'dn.no', 'e24.no', 'finansavisen.no',
  'aldrimer.no', 'faktisk.no', 'khrono.no', 'forskning.no',
  'abcnyheter.no', 'resett.no', 'document.no', 'filternyheter.no',
  'medier24.no', 'journalisten.no', 'kommunal-rapport.no',
]);

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function klassifiserOmraade(kildeNavn, link) {
  const k = (kildeNavn || '').toLowerCase().trim();
  if (k && NASJONALE_KILDER.has(k)) return 'nasjonalt';
  const d = domainOf(link);
  if (d && NASJONALE_DOMENER.has(d)) return 'nasjonalt';
  // Alt annet — typisk lokalaviser (Amedia, Polaris, Schibsted-lokalt)
  // — regnes som lokalt/regionalt.
  if (d || k) return 'lokalt';
  return 'annet';
}

// Tema-klassifisering — samme ordbok som news.js/motoffensiv.js, kondensert
// til de kategoriene brukeren har på nettsiden.
const TEMA_KEYWORDS = {
  skatt: [
    'skatt', 'formuesskatt', 'skattekutt', 'skattelette', 'arveavgift',
    'moms', 'avgift', 'grunnrente', 'bilavgift', 'engangsavgift',
    'eiendomsskatt', 'inntektsskatt', 'selskapsskatt', 'utbytteskatt',
    'skattereform', 'skattetrykk', 'skattelegging',
  ],
  velferd: [
    'velferd', 'helse', 'sykehus', 'eldre', 'eldreomsorg', 'pensjon',
    'trygd', 'nav', 'privatiser', 'fritt behandlingsvalg',
    'egenandel', 'sykehjem', 'barnehage', 'skole', 'utdanning',
    'barnetrygd', 'kontantstøtte', 'fastlege', 'psykiatri',
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
    'strømpris', 'strømstøtte', 'energi', 'norgespris',
  ],
  innvandring: [
    'innvandring', 'asyl', 'flyktning', 'ukrainer', 'integrer',
    'utlending', 'udi', 'grens', 'schengen', 'retur', 'utvisning',
    'kvoteflyktning', 'islamsk', 'muslim', 'assimilering', 'hijab',
  ],
  justis: [
    'kriminal', 'straff', 'politi', 'gjeng', 'narkotika', 'vold',
    'voldtekt', 'overgrep', 'fengsel', 'soning', 'terror',
    'strengere straff', 'strafferabatt', 'nabolagspoliti',
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
    'ferge', 'fartsgrense', 'kollektiv', 'flyplass',
  ],
  utenriks: [
    'utenriks', 'nato', 'eu ', 'eøs', 'israel', 'ukraine', 'russland',
    'palestina', 'gaza', 'bistand', 'forsvar', 'fn ', 'nato-toppmøte',
  ],
  budsjett: [
    'alternativt statsbudsjett', 'alt.budsjett', 'oljepengebruk',
    'handlingsregel', 'statsbudsjett', 'saldert', 'oljefond',
    'finanspolitikk',
  ],
};

function klassifiserTema(tittel, sammendrag) {
  const t = ((tittel || '') + ' ' + (sammendrag || '')).toLowerCase();
  const treff = [];
  for (const [tema, ord] of Object.entries(TEMA_KEYWORDS)) {
    if (ord.some((k) => t.includes(k))) treff.push(tema);
  }
  return treff;
}

// Rens tittel — Google Nyheter legger ofte kilde-suffix på titlene.
function renseTittel(raw, kilde) {
  let t = raw
    .replace(/\s*[-–—]\s*Fremskrittspartiet\s*[-–—]?\s*FrP\.?\s*$/i, '')
    .replace(/\s*[-–—]\s*Frp\s*$/i, '')
    .replace(/\s*[-–—]\s*(NRK|VG|Dagbladet|Aftenposten|TV\s?2|Nettavisen|Dagsavisen|Klassekampen|Nationen|Vårt Land|Khrono|E24|Finansavisen|ABC Nyheter|Filter Nyheter|Nettavisen)\s*$/i, '')
    .replace(/\s*-\s*[a-zæøå]+\.no\s*$/i, '')
    .trim();
  // Hvis kilden er kjent og henger igjen som suffix, fjern den
  if (kilde) {
    const re = new RegExp(`\\s*[-–—]\\s*${kilde.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*$`, 'i');
    t = t.replace(re, '').trim();
  }
  return t;
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const omraade = (url.searchParams.get('omraade') || 'alle').toLowerCase().trim();
    const filterTema = (url.searchParams.get('tema') || '').toLowerCase().trim();
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit') || '40', 10) || 40, 1),
      60,
    );

    const headers = {
      'User-Agent': UA,
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.5',
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,en;q=0.7',
    };

    // Parallelle henter — aggressive timeouts for å holde oss innenfor
    // Vercel Hobby-plan 10s-grensen.
    const responses = await Promise.allSettled(
      FEEDS.map((u) =>
        fetch(u, { headers, signal: AbortSignal.timeout(5000) }).then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        }),
      ),
    );

    // Slå sammen og deduplikaterer
    const seenTitle = new Set();
    const seenLink = new Set();
    let items = [];
    for (const r of responses) {
      if (r.status !== 'fulfilled') continue;
      for (const it of parseRssItems(r.value)) {
        const tittel = renseTittel(it.title, it.source);
        const titleKey = tittel.toLowerCase().trim();
        if (!tittel || seenTitle.has(titleKey) || seenLink.has(it.link)) continue;
        seenTitle.add(titleKey);
        seenLink.add(it.link);

        const temaer = klassifiserTema(tittel, it.summary);
        // Vi tar med saker uten tema-match også — for "alle saker"-visning.
        // Klientside kan filtrere ut de uten tema hvis brukeren velger tema-filter.
        items.push({
          tittel,
          link: it.link,
          kilde: it.source || 'Ukjent kilde',
          kildeType: klassifiserOmraade(it.source, it.link),
          pubDate: it.pubDate,
          sammendrag: (it.summary || '').slice(0, 300),
          temaer,
        });
      }
    }

    // 14-dagers cutoff — samme som motoffensiv
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    items = items.filter((it) => {
      const ts = new Date(it.pubDate).getTime();
      return ts && ts >= cutoff;
    });

    // Filter: område
    if (omraade === 'nasjonalt' || omraade === 'lokalt') {
      items = items.filter((it) => it.kildeType === omraade);
    }

    // Filter: tema
    if (filterTema && TEMA_KEYWORDS[filterTema]) {
      items = items.filter((it) => it.temaer.includes(filterTema));
    }

    // Sorter nyeste først
    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    items = items.slice(0, limit);

    // Dekod Google Nyheter-lenker til ekte kildeadresse. Hard 2s cap per lenke,
    // slik at vi ikke sprenger totaltiden. Feiler dekodingen beholder vi Google-lenken.
    items = await Promise.all(
      items.map(async (it) => {
        if (it.link && it.link.includes('news.google.com')) {
          const decoded = await Promise.race([
            decodeGoogleNewsUrl(it.link).catch(() => it.link),
            new Promise((resolve) => setTimeout(() => resolve(it.link), 2000)),
          ]);
          it.link = decoded || it.link;
          // Etter dekoding — oppdater kildeType basert på ekte domene
          it.kildeType = klassifiserOmraade(it.kilde, it.link);
        }
        return it;
      }),
    );

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=900, stale-while-revalidate=300',
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({
      items,
      omraade: omraade || 'alle',
      tema: filterTema || null,
      fetchedAt: new Date().toISOString(),
      count: items.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'fetch_failed',
      message: err.message || String(err),
    });
  }
}
