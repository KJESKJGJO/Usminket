// Delt modul: Google Nyheter-henting og URL-dekoding.
// Brukes av både /api/news (regjeringen.no) og /api/motoffensiv (frp.no + Frp-uttalelser).
//
// Google Nyheter serverer bare en JavaScript-basert redirect i sin RSS.
// Vi kaller batchexecute-endepunktet for å hente ut den ekte URL-en.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export async function decodeGoogleNewsUrl(googleUrl) {
  try {
    const idMatch = googleUrl.match(/\/articles\/([^?/]+)/);
    if (!idMatch) return googleUrl;
    const articleId = idMatch[1];

    // Steg 1: Hent HTML for signaturer
    const htmlRes = await fetch(googleUrl, {
      headers: { 'User-Agent': UA },
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
          'User-Agent': UA,
        },
        body,
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!rpcRes.ok) return googleUrl;
    const text = await rpcRes.text();

    // Prøver flere mønstre — frp.no først, ellers hvilken som helst http-URL
    const m =
      text.match(/"(https?:\/\/(?:www\.)?frp\.no[^"\\]+)/) ||
      text.match(/"(https?:\/\/(?:www\.)?regjeringen\.no[^"\\]+)/) ||
      text.match(/\[\\"garturlres\\",\\"(https?:\/\/[^\\]+)\\"/);
    if (!m) return googleUrl;
    let url = m[1];
    url = url
      .replace(/\\u003d/g, '=')
      .replace(/\\u0026/g, '&')
      .replace(/\\\\/g, '\\')
      .replace(/\\+$/, '');
    url = url.replace(/[?&]ch=\d+.*$/, '');
    return url;
  } catch {
    return googleUrl;
  }
}

// Enkel XML-parser for RSS <item>-noder — trekker ut title, link, pubDate, source, description.
export function parseRssItems(xml) {
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
    title = title
      .replace(/\s*[-–—]\s*Regjeringen\.no\s*$/i, '')
      .replace(/\s*[-–—]\s*Fremskrittspartiet\s*[-–—]?\s*FrP\.?\s*$/i, '')
      .trim();
    const link = pick('link');
    const pubDate = pick('pubDate');
    const source = pick('source') || '';
    let summary = pick('description') || '';
    summary = summary
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (title && link) items.push({ title, link, pubDate, source, summary });
  }
  return items;
}
