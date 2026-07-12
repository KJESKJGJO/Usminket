// Vercel Serverless Function: /api/stortinget
// Henter Frp-representanters aktivitet fra Stortingets åpne API:
// skriftlige spørsmål, muntlige spørretimespørsmål, interpellasjoner.
//
// Query-parametere:
//   ?limit=N       — antall (default 30, max 100)
//   ?type=X        — 'skriftlig' | 'muntlig' | 'interpellasjon' | 'alle' (default 'alle')
//   ?tema=X        — filtrer på tema (samme sett som news og motoffensiv)
//
// Ingen auth — dette er offentlig informasjon fra Stortinget som vi bare
// filtrerer og strukturerer. Kilde: data.stortinget.no under NLOD 2.0.

import { hentFrpSporsmal } from '../lib/stortinget.js';

// Vercel serverless config — Stortinget-API-et er tregt; tillat 30 sekunder
export const config = { maxDuration: 30 };

// Samme klassifisering som news.js og motoffensiv.js — holdt inline for
// isolasjon (endringer i én endpoint skal ikke uventet påvirke andre).
const TEMA_KEYWORDS = {
  skatt: ['skatt', 'formuesskatt', 'skattelette', 'arveavgift', 'moms', 'avgift', 'grunnrente', 'bilavgift', 'engangsavgift', 'eiendomsskatt', 'inntektsskatt', 'selskapsskatt', 'utbytteskatt'],
  velferd: ['velferd', 'helse', 'sykehus', 'eldre', 'eldreomsorg', 'pensjon', 'trygd', 'nav', 'privatiser', 'kommersialiser', 'fritt behandlingsvalg', 'egenandel', 'sykehjem', 'barnehage', 'skole', 'utdanning', 'barnetrygd', 'kontantstøtte', 'fastlege', 'rehabilitering'],
  arbeidsliv: ['arbeidsliv', 'arbeidsmiljølov', 'innleie', 'bemanning', 'tariff', 'lønn', 'fagforening', 'streik', 'a-krim', 'sosial dumping', 'midlertidig ansett', 'fast ansett'],
  klima: ['klima', 'utslipp', 'olje', 'gass', 'petroleum', 'havvind', 'vindkraft', 'elbil', 'bensinbil', 'dieselbil', 'co2', 'klimatiltak', 'klimaavgift', 'grønn omstilling', 'fornybar', 'strømpris', 'strømstøtte', 'energi'],
  innvandring: ['innvandring', 'asyl', 'flyktning', 'ukrainer', 'integrer', 'utlending', 'udi', 'schengen', 'retur', 'utvisning', 'kvoteflyktning'],
  justis: ['kriminal', 'straff', 'politi', 'gjeng', 'narkotika', 'vold', 'voldtekt', 'overgrep', 'fengsel', 'soning', 'strengere straff', 'strafferabatt', 'nabolagspoliti', 'terror', 'beredskap'],
  distrikt: ['distrikt', 'landsbygd', 'landbruk', 'bonde', 'fiske', 'havbruk', 'kommune', 'fylke', 'nord-norge', 'kommuneøkonomi', 'ferge', 'reindrift'],
  samferdsel: ['samferdsel', 'motorvei', 'firefelts', 'jernbane', 'tog', 'bompeng', 'bomring', 'nye veier', 'statens vegvesen', 'ntp', 'transportplan', 'fartsgrense', 'kollektiv'],
  budsjett: ['alternativt statsbudsjett', 'alt.budsjett', 'oljepengebruk', 'handlingsregel', 'statsbudsjett', 'saldert', 'oljefond', 'finanspolitikk'],
};

function klassifiser(text) {
  const t = (text || '').toLowerCase();
  const treff = [];
  for (const [tema, ord] of Object.entries(TEMA_KEYWORDS)) {
    if (ord.some((k) => t.includes(k))) treff.push(tema);
  }
  return treff;
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit') || '30', 10), 1),
      100,
    );
    const typeFilter = (url.searchParams.get('type') || 'alle').toLowerCase();
    const temaFilter = (url.searchParams.get('tema') || '').toLowerCase().trim();

    const { sesjonId, items } = await hentFrpSporsmal();

    // Tema-klassifisering
    let enriched = items.map((it) => ({
      ...it,
      temaer: klassifiser(it.tittel),
    }));

    if (typeFilter !== 'alle') {
      enriched = enriched.filter((it) => it.type === typeFilter);
    }
    if (temaFilter) {
      enriched = enriched.filter((it) => it.temaer.includes(temaFilter));
    }

    enriched = enriched.slice(0, limit);

    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({
      sesjon: sesjonId,
      count: enriched.length,
      totalHentet: items.length,
      typeFilter: typeFilter === 'alle' ? null : typeFilter,
      temaFilter: temaFilter || null,
      items: enriched,
      fetchedAt: new Date().toISOString(),
      kilde: 'data.stortinget.no under NLOD 2.0',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'fetch_failed',
      message: err.message || String(err),
    });
  }
}
