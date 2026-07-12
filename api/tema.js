// /api/tema?slug=<tema>
// Offentlig endepunkt som samler for ett tema:
//   1. Frp-utspill i media (Google News-feeds filtrert på Frp + klassifisert på tema)
//   2. Frp-spørsmål på Stortinget (via /lib/stortinget.js)
//   3. Frps programpunkter på temaet (via /lib/frp-program-esm.js)
//
// I motsetning til /api/motoffensiv har dette ingen auth-token og ingen
// redaksjonelle "motvinklinger" — bare rådata som gir kontekst på temasidene.
// Cache: 10 min, offentlig.

import { decodeGoogleNewsUrl, parseRssItems } from '../lib/gnews.js';
import { FRP_PROGRAM } from '../lib/frp-program-esm.js';
import { hentFrpSporsmal } from '../lib/stortinget.js';

const UA =
  'Mozilla/5.0 (compatible; UsminketBot/1.0; +https://usminket.vercel.app)';

const FRP_FEEDS = [
  'https://news.google.com/rss/search?q=site:frp.no+when:14d&hl=no&gl=NO&ceid=NO:no',
  'https://news.google.com/rss/search?q=(Listhaug+OR+%22Sylvi+Listhaug%22+OR+%22Ketil+Solvik-Olsen%22+OR+%22Roy+Steffensen%22+OR+%22Hans+Andreas+Limi%22)+when:7d&hl=no&gl=NO&ceid=NO:no',
  'https://news.google.com/rss/search?q=(%22Fremskrittspartiet%22+OR+%22FrP%22)+when:7d&hl=no&gl=NO&ceid=NO:no',
];

// Klassifiseringsordbok. Hvert tema har:
//   ord   : nøkkelord som gir poeng (vekt 1). Fraser med étt mellomrom teller.
//   sterk : nøkkelord med høyere vekt (3) — svært tema-typiske ord.
//   svak  : ord som teller lavere (0.5) — tvetydige eller ofte overlappende.
// En sak tilskrives temaet med høyest score, forutsatt at minst étt treff.
// Duplisert bevisst mot motoffensiv.js for isolasjon.
const TEMA_KEYWORDS = {
  skatt: {
    sterk: [
      'skatt', 'formuesskatt', 'skattekutt', 'skattelette', 'skattereform',
      'skattetrykk', 'skattelegging', 'skatteregning', 'arveavgift',
      'eiendomsskatt', 'inntektsskatt', 'selskapsskatt', 'utbytteskatt',
      'grunnrente', 'exit-skatt', 'matmoms', 'rente', 'rentenivå',
      'rentekutt', 'renteoppgang', 'renteoppgang', 'rentehøyre',
      'inflasjon', 'prisvekst', 'prispress', 'finanspolitikk',
      'revidert nasjonalbudsjett', 'statsbudsjett', 'oljepengebruk',
      'handlingsregel', 'oljefond', 'finansminister',
    ],
    ord: ['skatte', 'moms', 'avgift'],
  },
  velferd: {
    sterk: [
      'sykehus', 'eldreomsorg', 'sykehjem', 'fastlege', 'barnehage',
      'barnetrygd', 'kontantstøtte', 'fritt behandlingsvalg', 'egenandel',
      'pensjon', 'trygd', 'uføre', 'nav',
    ],
    ord: [
      'velferd', 'helse', 'eldre', 'skole', 'utdanning', 'privatiser',
      'kommersialiser',
    ],
  },
  arbeidsliv: {
    sterk: [
      'arbeidsmiljølov', 'innleie', 'bemanning', 'tariff', 'fagforening',
      'streik', 'a-krim', 'sosial dumping', 'midlertidig ansett',
      'fast ansett', 'trepart', 'lønnsvekst', 'lo ',
    ],
    ord: ['arbeidsliv', 'lønn'],
  },
  klima: {
    sterk: [
      'klima', 'klimatiltak', 'klimaavgift', 'utslipp', 'co2', 'co₂',
      'grønn omstilling', 'fornybar', 'havvind', 'vindkraft', 'solkraft',
      'karbonfangst', 'karbonlås', 'klimamål', 'parisavtalen', 'nullutslipp',
    ],
    ord: ['petroleum', 'elbil', 'bensinbil', 'dieselbil'],
    svak: ['olje', 'gass', 'energi', 'strømpris', 'strømstøtte'],
  },
  innvandring: {
    sterk: [
      'innvandring', 'asyl', 'flyktning', 'kvoteflyktning', 'integrer',
      'integrering', 'udi', 'utlendingsdirektoratet', 'schengen',
      'kvoteflyktning', 'utvisning', 'assimilering', 'islamsk', 'muslim',
      'ukrainer', 'bosettingsstopp', 'sekundærbosetting', 'asylmottak',
      'bosetting', 'flukt', 'fluktbakgrunn',
      'oppholder seg ulovlig', 'papirløs', 'ureturnerbar',
      'utenlandsk statsborger', 'utenlandske statsborgere',
    ],
    ord: ['utlending', 'retur', 'grens'],
  },
  justis: {
    sterk: [
      'kriminal', 'straff', 'politi', 'politidistrikt', 'gjeng',
      'narkotika', 'voldtekt', 'overgrep', 'fengsel', 'soning',
      'strengere straff', 'strafferabatt', 'nabolagspoliti', 'terror',
      'beredskap',
    ],
    ord: ['vold'],
  },
  utenriks: {
    sterk: [
      // Utenriks / diplomati / fred
      'utenrikspolitikk', 'utenriksdepartementet', 'utenriksminister',
      'diplomati', 'diplomat',
      'fredsarbeid', 'fredsforhandling', 'fredsforhandlinger',
      'fredsprosess', 'fredsavtale', 'våpenhvile', 'meklings',
      'bistand', 'bistandspolitikk', 'utviklingsbistand', 'norad',
      // Internasjonale institusjoner
      'nato', 'fns sikkerhetsråd', 'sikkerhetsrådet', 'unicef', 'unhcr',
      'menneskerettigheter', 'menneskerettighetene',
      // Konflikt / sanksjoner / våpenstøtte
      'sanksjoner', 'våpenhjelp', 'våpenstøtte', 'våpeneksport',
      'gaza', 'palestina', 'israel',
      // Forsvar (samlet med utenriks per brukerens ønske)
      'forsvar', 'forsvarsminister', 'forsvarssjef', 'militær',
      'militære', 'vernepliktige', 'vernepliktig', 'forsvarsevne',
      'forsvarsbudsjett', 'forsvarsløftet', 'långtidsplanen',
      'langtidsplanen', 'nato-toppmøte', 'artikkel 5',
    ],
    ord: ['ambassade', 'konsulat', 'suverenitet', 'sanksjon'],
    // Svake ord: nevnes ofte som bakgrunn i innenrikssaker om økonomi
    svak: ['ukraina', 'russland', 'iran', 'kina', 'krig'],
  },
  distrikt: {
    sterk: [
      'distrikt', 'landsbygd', 'landbruk', 'bonde', 'havbruk', 'reindrift',
      'kommuneøkonomi', 'nord-norge',
    ],
    ord: ['fylke', 'næringsliv'],
    svak: ['kommune', 'fiske', 'ferge'],
  },
  samferdsel: {
    sterk: [
      'samferdsel', 'motorvei', 'firefelts', 'jernbane', 'bompeng', 'bomring',
      'nye veier', 'statens vegvesen', 'transportplan', 'ntp', 'fartsgrense',
      'kollektiv',
    ],
    ord: ['tog', 'ferge', 'bilavgift'],
  },
  budsjett: {
    sterk: [
      'alternativt statsbudsjett', 'alt.budsjett', 'oljepengebruk',
      'handlingsregel', 'saldert', 'oljefond',
    ],
    ord: ['statsbudsjett', 'finanspolitikk'],
  },
};

// Teller antall forekomster av en term (substrengsøk) i teksten.
function tellTreff(tekst, term) {
  if (!term) return 0;
  let n = 0;
  let i = 0;
  while ((i = tekst.indexOf(term, i)) !== -1) {
    n++;
    i += term.length;
  }
  return n;
}

// Regner score for et tema mot tekst-strengen.
function scoreTema(tekst, tema) {
  const def = TEMA_KEYWORDS[tema];
  if (!def) return 0;
  let s = 0;
  for (const k of def.sterk || []) s += tellTreff(tekst, k) * 3;
  for (const k of def.ord || []) s += tellTreff(tekst, k) * 1;
  for (const k of def.svak || []) s += tellTreff(tekst, k) * 0.5;
  return s;
}

// Statsråd-tittel → tema. Bruker enkel substrengsøk på småbokstaver av
// "til_minister"-feltet. Første treff vinner (rekkefølge betyr noe: mest
// spesifikke titler først). Statsministeren og utenriksministeren har intet
// eget tema — da faller vi tilbake til tekst-scoring.
const MINISTER_TIL_TEMA = [
  ['finansminister', 'skatt'],
  ['næringsminister', 'skatt'], // næringspolitikk knyttet til skatt/rammer
  ['helse- og omsorgsminister', 'velferd'],
  ['helseminister', 'velferd'],
  ['omsorgsminister', 'velferd'],
  ['arbeids- og inkluderingsminister', 'arbeidsliv'],
  ['arbeidsminister', 'arbeidsliv'],
  ['kunnskapsminister', 'velferd'],
  ['forsknings- og høyere utdanningsminister', 'velferd'],
  ['barne- og familieminister', 'velferd'],
  ['klima- og miljøminister', 'klima'],
  ['klimaminister', 'klima'],
  ['miljøminister', 'klima'],
  ['energiminister', 'klima'],
  ['olje- og energiminister', 'klima'],
  ['justis- og beredskapsminister', 'justis'],
  ['justisminister', 'justis'],
  ['utenriksminister', 'utenriks'],
  ['bistandsminister', 'utenriks'],
  ['utviklingsminister', 'utenriks'],
  ['forsvarsminister', 'utenriks'],
  ['landbruks- og matminister', 'distrikt'],
  ['landbruksminister', 'distrikt'],
  ['fiskeri- og havminister', 'distrikt'],
  ['fiskeriminister', 'distrikt'],
  ['kommunal- og distriktsminister', 'distrikt'],
  ['distriktsminister', 'distrikt'],
  ['kommunalminister', 'distrikt'],
  ['samferdselsminister', 'samferdsel'],
];

function temaFraMinister(tilMinister) {
  if (!tilMinister) return null;
  const t = String(tilMinister).toLowerCase();
  for (const [nokkel, tema] of MINISTER_TIL_TEMA) {
    if (t.includes(nokkel)) return tema;
  }
  return null;
}

// Klassifiserer en sak til det temaet som scorer høyest. Returnerer null hvis
// ingen tema har treff. Bruker minister som primærsignal når tilgjengelig.
function klassifiserTema(title, summary, tilMinister) {
  const t = ((title || '') + ' ' + (summary || '')).toLowerCase();

  // Score alle tema én gang
  const scores = {};
  for (const tema of Object.keys(TEMA_KEYWORDS)) {
    scores[tema] = scoreTema(t, tema);
  }

  // Hvis minister er kjent, gi det temaet et moderat bonuspoeng (5) slik at
  //  - saker uten tekst-treff faller på riktig tema via ministeren
  //  - saker med ett svakt "feil" ord ikke havner på feil tema
  //  - men sterke tekst-signaler (≥6 poeng, dvs 2+ sterke ord) i annet tema
  //    kan fortsatt overstyre. Dette håndterer at arbeids- og inkluderings-
  //    ministeren dekker både arbeidsliv og innvandring — tekst avgjør hvilket.
  const ministerTema = temaFraMinister(tilMinister);
  if (ministerTema && TEMA_KEYWORDS[ministerTema]) {
    scores[ministerTema] = (scores[ministerTema] || 0) + 5;
  }

  let bestTema = null;
  let bestScore = 0;
  for (const tema of Object.keys(scores)) {
    if (scores[tema] > bestScore) {
      bestScore = scores[tema];
      bestTema = tema;
    }
  }

  if (bestScore === 0) return null;
  // Kun minister-boost uten tekst-treff (score = 5) godtas som svar
  if (bestScore === 5 && ministerTema) return ministerTema;
  return bestTema;
}

// True hvis saken hører til dette temaet som primærklassifisering.
function matcherTema(title, summary, tema, tilMinister) {
  return klassifiserTema(title, summary, tilMinister) === tema;
}

function renseTittel(raw) {
  return (raw || '')
    .replace(/\s+-\s+[^-]+$/, '') // fjerner "- avisnavn" på slutten
    .trim();
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const slug = (url.searchParams.get('slug') || '').toLowerCase().trim();
    const limitNyheter = Math.min(
      Math.max(parseInt(url.searchParams.get('limit_nyheter') || '4', 10), 1),
      10,
    );
    const limitStortinget = Math.min(
      Math.max(parseInt(url.searchParams.get('limit_stortinget') || '3', 10), 1),
      10,
    );

    if (!slug || !TEMA_KEYWORDS[slug]) {
      return res.status(400).json({
        error: 'invalid_slug',
        message: 'Kjente slugs: ' + Object.keys(TEMA_KEYWORDS).join(', '),
      });
    }

    // Frp-program på temaet — synkront fra data-modulen
    const programBlokk = FRP_PROGRAM[slug] || null;

    // Hent Frp-feeds og Stortinget parallelt
    const headers = {
      'User-Agent': UA,
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.5',
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,en;q=0.7',
    };

    const stortingetPromise = Promise.race([
      hentFrpSporsmal(),
      new Promise((resolve) => setTimeout(() => resolve({ items: [] }), 6000)),
    ]).catch((e) => {
      console.error('Stortinget-fetch feilet:', e.message);
      return { items: [] };
    });

    const [feedResponses, stortingetResult] = await Promise.all([
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

    // Slå sammen items fra alle feeds
    const alleItems = [];
    const seen = new Set();
    for (const r of feedResponses) {
      if (r.status !== 'fulfilled') continue;
      const items = parseRssItems(r.value);
      for (const it of items) {
        const rawLink = it.link || '';
        const key = rawLink.split('?')[0];
        if (seen.has(key)) continue;
        seen.add(key);
        const title = renseTittel(it.title);
        // Filtrer på tema — bare det som matcher slug'en
        if (!matcherTema(title, it.summary, slug, null)) continue;
        alleItems.push({
          title,
          summary: (it.summary || '').slice(0, 240),
          link: rawLink,
          pubDate: it.pubDate,
          source: it.source || '',
        });
      }
    }

    // Sorter nyeste først
    alleItems.sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    });

    // Google News-linker må dekodes — men vi tidsbokser oppgaven aggressivt.
    // Om dekoding feiler, faller vi tilbake til den udekodede lenken.
    const topNyheter = alleItems.slice(0, limitNyheter);
    await Promise.all(
      topNyheter.map(async (it) => {
        if (!it.link || !it.link.includes('news.google.com')) return;
        try {
          const decoded = await Promise.race([
            decodeGoogleNewsUrl(it.link),
            new Promise((resolve) => setTimeout(() => resolve(null), 2000)),
          ]);
          if (decoded) it.link = decoded;
        } catch (_) { /* keep original */ }
      }),
    );

    // Stortinget: filter på tema. Bruk kilde_url/fra/til_minister/datert
    // fra stortinget.js sin normalisering; map til enklere feltnavn for frontend.
    // Status-koden fra stortinget-API-et er et heltall; oversett til tekst.
    const statusMap = { 1: 'Besvart', 2: 'Trukket', 3: 'Bortfalt', 4: 'Til behandling' };
    // Prioriter muntlige spørsmål og interpellasjoner — de har videoopptak
    // fra plenum og gir mer visuell verdi enn skriftlige spørsmål.
    const prioRank = (type) => {
      const t = String(type || '').toLowerCase();
      if (t === 'interpellasjon') return 0;
      if (t === 'muntlig') return 1;
      return 2; // skriftlig, alt annet
    };
    const stortingetItems = ((stortingetResult && stortingetResult.items) || [])
      .filter((s) => matcherTema(s.tittel, '', slug, s.til_minister))
      .sort((a, b) => {
        const pr = prioRank(a.type) - prioRank(b.type);
        if (pr !== 0) return pr;
        // Innenfor samme kategori: nyeste først
        const aTid = a.datert ? new Date(a.datert).getTime() : 0;
        const bTid = b.datert ? new Date(b.datert).getTime() : 0;
        return bTid - aTid;
      })
      .slice(0, limitStortinget)
      .map((s) => ({
        id: s.id,
        tittel: s.tittel,
        datoMottatt: s.datert,
        type: s.type,
        stiltTil: s.til_minister,
        stiller: s.fra,
        parti: s.parti,
        status: statusMap[Number(s.status)] || '',
        link: s.kilde_url,
      }));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Offentlig cache 10 min, edge også
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res.status(200).json({
      slug,
      program: programBlokk,
      nyheter: topNyheter,
      nyheterTotal: alleItems.length,
      stortinget: stortingetItems,
      stortingetSesjon: stortingetResult && stortingetResult.sesjonId,
      generertKl: new Date().toISOString(),
    });
  } catch (e) {
    console.error('tema-api feilet:', e);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(500).json({ error: 'server_error', message: String(e.message || e) });
  }
}
