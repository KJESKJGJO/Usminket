// Vercel Serverless Function: /api/rss-tema?tema=<slug>
// Henter RSS-feed fra regjeringen.no for et gitt tema, parser den, og returnerer
// JSON som frontend kan rendre pent. Fungerer i Facebook-webview siden vi
// serverer HTML/JSON — ikke rå XML som FB ikke kan vise.

import { parseRssItems } from '../lib/gnews.js';

// Tema-slug -> departement + owner-ID på regjeringen.no
const TEMA_MAP = {
  skatt:       { navn: 'Skatt og økonomi',        dept: 'Finansdepartementet',           owner: 216 },
  budsjett:    { navn: 'Statsbudsjett',            dept: 'Finansdepartementet',           owner: 216 },
  velferd:     { navn: 'Velferd og pensjon',       dept: 'Arbeids- og inkluderingsdep.',  owner: 165 },
  arbeidsliv:  { navn: 'Arbeidsliv',               dept: 'Arbeids- og inkluderingsdep.',  owner: 165 },
  klima:       { navn: 'Klima og miljø',           dept: 'Klima- og miljødepartementet',  owner: 668 },
  justis:      { navn: 'Justis og beredskap',      dept: 'Justis- og beredskapsdep.',     owner: 463 },
  innvandring: { navn: 'Innvandring',              dept: 'Justis- og beredskapsdep.',     owner: 463 },
  distrikt:    { navn: 'Distrikt og kommune',      dept: 'Kommunal- og distriktsdep.',    owner: 504 },
  samferdsel:  { navn: 'Samferdsel og transport',  dept: 'Samferdselsdepartementet',      owner: 791 },
  utenriks:    { navn: 'Utenriks og forsvar',      dept: 'Utenriksdepartementet',         owner: 833 },
  smk:         { navn: 'Statsministerens kontor',  dept: 'Statsministerens kontor',       owner: 875 },
  generelt:    { navn: 'Alle departementer',       dept: 'Regjeringen.no',                owner: null },
};

const UA = 'Mozilla/5.0 (compatible; UsminketBot/1.0; +https://usminket.vercel.app)';

export default async function handler(req, res) {
  const tema = (req.query.tema || 'generelt').toLowerCase();
  const meta = TEMA_MAP[tema];

  if (!meta) {
    res.status(404).json({ error: 'Ukjent tema', gyldige: Object.keys(TEMA_MAP) });
    return;
  }

  const rssUrl = meta.owner
    ? `https://www.regjeringen.no/no/rss/Rss/2581966/?owner=${meta.owner}`
    : `https://www.regjeringen.no/no/rss/Rss/2581966/`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const r = await fetch(rssUrl, {
      headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!r.ok) {
      res.status(502).json({ error: `regjeringen.no returnerte ${r.status}`, rssUrl });
      return;
    }

    const xml = await r.text();
    const items = parseRssItems(xml).slice(0, 15);

    // Cache i 15 min på Vercel edge, og la nettleseren cache i 5 min
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    res.status(200).json({
      tema,
      navn: meta.navn,
      dept: meta.dept,
      rssUrl,
      hentet: new Date().toISOString(),
      antall: items.length,
      items,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Kunne ikke hente RSS-feed',
      message: String(err?.message || err),
      rssUrl,
    });
  }
}
