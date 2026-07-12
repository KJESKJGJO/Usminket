// /api/stortinget-detalj?id=<NSporsmalId>
//
// Henter full detaljinformasjon om ett stortingsspørsmål: full spørsmålstekst,
// eventuell begrunnelse, og svar fra ansvarlig statsråd. Bruker det nye
// endepunktet data.stortinget.no/eksport/enkeltsporsmal med NSporsmalId (fra
// desember 2024). Returnerer normalisert JSON tilpasset frontend.
//
// Cache: 30 min offentlig — svar endres sjelden etter at spørsmål er besvart.

const BASE = 'https://data.stortinget.no/eksport';
const UA =
  'Mozilla/5.0 (compatible; UsminketBot/1.0; +https://usminket.vercel.app)';

function parseMsDate(raw) {
  if (!raw) return null;
  const m = String(raw).match(/\/Date\((\d+)[+-]\d+\)\//);
  if (!m) return null;
  try {
    return new Date(parseInt(m[1], 10)).toISOString();
  } catch {
    return null;
  }
}

function fmtPerson(p) {
  if (!p || typeof p !== 'object') return null;
  const navn = `${p.fornavn || ''} ${p.etternavn || ''}`.trim();
  return {
    id: p.id || null,
    navn,
    parti: (p.parti && p.parti.navn) || null,
    partiId: (p.parti && p.parti.id) || null,
    fylke: (p.fylke && p.fylke.navn) || null,
  };
}

// status-tall til lesbar tekst. Basert på observert bruk:
// 1 = behandlet/besvart, 2 = trukket, 3 = bortfalt, 4 = til behandling
function statusTekst(n) {
  const map = { 1: 'Besvart', 2: 'Trukket', 3: 'Bortfalt', 4: 'Til behandling' };
  return map[Number(n)] || '';
}

// Type-tall fra Stortinget-API-et:
// 1 = spørretime (muntlig spørsmål), 2 = muntlig spørsmål, 3 = ordinær spørretime,
// 4 = interpellasjon, 5 = skriftlig, 6 = interpellasjon (variant).
// Videoarkivet har opptak for alt som debatteres i salen — alt utenom skriftlig (5).
function harPlenumsDebatt(type) {
  const n = Number(type);
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 6;
}

// Bygger referat-URL-slug fra en ISO-dato (YYYY-MM-DD) og sesjon (YYYY-YYYY).
// Format: refs-YYYYSS-MM-DD  (SS = siste to siffer av andre år i sesjon)
function referatSlug(sesjonId, isoDato) {
  if (!sesjonId || !isoDato) return null;
  const [y1, y2] = String(sesjonId).split('-');
  if (!y1 || !y2 || y2.length !== 4) return null;
  const kort = y1.slice(2) + y2.slice(2); // 2025 + 2026 -> "2526"
  const dato = isoDato.slice(0, 10); // "2026-05-20"
  const [, mm, dd] = dato.split('-');
  if (!mm || !dd) return null;
  return `refs-${y1.slice(0,2)}${kort}-${mm}-${dd}`;
}

// Henter referatsiden for et gitt møte og finner:
// - hovedvideo-URL for møtet (meid + rtid)
// - selve videoklipp-URL for det aktuelle innlegget (basert på navn + parti)
// Returnerer { debattVideo, spillerensVideo, referatUrl } eller null hvis ikke funnet.
async function finnVideoForInnlegg({ sesjonId, besvartDato, stiller }) {
  try {
    const slug = referatSlug(sesjonId, besvartDato);
    if (!slug) return null;
    // Bygger begge m=1 og m=2 kandidater. Sprøretime er typisk m=1.
    for (const m of ['1', '2']) {
      const referatUrl = `https://www.stortinget.no/no/Saker-og-publikasjoner/Publikasjoner/Referater/Stortinget/${sesjonId}/${slug}?m=${m}`;
      const html = await hentReferat(referatUrl);
      if (!html) continue;
      // Hovedvideo (øverst på siden)
      const hovedMatch = html.match(/href="(\/no\/Hva-skjer-pa-Stortinget\/videoarkiv\/Arkiv-TV-sendinger\/[^"]+)"/);
      const hovedVideoUrl = hovedMatch ? `https://www.stortinget.no${hovedMatch[1]}` : null;

      // Innlegg-lenke: bruk innholdsfortegnelsen (table-of-content) som
      // inneholder alle ankere med format data-bigdoc-hash="HHMMSS-N-M" for
      // hvert innlegg. Vi finner første innlegg der stillerens navn forekommer.
      let innleggVideoUrl = null;
      let ankerId = null;
      if (stiller && stiller.navn) {
        const partiKort = stiller.partiId || '';
        // Match TOC-oppføringen: data-bigdoc-hash="HHMMSS-N-M"...>Navn (Parti) - Hovedinnlegg
        const tocRegex = new RegExp(
          'data-bigdoc-hash="(\\d{6}-\\d+-\\d+)"[^>]*>' +
          escapeRegex(stiller.navn) + '\\s*\\(' + escapeRegex(partiKort) + '\\)\\s*-\\s*Hovedinnlegg',
          'i'
        );
        const tocMatch = html.match(tocRegex);
        if (tocMatch) {
          ankerId = tocMatch[1];
          // Selve teksten har ingen egen videoarkiv-URL for hvert innlegg
          // (de er JS-håndterte). Vi konstruerer URL syntetisk basert på:
          //   msid = sekunder mellom rtid (sendestart) og anker-HHMMSS
          // Anker-format: HHMMSS-N-M der HHMMSS er tidspunkt innlegget startet.
          const hhmmss = ankerId.split('-')[0]; // "100151"
          if (hovedVideoUrl && hhmmss.length === 6) {
            const rtidMatch = hovedVideoUrl.match(/rtid=(\d{6})/);
            const meidMatch = hovedVideoUrl.match(/meid=(\d+)/);
            if (rtidMatch && meidMatch) {
              const startSek = hmsTilSek(rtidMatch[1]);
              const innleggSek = hmsTilSek(hhmmss);
              if (startSek != null && innleggSek != null && innleggSek >= startSek) {
                const msid = innleggSek - startSek;
                innleggVideoUrl = `https://www.stortinget.no/no/Hva-skjer-pa-Stortinget/videoarkiv/Arkiv-TV-sendinger/?meid=${meidMatch[1]}&del=1&rtid=${rtidMatch[1]}&msid=${msid}`;
              }
            }
          }
        }
      }

      if (hovedVideoUrl) {
        return {
          referatUrl: ankerId ? `${referatUrl}#${ankerId}` : referatUrl,
          debattVideoUrl: decodeHtml(hovedVideoUrl),
          innleggVideoUrl: innleggVideoUrl,
        };
      }
    }
    return null;
  } catch (e) {
    console.error('finnVideoForInnlegg feilet:', e);
    return null;
  }
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Konverterer HTML-entities (&amp;) tilbake til vanlige tegn.
function decodeHtml(s) {
  return String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// Konverterer 6-siffret HHMMSS til totalt antall sekunder siden midnatt.
function hmsTilSek(hms) {
  if (!hms || hms.length !== 6) return null;
  const h = parseInt(hms.slice(0, 2), 10);
  const m = parseInt(hms.slice(2, 4), 10);
  const s = parseInt(hms.slice(4, 6), 10);
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
  return h * 3600 + m * 60 + s;
}

async function hentReferat(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const id = (url.searchParams.get('id') || '').trim();
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'invalid_id', message: 'id må være et heltall (NSporsmalId)' });
    }

    // NSporsmalId er det nye stabile ID-formatet (fra desember 2024).
    // Vi bruker det som id-en fra listen (dvs. det som lagres på temasidene).
    const apiUrl = `${BASE}/enkeltsporsmal?NSporsmalId=${encodeURIComponent(id)}&format=json`;
    const resp = await fetch(apiUrl, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) {
      return res.status(502).json({ error: 'upstream_error', status: resp.status });
    }
    const d = await resp.json();

    // Vi anser responsen som gyldig hvis 'sporsmal' eller 'tittel' finnes.
    if (!d || (!d.sporsmal && !d.tittel)) {
      return res.status(404).json({ error: 'not_found', message: 'Fant ikke spørsmål med gitt id' });
    }

    // Sporsmalsnummer bestemmer type-lenke — status-feltet er tallkodet.
    const type = d.type;
    const sporsmalNr = d.sporsmal_nummer;
    const stiller = fmtPerson(d.sporsmal_fra);
    const besvartDato = parseMsDate(d.besvart_dato);

    // Hent video-lenke for muntlige spørsmål og interpellasjoner (ikke skriftlige)
    let videoInfo = null;
    if (harPlenumsDebatt(type) && besvartDato) {
      videoInfo = await finnVideoForInnlegg({
        sesjonId: d.sesjon_id,
        besvartDato,
        stiller,
      });
    }

    const normalisert = {
      id: d.id,
      sesjonId: d.sesjon_id || null,
      sporsmalNr: sporsmalNr || null,
      tittel: (d.tittel || '').trim(),
      // Full spørsmålstekst — inneholder HTML (br-tagger)
      sporsmal: d.sporsmal || '',
      // Begrunnelse kan være tom
      begrunnelse: d.begrunnelse || '',
      // Svar fra statsråden — HTML, kan være tom hvis ikke besvart
      svar: d.svar || '',
      // Datoer
      datertDato: parseMsDate(d.datert_dato),
      sendtDato: parseMsDate(d.sendt_dato),
      besvartDato,
      // Hvem stilte
      stiller,
      // Hvem det var stilt til
      stiltTilMinister: d.sporsmal_til_minister_tittel || null,
      stiltTilPerson: fmtPerson(d.sporsmal_til),
      // Rette vedkommende hvis omadresert
      retteVedkommendeMinister: d.rette_vedkommende_minister_tittel || null,
      retteVedkommendePerson: fmtPerson(d.rette_vedkommende),
      // Hvem svarte faktisk
      besvartAvMinister: d.besvart_av_minister_tittel || null,
      besvartAvPerson: fmtPerson(d.besvart_av),
      // På vegne av
      besvartPaVegneAvMinister: d.besvart_pa_vegne_av_minister_tittel || null,
      status: statusTekst(d.status),
      statusKode: d.status,
      type,
      // Video-lenker for muntlige spørsmål og interpellasjoner
      video: videoInfo,
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
    return res.status(200).json(normalisert);
  } catch (e) {
    console.error('stortinget-detalj feilet:', e);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(500).json({ error: 'server_error', message: String(e.message || e) });
  }
}
