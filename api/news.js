// Vercel Serverless Function: /api/news
// Henter siste saker fra regjeringen.no via Google News RSS (som er åpen).
// Cacher 10 minutter i CDN så vi ikke hamrer eksterne kilder.
//
// Query: ?tema=skatt|velferd|arbeidsliv|klima|innvandring|justis|distrikt|samferdsel|budsjett
// Retur: { items: [{ title, link, pubDate, source, temaer:[..] }], fetchedAt, tema, count }

// Hovedfeed: alle regjeringen.no-saker via Google Nyheter, sortert etter dato
// (when:365d begrenser til siste 12 måneder — kutter evergreen-sider og NOU-er
// eldre enn ett år som ellers dominerer feed-resultatene).
const FEED_MAIN =
  'https://news.google.com/rss/search?q=site:regjeringen.no+when:365d&hl=no&gl=NO&ceid=NO:no';

// Tema-spesifikke feeder — supplerer hovedfeeden slik at typisk underrepresenterte
// tema får nok saker per side. Alle bruker when:365d for å filtrere ut gamle sider.
// Vi kjører dem parallelt og deduplikaterer på lenke og tittel.
const FEED_TOPIC = {
  skatt:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(skatt+OR+formuesskatt+OR+skatteutvalg+OR+torvik+OR+avgift+OR+moms+OR+finansdepartement)+when:365d&hl=no&gl=NO&ceid=NO:no',
  velferd:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(helse+OR+sykehus+OR+eldreomsorg+OR+barnehage+OR+utdanning+OR+NAV+OR+pensjon+OR+trygd+OR+velferd)+when:365d&hl=no&gl=NO&ceid=NO:no',
  arbeidsliv:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(arbeidsliv+OR+arbeidsmiljø+OR+tariff+OR+innleie+OR+a-krim+OR+fagforening+OR+trepart)+when:365d&hl=no&gl=NO&ceid=NO:no',
  klima:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(klima+OR+utslipp+OR+miljø+OR+energi+OR+strøm+OR+havvind+OR+fornybar+OR+klimaomstilling+OR+klimadepartement)+when:365d&hl=no&gl=NO&ceid=NO:no',
  innvandring:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(innvandring+OR+asyl+OR+integrering+OR+UDI+OR+flyktning)+when:365d&hl=no&gl=NO&ceid=NO:no',
  justis:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(politi+OR+kriminalitet+OR+straff+OR+domstol+OR+fengsel+OR+påtale+OR+justisdepartement+OR+beredskap+OR+kriminalomsorg+OR+voldsalarm)+when:365d&hl=no&gl=NO&ceid=NO:no',
  distrikt:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(distrikt+OR+kommune+OR+landbruk+OR+jordbruk+OR+fiske+OR+havbruk+OR+Nord-Norge+OR+kommuneøkonomi)+when:365d&hl=no&gl=NO&ceid=NO:no',
  samferdsel:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(samferdsel+OR+jernbane+OR+veg+OR+vei+OR+NTP+OR+kollektiv+OR+ferge+OR+luftfart+OR+bompeng+OR+samferdselsdepartement)+when:365d&hl=no&gl=NO&ceid=NO:no',
  budsjett:
    'https://news.google.com/rss/search?q=site:regjeringen.no+(statsbudsjett+OR+nasjonalbudsjett+OR+«Prop+1+S»+OR+finansdepartement)+when:365d&hl=no&gl=NO&ceid=NO:no',
};

// Tema-klassifisering med norske nøkkelord. Én sak kan matche flere tema.
// Nøkkelordene er valgt bredt og skal fange typiske regjeringsformuleringer.
const TEMA_KEYWORDS = {
  skatt: [
    // Skattearter og satser
    'skatt', 'skatte', 'avgift', 'moms', 'merverdiavgift', 'toll',
    'formuesskatt', 'formuesbeskatning', 'inntektsskatt', 'personskatt',
    'selskapsskatt', 'utbytteskatt', 'aksjonærmodell', 'grunnrente',
    'grunnrenteskatt', 'arveavgift', 'gaveavgift', 'boligbeskatning',
    'eiendomsskatt', 'trygdeavgift', 'trinnskatt', 'topskatt', 'skattefradrag',
    'personfradrag', 'minstefradrag', 'reisefradrag', 'foreldrefradrag',
    'boligsparing', 'bsu', 'skattelette', 'skattekutt',
    // Institusjoner og prosesser
    'skatteetaten', 'skattedirektorat', 'skatteklagenemnd', 'proveny',
    'skatteutvalg', 'torvik', 'nou 2022: 20', 'nou 2022:20', 'skattereform',
    'finansdepartement', 'finansminister', 'skattemeld',
    // Særavgifter og næringsskatt
    'særavgift', 'sukkeravgift', 'co2-avgift', 'co₂-avgift', 'veibruksavgift',
    'lakseskatt', 'havbruksskatt', 'petroleumsskatt',
  ],
  velferd: [
    'trygd', 'pensjon', 'alderspensjon', 'nav', 'sykehjem', 'eldre',
    'helse', 'sykehus', 'helsepersonell', 'helsetjeneste',
    'fastlege', 'omsorg', 'psykisk', 'psykiatri', 'rus',
    'barnehage', 'skole', 'sfo', 'ffo', 'utdanning', 'student',
    'lærling', 'lærlingordning', 'folketrygd', 'uføre', 'uførhet',
    'barnetrygd', 'kontantstøtte', 'ntnu', 'universitet', 'høgskol',
    'lærer', 'lærerutdanning', 'opplæring', 'friskol', 'privatskol',
    'aap', 'sykepenger', 'foreldrepenger', 'kvalifiseringsprogram',
    'demens', 'rehabiliter', 'trygdeoppgjør', 'minstepensjon',
    'bostøtte', 'sosialhjelp', 'barnevern',
  ],
  arbeidsliv: [
    'arbeidsliv', 'arbeidsmarked', 'arbeidsplass', 'lønn', 'lønns',
    'sysselset', 'arbeidsmiljø', 'arbeidsmiljølov', 'lo ', 'ys ', 'unio',
    'fagforening', 'ansatt', 'ansettelse', 'tariff', 'hovedavtal',
    'tariffavtal', 'ledighet', 'arbeidsledig', 'arbeidstilsyn', 'streik',
    'yrkesskade', 'permittert', 'permittering', 'ihm', 'arbeidsgiver',
    'a-krim', 'akrim', 'sosial dumping', 'bemanningsbyrå', 'innleie',
    'trepart', 'partene i arbeidslivet',
  ],
  klima: [
    'klima', 'utslipp', 'co2', 'co₂', 'grønn', 'enova', 'fornybar',
    'vindkraft', 'solkraft', 'vannkraft', 'havvind', 'karbon',
    'karbonfangst', 'ccs', 'olje', 'gass', 'petroleum', 'natur',
    'miljø', 'artsmangfold', 'transportmål', 'elbil', 'nullutslipp',
    'energi', 'strøm', 'strømstøtte', 'strømpris', 'kraft', 'kraftmarked',
    'landsverne', 'plast', 'bærekraft', 'sirkulær', 'klimarisiko',
    'norgespris', 'fastpris',
  ],
  innvandring: [
    'innvandr', 'asyl', 'flyktning', 'ukraine', 'integrering', 'udi',
    'utlend', 'statsborg', 'oppholdstillat', 'schengen', 'grens',
    'ankomst', 'mottak', 'kvoteflyktning', 'retur', 'utvisning',
    'familieinnvandring', 'introduksjonsprogram',
  ],
  justis: [
    // Politi og påtale
    'politi', 'politireform', 'politidistrikt', 'politimester', 'nabolagspoliti',
    'påtale', 'påtalemyndighet', 'riksadvokat', 'statsadvokat',
    'kripos', 'økokrim', 'pst', 'nødetat', 'lensmann', 'politihøgskol',
    // Kriminalitet og straff
    'kriminal', 'kriminalitet', 'straff', 'straffelov', 'straffeprosess',
    'strafferamme', 'straffegjennomføring', 'strafferabatt', 'forvaring',
    'gjeng', 'gjengkriminal', 'ungdomskriminal', 'vinning', 'ran',
    'narkotika', 'ruspolitikk', 'menneskehandel', 'organisert kriminalitet',
    'terror', 'radikalisering', 'ekstremisme', 'hatkriminal',
    // Vold og overgrep
    'vold', 'voldtekt', 'partnervold', 'vold i nære relasjoner',
    'kjønnsvold', 'overgrep', 'seksuelle overgrep', 'voldsalarm',
    'omvendt voldsalarm', 'krisesenter', 'besøksforbud',
    // Domstol og rettspleie
    'domstol', 'tingrett', 'lagmannsrett', 'høyesterett', 'jury',
    'rettssak', 'rettergang', 'meddommer', 'juryordning',
    'rettshjelp', 'fri rettshjelp', 'namsm', 'namsfogd', 'forliksråd',
    // Kriminalomsorg og fengsel
    'fengsel', 'kriminalomsorg', 'soning', 'løslat', 'prøveløslat',
    'tilbakeføring', 'residiv', 'tilbakefall',
    // Beredskap
    'beredskap', 'sivilforsvar', 'krise', 'katastrofe', 'dsb',
    'totalforsvar', 'sikkerhetslov', 'gjenoppbygging',
    // Institusjoner
    'justisdepartement', 'justisminister',
  ],
  distrikt: [
    'distrikt', 'kommune', 'fylke', 'lokal', 'bygd', 'landbruk',
    'jordbruk', 'jordbruksoppgjør', 'bonde', 'fiske', 'havbruk',
    'kyst', 'reindrift', 'sami', 'samisk', 'nord-norge', 'finnmark',
    'troms', 'nordland', 'inntektsutjevn', 'ferge', 'kommuneøkonom',
    'kommunekommisjon', 'lofoten', 'vesterålen', 'kommunereform',
    'tiltakssone', 'innsatssone', 'trafikklys', 'oppdrett',
  ],
  // Samferdsel: bare tydelige samferdsels-ord. Ord som «vei» og «kollektiv» er
  // for flertydige alene («feil vei» / «kollektiv beskyttelse»), så vi krever
  // tydelig transport-kontekst.
  samferdsel: [
    // Veg (sammensatte former som er entydige)
    'samferdsel', 'motorvei', 'motorveg', 'riksvei', 'riksveg',
    'fylkesvei', 'fylkesveg', 'europavei', 'europaveg',
    'statens vegvesen', 'nye veier', 'vegvesen', 'vegnett', 'veinett',
    'rassikring', 'ras-sikring', 'skredsikring', 'vegtunnel', 'veitunnel',
    // Bane og tog
    'jernbane', 'togtilbud', 'togruter', 'bane nor', 'jernbanedirektorat',
    'jernbanetilsyn', 'ringeriksbane', 'intercity', 'nattog',
    'ofotbane', 'gøteborgsbanen', 'råumabanen', 'flytog',
    // Kollektiv og buss
    'kollektivtransport', 'kollektivtilbud', 'kollektivfelt',
    'kollektivsatsing', 'buss', 't-bane', 'trikk', 'ruter as', 'entur',
    // Sjø og ferge
    'fergesamband', 'ferjesamband', 'hurtigbåt', 'hurtigrute',
    'kystverket', 'sjøfart', 'sjøsikker',
    // Luft
    'luftfart', 'flyplass', 'avinor', 'flyrute', 'kortbaneflyplass',
    'flynavigasj',
    // Betaling og finansiering
    'bompeng', 'bomring', 'bomstasjon', 'trafikantbetal',
    'rushtidsavgift', 'engangsavgift på bil', 'omregistreringsavgift',
    // Planer og myke trafikanter
    'nasjonal transportplan', 'nullvisjon', 'trafikksikker',
    'trafikksikkerhet', 'sykkelvei', 'sykkelveg', 'gang- og sykkel',
    // Institusjoner
    'samferdselsdepartement', 'samferdselsminister', 'vegdirektorat',
    'statens havarikommisjon', 'jernbaneverket',
    // Enkeltord (matches via STRICT_WORDS — kun hele ord)
    'vei', 'veg', 'tog', 'ferge', 'ferje', 'bom',
  ],
  budsjett: [
    'statsbudsjett', 'budsjett', 'prop. 1 s', 'prop 1 s', 'nasjonalbudsjett',
    'revidert', 'saldert', 'oljepenge', 'handlingsregel',
    'stortingsmelding om økonomi', 'finanskomit',
  ],
};

// Nøkkelord som må matches på hele ord (regex \b), ellers gir de for mange
// falske treff. «vei» i «feil vei» / «på vei», «tog» i «tokt», «gange» i
// «forlangende», «vold» i «voldsom vekst» (om økonomi) osv.
const STRICT_WORDS = new Set([
  'vei', 'veg', 'tog', 'bom', 'gange', 'ran', 'ferge', 'ferje',
  'vold', 'kraft', 'gass', 'olje', 'moms',
]);

// Metafor-fraser der «vei» ikke betyr samferdsel. Om noen av disse forekommer i
// teksten, blokkerer vi vei/veg som samferdselstreff. Denne listen kan utvides.
const VEI_METAFORER = [
  'på vei', 'feil vei', 'riktig vei', 'lang vei', 'vise vei', 'viser vei',
  'går feil vei', 'vei ut', 'vei til', 'vei fram', 'vei framover',
  'baner vei', 'på god vei', 'ny vei framover',
];

function matchKeyword(text, keyword) {
  if (STRICT_WORDS.has(keyword)) {
    // Metafor-sjekk for vei/veg
    if ((keyword === 'vei' || keyword === 'veg') &&
        VEI_METAFORER.some((m) => text.includes(m))) {
      // Fortsatt gyldig hvis andre samferdselsord også finnes
      const harTransport = /\b(jernbane|bane nor|bompeng|kollektivtransport|bane|samferdsel|motorvei|riksvei|statens vegvesen|avinor|luftfart)\b/.test(text);
      if (!harTransport) return false;
    }
    // Kun hele ord — unngår «passerer forbi ranen»-typen falske treff
    const re = new RegExp(`(^|[^a-zæøå])${keyword}([^a-zæøå]|$)`, 'i');
    return re.test(text);
  }
  return text.includes(keyword);
}

// Klassifiser en tittel og valgfritt sammendrag — returner liste med tema-slugs.
// Vi tar med sammendraget fordi mange regjeringen.no-titler er svært generiske
// («Nye rettsakter i EØS-avtalen»), mens brødteksten inneholder tema-signaler.
function klassifiser(title, summary) {
  const t = ((title || '') + ' ' + (summary || '')).toLowerCase();
  const treff = [];
  for (const [tema, ord] of Object.entries(TEMA_KEYWORDS)) {
    if (ord.some((k) => matchKeyword(t, k))) treff.push(tema);
  }
  return treff;
}

// Dekoder Google Nyheters redirect-URL til ekte kildeadresse (f.eks. regjeringen.no).
// Google Nyheter serverer bare en JavaScript-basert redirect i sin RSS, som ikke virker
// i vanlige nettlesere. Vi kaller batchexecute-endepunktet for å hente ut den ekte URL-en.
// Timeout på 4 s per artikkel — feiler dekodningen, faller vi tilbake til Google-lenken.
async function decodeGoogleNewsUrl(googleUrl) {
  try {
    const idMatch = googleUrl.match(/\/articles\/([^?/]+)/);
    if (!idMatch) return googleUrl;
    const articleId = idMatch[1];

    // Steg 1: Hent HTML for signaturer
    const htmlRes = await fetch(googleUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(4000),
    });
    if (!htmlRes.ok) return googleUrl;
    const html = await htmlRes.text();
    const sig = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (!sig || !ts) return googleUrl;

    // Steg 2: Kall batchexecute
    const payload = JSON.stringify([
      [
        [
          'Fbv4je',
          JSON.stringify([
            'garturlreq',
            [
              ['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1],
              'X',
              'X',
              1,
              [1, 1, 1],
              1,
              1,
              null,
              0,
              0,
              null,
              0,
            ],
            articleId,
            ts,
            sig,
          ]),
          null,
          'generic',
        ],
      ],
    ]);

    const body = new URLSearchParams({ 'f.req': payload });
    const rpcRes = await fetch(
      'https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        },
        body,
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!rpcRes.ok) return googleUrl;
    const text = await rpcRes.text();

    // Responsen er JSON-i-JSON med escapede unicode-sekvenser
    const m = text.match(/"(https?:\/\/(?:www\.)?regjeringen\.no[^"\\]+)/) ||
      text.match(/\[\\"garturlres\\",\\"(https?:\/\/[^\\]+)\\"/);
    if (!m) return googleUrl;
    let url = m[1];
    // Rens vekk unicode-escaping (\u003d etc.) og evt. avsluttende backslash
    url = url
      .replace(/\\u003d/g, '=')
      .replace(/\\u0026/g, '&')
      .replace(/\\\\/g, '\\')
      .replace(/\\+$/, '');
    // Fjern query-parametere som ?ch=2 (Google-sporing, ikke nødvendig)
    url = url.replace(/[?&]ch=\d+.*$/, '');
    return url;
  } catch {
    return googleUrl;
  }
}

// Enkel XML-parser for RSS <item>-noder — vi trenger bare title, link, pubDate, source.
function parseItems(xml) {
  const items = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null && items.length < 60) {
    const block = m[1];
    const pick = (tag) => {
      const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`);
      const mm = block.match(re);
      if (!mm) return '';
      let v = mm[1].trim();
      v = v.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
      return v;
    };
    let title = pick('title');
    title = title.replace(/\s*[-–—]\s*Regjeringen\.no\s*$/i, '').trim();

    const link = pick('link');
    const pubDate = pick('pubDate');
    const source = pick('source') || 'Regjeringen.no';
    // Google Nyheter legger sammendrag i <description> som HTML — strip tags
    let summary = pick('description') || '';
    summary = summary.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
                     .replace(/\s+/g, ' ').trim();
    const temaer = klassifiser(title, summary);

    if (title && link) items.push({ title, link, pubDate, source, temaer });
  }
  return items;
}

export default async function handler(req, res) {
  try {
    // Query-parameter for tema-filter
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const tema = (url.searchParams.get('tema') || '').toLowerCase().trim();
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit') || '0', 10) || 0, 0),
      60,
    );

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (compatible; UsminketBot/1.0; +https://usminket.vercel.app)',
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.5',
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,en;q=0.7',
    };

    // Hovedfeeden hentes alltid. Hvis tema er satt og vi har en spesial-feed,
    // henter vi den også parallelt og slår sammen (deduplikering på lenke).
    const feeds = [FEED_MAIN];
    if (tema && FEED_TOPIC[tema]) feeds.push(FEED_TOPIC[tema]);

    const responses = await Promise.allSettled(
      feeds.map((u) =>
        fetch(u, { headers, signal: AbortSignal.timeout(8000) }).then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        }),
      ),
    );

    // Må ha minst hovedfeeden
    if (responses[0].status !== 'fulfilled') {
      return res.status(502).json({
        error: 'upstream',
        message: 'Kunne ikke hente hovedfeed',
      });
    }

    // Slå sammen og dedup på lenke OG tittel. Google Nyheter returnerer noen
    // ganger samme sak med to ulike tracker-lenker, så lenke alene er ikke nok.
    const seenLink = new Set();
    const seenTitle = new Set();
    let items = [];
    for (const r of responses) {
      if (r.status !== 'fulfilled') continue;
      for (const it of parseItems(r.value)) {
        const titleKey = (it.title || '').toLowerCase().trim();
        if (seenLink.has(it.link) || seenTitle.has(titleKey)) continue;
        seenLink.add(it.link);
        if (titleKey) seenTitle.add(titleKey);
        items.push(it);
      }
    }

    // Filtrer bort saker uten dato eller eldre enn 15 måneder — evergreen-sider
    // (departements-forsider, gamle stortingsmeldinger, temasider) er ikke
    // «siste saker» selv om de dukker opp i Google Nyheter.
    const cutoff = Date.now() - 15 * 30 * 24 * 60 * 60 * 1000; // ~15 mnd
    items = items.filter((it) => {
      const ts = new Date(it.pubDate).getTime();
      return ts && ts >= cutoff;
    });

    // Sorter på pubDate (nyeste først)
    items.sort((a, b) => {
      const da = new Date(a.pubDate).getTime() || 0;
      const db = new Date(b.pubDate).getTime() || 0;
      return db - da;
    });

    // Filtrer på tema hvis oppgitt — spesial-feeden er allerede tema-relevant,
    // men klassifikatoren må fortsatt bekrefte match på tema-slug.
    if (tema && TEMA_KEYWORDS[tema]) {
      items = items.filter((it) => it.temaer.includes(tema));
    }

    if (limit > 0) items = items.slice(0, limit);

    // Dekoder Google Nyheter-redirect til ekte regjeringen.no-URL for hvert item.
    // Parallelt og med individuell fallback — hvis en dekodning feiler, beholder vi
    // den originale Google-lenken (bedre enn ingen lenke).
    items = await Promise.all(
      items.map(async (it) => {
        if (!it.link || !it.link.includes('news.google.com')) return it;
        const real = await decodeGoogleNewsUrl(it.link);
        return { ...it, link: real };
      }),
    );

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=60',
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({
      items,
      tema: tema || null,
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
