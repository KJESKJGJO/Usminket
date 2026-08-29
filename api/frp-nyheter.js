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
//
// Kjernelogikken (henting, deduplisering, klassifisering) ligger i
// ../lib/frp-core.js og deles med /api/frp-rss (RSS 2.0-versjon av samme feed).

import { getFrpNyheter } from '../lib/frp-core.js';

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const omraade = url.searchParams.get('omraade') || 'alle';
    const tema = url.searchParams.get('tema') || '';
    const limit = parseInt(url.searchParams.get('limit') || '40', 10) || 40;

    const { items } = await getFrpNyheter({ omraade, tema, limit });

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=900, stale-while-revalidate=300',
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({
      items,
      omraade: omraade || 'alle',
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
