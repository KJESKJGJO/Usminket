// Mobile nav toggle
(function () {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();

// Scroll reveal — arm hiding only if IntersectionObserver is available.
// Otherwise leave everything visible.
(function () {
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  const els = document.querySelectorAll('.reveal');
  els.forEach((el) => io.observe(el));
  // Reveal anything already in viewport on load, and as a safety net,
  // force-reveal everything after 1.2s so nothing stays permanently hidden.
  requestAnimationFrame(() => {
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add('is-visible');
        io.unobserve(el);
      }
    });
  });
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => el.classList.add('is-visible'));
  }, 1200);
})();

// Regjeringen.no news feed (hentes fra /api/news som Vercel serverless funksjon)
// Støtter data-tema="skatt" og data-limit="3" på container for tema-filtrerte feeder.
(function () {
  const containers = document.querySelectorAll('[data-news]');
  if (!containers.length) return;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(raw) {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d)) return raw.replace(/\s+GMT.*$/, '');
    const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
    return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function renderInto(container, items) {
    if (!items.length) {
      const tema = container.getAttribute('data-tema');
      const msg = tema
        ? 'Ingen ferske regjeringen.no-saker på dette temaet akkurat nå.'
        : 'Fant ingen saker akkurat nå.';
      container.innerHTML = `<div class="news__error">${msg}</div>`;
      return;
    }
    // Bygg URL som forsoker aa aapne i systembrowser paa iOS i stedet for
    // Facebooks in-app-nettleser. Bruker en enkel wrapper som lar iOS
    // vise "Aapne i Safari"-forslag.
    container.innerHTML = items.map((it) => `
      <a class="news__item" href="${escapeHtml(it.link)}" target="_blank" rel="noopener noreferrer external">
        <div class="news__date">${escapeHtml(formatDate(it.pubDate))}</div>
        <h3 class="news__title">${escapeHtml(it.title)}</h3>
        <div class="news__source">${escapeHtml(it.source || 'Regjeringen.no')}</div>
      </a>
    `).join('');

    // Er vi i Facebooks in-app-nettleser? Da sliter regjeringen.no med
    // Cloudflare-utfordring. Vis en tydelig hint.
    const inFb = /FBAN|FBAV|Instagram/i.test(navigator.userAgent);
    if (inFb && !container.querySelector('.news__fb-hint')) {
      const hint = document.createElement('div');
      hint.className = 'news__fb-hint';
      hint.innerHTML =
        'Åpner du en lenke i Facebook-appen og får «Finner ikke siden»? ' +
        'Trykk på menyen (tre prikker øverst til høyre) og velg «Åpne i Safari». ' +
        'Regjeringen.no krever ekte nettleser for å laste inn.';
      container.insertBefore(hint, container.firstChild);
    }
  }

  containers.forEach((container) => {
    const tema = container.getAttribute('data-tema') || '';
    const limit = parseInt(container.getAttribute('data-limit') || '6', 10) || 6;
    const url = tema
      ? `/api/news?tema=${encodeURIComponent(tema)}&limit=${limit}`
      : `/api/news?limit=${limit}`;

    fetch(url, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const items = (data && data.items) || [];
        renderInto(container, items.slice(0, limit));
      })
      .catch((err) => {
        container.innerHTML = `<div class="news__error">Kunne ikke hente siste nyheter fra Regjeringen. Prøv igjen senere.</div>`;
        // eslint-disable-next-line no-console
        console.error('news fetch failed', err);
      });
  });
})();

/* ---- Motoffensiv nav-lenke: pre-fyller key hvis tokenet ligger lagret ---- */
(function moNavToken() {
  try {
    var links = document.querySelectorAll('[data-mo-link]');
    if (!links.length) return;
    var params = new URLSearchParams(window.location.search);
    var tok = params.get('key') || localStorage.getItem('mo_token') || '';
    if (!tok) return;
    links.forEach(function (a) {
      a.href = 'motoffensiv?key=' + encodeURIComponent(tok);
    });
  } catch (e) { /* ignore */ }
})();

/* ---- Frp under lupen: samler program, medieutspill og Stortinget per tema ---- */
(function () {
  const containers = document.querySelectorAll('[data-frp-lupen]');
  if (!containers.length) return;

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDato(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d)) return '';
      return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }
  function fmtDagerSiden(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d)) return '';
      const dager = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (dager <= 0) return 'i dag';
      if (dager === 1) return 'i går';
      return `for ${dager} dager siden`;
    } catch { return ''; }
  }
  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  }
  function typeEtikett(t) {
    if (t === 'skriftlig') return 'Skriftlig spørsmål';
    if (t === 'muntlig') return 'Muntlig spørretime';
    if (t === 'interpellasjon') return 'Interpellasjon';
    return 'Stortinget';
  }

  function renderProgram(prog) {
    if (!prog || !prog.programpunkter || !prog.programpunkter.length) return '';
    const punkter = prog.programpunkter.slice(0, 4).map((pp) => `
      <li class="lupen-prog__punkt">
        <div class="lupen-prog__tekst">${esc(pp.tekst)}</div>
        <div class="lupen-prog__kilde">
          Kilde: ${pp.kilde_url
            ? `<a href="${esc(pp.kilde_url)}" target="_blank" rel="noopener">${esc(pp.kilde)}</a>`
            : esc(pp.kilde)}
        </div>
      </li>
    `).join('');
    const motarg = prog.motargument
      ? `<p class="lupen-prog__motarg">${esc(prog.motargument)}</p>`
      : '';
    return `
      <div class="lupen-block lupen-block--program">
        <h3 class="lupen-block__title">Frps eget program på dette temaet</h3>
        <ul class="lupen-prog__liste">${punkter}</ul>
        ${motarg}
      </div>
    `;
  }

  function renderNyheter(items) {
    if (!items || !items.length) {
      return `
        <div class="lupen-block lupen-block--nyheter">
          <h3 class="lupen-block__title">Ferske Frp-utspill i media</h3>
          <p class="lupen-empty">Ingen ferske utspill fra Frp registrert på dette temaet siste ukene.</p>
        </div>
      `;
    }
    const kort = items.map((it) => `
      <a class="lupen-kort" href="${esc(it.link)}" target="_blank" rel="noopener">
        <div class="lupen-kort__meta">
          <span class="lupen-kort__kilde">${esc(domainOf(it.link) || it.source || 'kilde')}</span>
          <span class="lupen-kort__dato">${esc(fmtDagerSiden(it.pubDate) || fmtDato(it.pubDate))}</span>
        </div>
        <div class="lupen-kort__tittel">${esc(it.title)}</div>
      </a>
    `).join('');
    return `
      <div class="lupen-block lupen-block--nyheter">
        <h3 class="lupen-block__title">Ferske Frp-utspill i media</h3>
        <div class="lupen-kort__grid">${kort}</div>
      </div>
    `;
  }

  function renderStortinget(items, sesjon) {
    if (!items || !items.length) {
      return `
        <div class="lupen-block lupen-block--stortinget">
          <h3 class="lupen-block__title">Fra Stortinget</h3>
          <p class="lupen-empty">Ingen Frp-spørsmål registrert på dette temaet i inneværende sesjon.</p>
        </div>
      `;
    }
    const kort = items.map((s) => `
      <article class="lupen-storting" data-storting-id="${esc(s.id)}">
        <button type="button" class="lupen-storting__topp" data-storting-toggle aria-expanded="false">
          <div class="lupen-storting__hode">
            <div class="lupen-storting__type">${esc(typeEtikett(s.type))}</div>
            <div class="lupen-storting__tittel">${esc(s.tittel)}</div>
            <div class="lupen-storting__meta">
              ${s.stiller ? `<span>${esc(s.stiller)} (Frp)</span>` : ''}
              ${s.stiltTil ? `<span> \u00b7 stilt til ${esc(s.stiltTil)}</span>` : ''}
              ${s.datoMottatt ? `<span> \u00b7 ${esc(fmtDato(s.datoMottatt))}</span>` : ''}
              ${s.status ? `<span class="lupen-storting__status"> \u00b7 ${esc(s.status === 'Besvart' ? 'besvart' : String(s.status).toLowerCase())}</span>` : ''}
            </div>
          </div>
          <span class="lupen-storting__chevron" aria-hidden="true"></span>
        </button>
        <div class="lupen-storting__detalj" hidden>
          <div class="lupen-storting__loading" role="status" aria-live="polite">Henter spørsmål og svar \u2026</div>
        </div>
      </article>
    `).join('');
    const sesjontekst = sesjon ? ` <span class="lupen-block__sub">(sesjon ${esc(sesjon)})</span>` : '';
    return `
      <div class="lupen-block lupen-block--stortinget">
        <h3 class="lupen-block__title">Fra Stortinget${sesjontekst}</h3>
        <div class="lupen-storting__liste">${kort}</div>
      </div>
    `;
  }

  // Sanitize HTML fra Stortinget-svar. De sender <br/>, <p>, evt. lister — vi
  // beholder br/p/ul/ol/li/strong/em/a, fjerner alt annet. Bruker DOMParser for
  // robust håndtering, deretter serialiserer vi ut.
  const ALLOWED_TAGS = new Set(['BR','P','UL','OL','LI','STRONG','EM','B','I','A']);
  function sanitizeHtml(raw) {
    if (!raw) return '';
    try {
      const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
      const root = doc.body.firstChild;
      if (!root) return '';
      const walk = (node) => {
        const children = Array.from(node.childNodes);
        for (const c of children) {
          if (c.nodeType === 1) { // element
            if (!ALLOWED_TAGS.has(c.tagName)) {
              // erstatt med tekstinnhold
              const text = doc.createTextNode(c.textContent || '');
              node.replaceChild(text, c);
            } else {
              // strip alle attributter unntatt href på <a>
              if (c.tagName === 'A') {
                const href = c.getAttribute('href') || '';
                Array.from(c.attributes).forEach((a) => c.removeAttribute(a.name));
                if (/^https?:\/\//i.test(href)) {
                  c.setAttribute('href', href);
                  c.setAttribute('target', '_blank');
                  c.setAttribute('rel', 'noopener');
                }
              } else {
                Array.from(c.attributes).forEach((a) => c.removeAttribute(a.name));
              }
              walk(c);
            }
          }
        }
      };
      walk(root);
      return root.innerHTML;
    } catch {
      // fallback: bare escape
      return esc(raw);
    }
  }

  function renderStortingetDetalj(d, kildeUrl) {
    const stiller = d.stiller || {};
    const stiltTil = d.stiltTilPerson || {};
    const besvartAv = d.besvartAvPerson || {};
    const stiltTilTittel = d.stiltTilMinister || '';
    const besvartAvTittel = d.besvartAvMinister || '';
    // Var omadresert? Rette vedkommende er ulikt stilt til.
    const retteMinister = d.retteVedkommendeMinister || '';
    const wasReassigned = retteMinister && stiltTilTittel && retteMinister !== stiltTilTittel;

    const metaRader = [];
    if (stiller.navn) {
      metaRader.push(`<div class="lupen-detalj__meta"><span class="lupen-detalj__label">Stilt av</span><span class="lupen-detalj__val">${esc(stiller.navn)} (Frp${stiller.fylke ? ', ' + esc(stiller.fylke) : ''})</span></div>`);
    }
    if (stiltTilTittel || stiltTil.navn) {
      const navnDel = stiltTil.navn ? ` \u2014 ${esc(stiltTil.navn)}` : '';
      metaRader.push(`<div class="lupen-detalj__meta"><span class="lupen-detalj__label">Stilt til</span><span class="lupen-detalj__val">${esc(stiltTilTittel)}${navnDel}</span></div>`);
    }
    if (wasReassigned) {
      metaRader.push(`<div class="lupen-detalj__meta"><span class="lupen-detalj__label">Omadressert til</span><span class="lupen-detalj__val">${esc(retteMinister)}</span></div>`);
    }
    if (d.datertDato) {
      metaRader.push(`<div class="lupen-detalj__meta"><span class="lupen-detalj__label">Datert</span><span class="lupen-detalj__val">${esc(fmtDato(d.datertDato))}</span></div>`);
    }
    if (d.besvartDato) {
      metaRader.push(`<div class="lupen-detalj__meta"><span class="lupen-detalj__label">Besvart</span><span class="lupen-detalj__val">${esc(fmtDato(d.besvartDato))}</span></div>`);
    }

    const begrunnelseBlokk = d.begrunnelse
      ? `<div class="lupen-detalj__seksjon"><div class="lupen-detalj__seksjonstittel">Begrunnelse</div><div class="lupen-detalj__brodtekst">${sanitizeHtml(d.begrunnelse)}</div></div>`
      : '';

    const sporsmalBlokk = d.sporsmal
      ? `<div class="lupen-detalj__seksjon"><div class="lupen-detalj__seksjonstittel">Spørsmål</div><div class="lupen-detalj__brodtekst">${sanitizeHtml(d.sporsmal)}</div></div>`
      : '';

    let svarBlokk;
    if (d.svar) {
      const svarerFra = besvartAvTittel
        ? `Svar fra ${esc(besvartAvTittel)}${besvartAv.navn ? ' (' + esc(besvartAv.navn) + ')' : ''}`
        : 'Svar fra statsråden';
      svarBlokk = `<div class="lupen-detalj__seksjon lupen-detalj__seksjon--svar"><div class="lupen-detalj__seksjonstittel">${svarerFra}</div><div class="lupen-detalj__brodtekst">${sanitizeHtml(d.svar)}</div></div>`;
    } else {
      svarBlokk = `<div class="lupen-detalj__seksjon lupen-detalj__seksjon--svar"><div class="lupen-detalj__seksjonstittel">Svar</div><p class="lupen-empty" style="margin:0;">Spørsmålet er ikke besvart ennå.</p></div>`;
    }

    // Video-lenker for muntlige spørsmål og interpellasjoner
    let videoBlokk = '';
    const v = d.video;
    if (v && (v.innleggVideoUrl || v.debattVideoUrl)) {
      const lenker = [];
      if (v.innleggVideoUrl) {
        lenker.push(`<a class="lupen-detalj__video-lenke" href="${esc(v.innleggVideoUrl)}" target="_blank" rel="noopener"><span class="lupen-detalj__video-ikon" aria-hidden="true">▶</span> Se spørsmålet på video</a>`);
      }
      if (v.debattVideoUrl) {
        lenker.push(`<a class="lupen-detalj__video-lenke lupen-detalj__video-lenke--sekundaer" href="${esc(v.debattVideoUrl)}" target="_blank" rel="noopener">Se hele debatten</a>`);
      }
      if (v.referatUrl) {
        lenker.push(`<a class="lupen-detalj__video-lenke lupen-detalj__video-lenke--sekundaer" href="${esc(v.referatUrl)}" target="_blank" rel="noopener">Les stenografisk referat</a>`);
      }
      videoBlokk = `<div class="lupen-detalj__video">${lenker.join('')}</div>`;
    }

    const kildeLenke = kildeUrl
      ? `<a class="lupen-detalj__lenke" href="${esc(kildeUrl)}" target="_blank" rel="noopener">Se på stortinget.no \u2192</a>`
      : '';

    return `
      <div class="lupen-detalj__meta-grid">${metaRader.join('')}</div>
      ${videoBlokk}
      ${begrunnelseBlokk}
      ${sporsmalBlokk}
      ${svarBlokk}
      ${kildeLenke}
    `;
  }

  // Cache for detalj-svar per storting-id
  const detaljCache = new Map();

  function bindStortingToggler(root) {
    root.querySelectorAll('[data-storting-toggle]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const article = btn.closest('.lupen-storting');
        if (!article) return;
        const detalj = article.querySelector('.lupen-storting__detalj');
        const id = article.getAttribute('data-storting-id');
        const currentlyOpen = btn.getAttribute('aria-expanded') === 'true';

        if (currentlyOpen) {
          btn.setAttribute('aria-expanded', 'false');
          detalj.hidden = true;
          article.classList.remove('is-open');
          return;
        }

        btn.setAttribute('aria-expanded', 'true');
        detalj.hidden = false;
        article.classList.add('is-open');

        if (detaljCache.has(id)) {
          detalj.innerHTML = detaljCache.get(id);
          return;
        }

        // Hent fra API
        try {
          const url = `/api/stortinget-detalj?id=${encodeURIComponent(id)}`;
          const r = await fetch(url);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const d = await r.json();
          // Vi henter kildeUrl fra nærmeste <article>'s data eller fra lupen-blokka
          // Enklest: bruk det som ligger i lupenState (se under)
          const kildeUrl = lupenState.linkForId.get(id) || '';
          const html = renderStortingetDetalj(d, kildeUrl);
          detaljCache.set(id, html);
          detalj.innerHTML = html;
        } catch (err) {
          console.error('detalj-fetch feilet', err);
          detalj.innerHTML = `<div class="lupen-error" style="margin:0;">Kunne ikke hente detaljer akkurat nå. <a href="${lupenState.linkForId.get(id) || '#'}" target="_blank" rel="noopener">Åpne på stortinget.no</a></div>`;
        }
      });
    });
  }

  // Delt state for å finne stortinget.no-lenken per id når vi renderer detaljer
  const lupenState = { linkForId: new Map() };

  containers.forEach((container) => {
    const slug = container.getAttribute('data-frp-lupen');
    if (!slug) return;
    const url = `/api/tema?slug=${encodeURIComponent(slug)}&limit_nyheter=6&limit_stortinget=5`;
    fetch(url, { cache: 'default' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        // Registrer kilde-URL for hvert stortinget-item slik at detalj-
        // renderingen kan lenke til den offisielle siden.
        for (const s of (data.stortinget || [])) {
          if (s && s.id != null && s.link) {
            lupenState.linkForId.set(String(s.id), s.link);
          }
        }
        container.innerHTML =
          renderProgram(data.program) +
          renderNyheter(data.nyheter) +
          renderStortinget(data.stortinget, data.stortingetSesjon);
        // Bind toggler for stortinget-kortene i denne containeren.
        bindStortingToggler(container);
      })
      .catch((err) => {
        container.innerHTML = `<div class="lupen-error">Kunne ikke laste Frp-observasjon akkurat nå. Prøv igjen senere.</div>`;
        console.error('lupen fetch failed', err);
      });
  });
})();
