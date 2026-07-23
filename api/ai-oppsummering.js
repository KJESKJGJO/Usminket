// Vercel Serverless Function: /api/ai-oppsummering
// Genererer korte, kritiske analyser av Frp-utspill via OpenAI-API.
// Kalles fra nyheter.html etter at feeden er lastet — batch av inntil 10 saker
// per kall for å holde responstid nede og kostnadene under kontroll.
//
// Nøkkel: leses fra OPENAI_API_KEY (Vercel env var). Uten nøkkel svarer vi 200
// med tomme oppsummeringer — feeden fortsetter å virke uten AI-tekst.
//
// Request (POST):
//   { saker: [{ id, tittel, kilde, sammendrag, temaer }] }
// Response:
//   { oppsummeringer: { <id>: "2-setnings tekst" }, model, cached, generated }
//
// Cache: hver sak caches i CDN i 24 timer nøklet på id — vi genererer altså
// bare én gang per sak. Selve batch-responsen caches 1 time i CDN.

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_SAKER_PER_KALL = 10;
const TIMEOUT_MS = 8500; // Under Vercel Hobby 10s-grensen

// Hovedprompt — vi vil ha korte, presise, kritiske analyser som knytter Frps
// retorikk opp mot faktiske politiske konsekvenser eller motstridende data.
// Ingen sensasjon, ingen personangrep — bare saksforhold.
const SYSTEM_PROMPT = `Du er redaksjonell analytiker for det norske politiske nettstedet Usminket politikk, som gransker Fremskrittspartiets (Frp) politikk kritisk og saklig.

For hver nyhetssak du får, skriv nøyaktig TO korte setninger på norsk bokmål:
- Setning 1: Hva er Frps posisjon eller retorikk i saken (nøytralt referert).
- Setning 2: Hva sier fakta, forskning, offentlige utredninger (NOU-er) eller Frps eget program om de faktiske konsekvensene — særlig for fordeling, velferd, distrikt eller sårbare grupper.

Regler:
- Vær saklig og etterprøvbar. Ingen slagord, ingen personangrep, ingen sensasjon.
- Hvis saken IKKE handler om Frp-politikk direkte (f.eks. tabloid pressemelding, sport, hendelser uten policyinnhold), skriv én setning som forklarer at saken har lavt policyinnhold — ikke tving fram kritikk.
- Aldri finn opp tall eller sitater. Hvis du ikke har grunnlag, skriv nøkternt.
- Maks 45 ord totalt per sak.
- Ingen markdown, ingen anførselstegn rundt hele svaret, ingen navn på analytikere.

Format svaret som JSON: { "id": "<sakens id>", "analyse": "<to setninger>" } for hver sak, alle samlet i et JSON-array.`;

async function callOpenAI(saker) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY mangler');
    err.code = 'no_key';
    throw err;
  }

  // Bygg brukermelding — kompakt, én linje per sak
  const brukerInnhold =
    'Analyser disse ' + saker.length + ' sakene og returner ett JSON-array med { id, analyse } per sak.\n\n' +
    saker.map((s) => {
      const temaTxt = (s.temaer && s.temaer.length) ? ` [tema: ${s.temaer.join(', ')}]` : '';
      const kildeTxt = s.kilde ? ` (${s.kilde})` : '';
      const ingressTxt = s.sammendrag ? ` — Ingress: ${String(s.sammendrag).slice(0, 300)}` : '';
      return `id=${s.id}${kildeTxt}${temaTxt}: ${s.tittel}${ingressTxt}`;
    }).join('\n\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: brukerInnhold + '\n\nSvarformat: { "resultater": [ { "id": "...", "analyse": "..." }, ... ] }' },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`OpenAI HTTP ${res.status}: ${body.slice(0, 200)}`);
      err.code = 'openai_error';
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      const err = new Error('OpenAI: tomt svar');
      err.code = 'empty';
      throw err;
    }

    // Parse JSON — vi ba om response_format=json_object, så innholdet er JSON
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const err = new Error('OpenAI: kunne ikke parse JSON: ' + e.message);
      err.code = 'parse';
      throw err;
    }

    const arr = Array.isArray(parsed) ? parsed : (parsed.resultater || parsed.results || parsed.saker || []);
    if (!Array.isArray(arr)) {
      const err = new Error('OpenAI: forventet array i resultater');
      err.code = 'shape';
      throw err;
    }

    const out = {};
    for (const item of arr) {
      if (item && item.id != null && item.analyse) {
        out[String(item.id)] = String(item.analyse).trim();
      }
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  // Kun POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // Vercel har allerede parset req.body når Content-Type er JSON.
    // Håndter både objekt og streng-body for robusthet.
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const saker = Array.isArray(body.saker) ? body.saker : [];
    if (!saker.length) {
      return res.status(400).json({ error: 'ingen_saker', message: 'Send { saker: [...] } med minst én sak.' });
    }
    if (saker.length > MAX_SAKER_PER_KALL) {
      return res.status(400).json({
        error: 'for_mange_saker',
        message: `Maks ${MAX_SAKER_PER_KALL} saker per kall. Del opp i flere batcher.`,
      });
    }

    // Valider hver sak — trenger minst id og tittel
    const gyldige = saker
      .filter((s) => s && s.id != null && s.tittel)
      .map((s) => ({
        id: String(s.id),
        tittel: String(s.tittel).slice(0, 300),
        kilde: s.kilde ? String(s.kilde).slice(0, 80) : '',
        sammendrag: s.sammendrag ? String(s.sammendrag).slice(0, 500) : '',
        temaer: Array.isArray(s.temaer) ? s.temaer.slice(0, 5).map(String) : [],
      }));

    if (!gyldige.length) {
      return res.status(400).json({ error: 'ugyldige_saker' });
    }

    // Sjekk om nøkkel er konfigurert — hvis ikke, returner tomt sett med 200
    // slik at frontend graceful faller tilbake til vanlig ingress.
    if (!process.env.OPENAI_API_KEY) {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(200).json({
        oppsummeringer: {},
        model: null,
        aktivert: false,
        melding: 'AI-oppsummering er ikke aktivert. Sett OPENAI_API_KEY i Vercel for å aktivere.',
      });
    }

    const oppsummeringer = await callOpenAI(gyldige);

    // Cache i CDN i 1 time — samme batch (samme sak-ID-er) skal ikke regenereres
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({
      oppsummeringer,
      model: MODEL,
      aktivert: true,
      generert: new Date().toISOString(),
      antall: Object.keys(oppsummeringer).length,
    });
  } catch (err) {
    // Aldri feil frontend — returner tomt sett med 200 og en melding
    // slik at nyhetsfeeden viser sakene uten AI-tekst.
    console.error('ai-oppsummering feilet:', err.code || 'unknown', err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      oppsummeringer: {},
      model: MODEL,
      aktivert: false,
      feil: err.code || 'unknown',
      melding: err.message || String(err),
    });
  }
}
