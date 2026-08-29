// Vercel Serverless Function: /api/frp-rss
// Ekte RSS 2.0-feed («Frp-utspill i norske medier») — samme datasett som
// /api/frp-nyheter (JSON, brukt av Innsikt- og Frp-utspill-sidene), men
// formatert som gyldig RSS-XML slik at den kan limes rett inn i en RSS-leser
// (Feedly, Inoreader, NetNewsWire, Reeder, Thunderbird, osv.).
//
// Query (valgfritt, samme som /api/frp-nyheter):
//   ?omraade=nasjonalt|lokalt|alle   (default: alle)
//   ?tema=<slug>                      (f.eks. skatt, velferd, innvandring …)
//   ?limit=<n>                        (default 40, maks 60)

import { getFrpNyheter } from '../lib/frp-core.js';

const SITE = 'https://usminket.vercel.app';

const TEMA_LABEL = {
  skatt: 'Skatt', velferd: 'Velferd', arbeidsliv: 'Arbeidsliv', klima: 'Klima',
  innvandring: 'Innvandring', justis: 'Justis', distrikt: 'Distrikt',
  samferdsel: 'Samferdsel', utenriks: 'Utenriks', budsjett: 'Budsjett',
};

function xmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(pubDate) {
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

// Google Nyheter-sammendraget er full av HTML-rester ("a href=... /a nbsp;").
// Vi bygger en kort, ren beskrivelse selv i stedet for å eksponere det rotet
// i RSS-lesere.
function beskrivelse(it) {
  const omraade = it.kildeType === 'nasjonalt' ? 'nasjonale medier' : (it.kildeType === 'lokalt' ? 'lokale/regionale medier' : 'norske medier');
  const temaer = (it.temaer || []).map((t) => TEMA_LABEL[t] || t).join(', ');
  const kilde = it.kilde || 'ukjent kilde';
  return temaer
    ? `Omtale av Frp i ${omraade} (${kilde}) — tema: ${temaer}.`
    : `Omtale av Frp i ${omraade} (${kilde}).`;
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const omraade = url.searchParams.get('omraade') || 'alle';
    const tema = url.searchParams.get('tema') || '';
    const limit = parseInt(url.searchParams.get('limit') || '40', 10) || 40;

    const { items } = await getFrpNyheter({ omraade, tema, limit });

    const temaLabel = tema && TEMA_LABEL[tema.toLowerCase()];
    const feedTitle = temaLabel
      ? `Usminket politikk — Frp-utspill om ${temaLabel}`
      : 'Usminket politikk — Frp-utspill i norske medier';
    const feedDescr = 'Frps utspill og omtale i norske medier (nasjonalt og lokalt), samlet av Usminket politikk — Frp under lupen.';
    const feedLink = `${SITE}/nyheter.html`;
    const selfLink = `${SITE}/api/frp-rss${tema ? `?tema=${encodeURIComponent(tema)}` : ''}`;

    const itemsXml = items.map((it) => {
      const categories = (it.temaer || [])
        .map((t) => `      <category>${xmlEscape(TEMA_LABEL[t] || t)}</category>`)
        .join('\n');
      return `    <item>
      <title>${xmlEscape(it.tittel)}</title>
      <link>${xmlEscape(it.link)}</link>
      <guid isPermaLink="true">${xmlEscape(it.link)}</guid>
      <pubDate>${toRfc822(it.pubDate)}</pubDate>
      <source>${xmlEscape(it.kilde || 'Ukjent kilde')}</source>
      <description>${xmlEscape(beskrivelse(it))}</description>
${categories}
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(feedTitle)}</title>
    <link>${xmlEscape(feedLink)}</link>
    <atom:link href="${xmlEscape(selfLink)}" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(feedDescr)}</description>
    <language>nb-no</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>15</ttl>
${itemsXml}
  </channel>
</rss>`;

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    return res.status(200).send(xml);
  } catch (err) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send(
      `<?xml version="1.0" encoding="UTF-8"?><error>${xmlEscape(err.message || String(err))}</error>`,
    );
  }
}
