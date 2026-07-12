// Modul for å hente Frp-aktivitet fra Stortingets åpne data-API
// (data.stortinget.no).
//
// Vi henter:
//  - Skriftlige spørsmål stilt av Frp-representanter
//  - Interpellasjoner
//  - Muntlige spørretimespørsmål
//
// API-et er stabilt, gratis og krever ingen nøkkel. Grense: 100 kall/minutt.

const BASE = 'https://data.stortinget.no/eksport';
const UA = 'Mozilla/5.0 (compatible; UsminketBot/1.0; +https://usminket.vercel.app)';

// Konverter /Date(1782849581302+0200)/ til ISO
export function parseMsDate(raw) {
  if (!raw) return null;
  const m = String(raw).match(/\/Date\((\d+)[+-]\d+\)\//);
  if (!m) return null;
  return new Date(parseInt(m[1], 10)).toISOString();
}

// Beregner sesjons-id ut fra dagens dato
// Stortingsårget går fra oktober til september
export function currentSesjonId(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1-12
  // Fra oktober er vi i sesjon (y)-(y+1), ellers (y-1)-y
  if (m >= 10) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

// Henter én type Frp-utspill (skriftlig, muntlig eller interpellasjon).
// Returnerer normaliserte objekter.
async function hentSporsmal(sesjonId, endpoint, typeLabel) {
  const url = `${BASE}/${endpoint}?sesjonid=${sesjonId}&format=json`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) throw new Error(`Stortinget ${endpoint}: HTTP ${resp.status}`);
  const data = await resp.json();
  const lst = data.sporsmal_liste || [];

  return lst
    .filter((s) => {
      const p = s.sporsmal_fra?.parti;
      const pid = (typeof p === 'object' && p ? p.id : '') || '';
      return pid.toUpperCase() === 'FRP';
    })
    .map((s) => {
      const sf = s.sporsmal_fra || {};
      const navn = `${sf.fornavn || ''} ${sf.etternavn || ''}`.trim();
      const dato = parseMsDate(s.datert_dato) || parseMsDate(s.sendt_dato);
      const sporsmalNr = s.sporsmal_nummer;
      // URL til selve spørsmålet på stortinget.no
      let sakUrl = '';
      if (sporsmalNr && typeLabel === 'skriftlig') {
        sakUrl = `https://www.stortinget.no/no/Saker-og-publikasjoner/Sporsmal/Skriftlige-sporsmal-og-svar/Skriftlig-sporsmal/?qid=${sporsmalNr}`;
      } else if (sporsmalNr && typeLabel === 'muntlig') {
        sakUrl = `https://www.stortinget.no/no/Saker-og-publikasjoner/Sporsmal/Muntlige-sporsmal/?mid=${sporsmalNr}`;
      } else if (sporsmalNr && typeLabel === 'interpellasjon') {
        sakUrl = `https://www.stortinget.no/no/Saker-og-publikasjoner/Sporsmal/Interpellasjoner/Interpellasjon/?qid=${sporsmalNr}`;
      }
      return {
        id: s.id,
        type: typeLabel,
        tittel: (s.tittel || '').trim(),
        fra: navn,
        parti: 'FrP',
        til_minister: s.sporsmal_til_minister_tittel || s.rette_vedkommende_minister_tittel || '',
        datert: dato,
        status: s.status || '',
        kilde_url: sakUrl,
      };
    });
}

// Henter alle typer Frp-spørsmål for gitt sesjon.
// Feiler ikke hardt hvis enkelte endpoints er nede — returner det vi fikk.
export async function hentFrpSporsmal(sesjonId) {
  const sesjon = sesjonId || currentSesjonId();
  const results = await Promise.allSettled([
    hentSporsmal(sesjon, 'skriftligesporsmal', 'skriftlig'),
    hentSporsmal(sesjon, 'sporretimesporsmal', 'muntlig'),
    hentSporsmal(sesjon, 'interpellasjoner', 'interpellasjon'),
  ]);
  const items = [];
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value);
  }
  // Sorter nyeste først
  items.sort((a, b) => {
    const ta = new Date(a.datert || 0).getTime();
    const tb = new Date(b.datert || 0).getTime();
    return tb - ta;
  });
  return { sesjonId: sesjon, items };
}
