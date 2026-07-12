// ES6-versjon av data/frp-program.js — INLINE for å unngå createRequire
// (Vercel ESM→CJS-transpilering håndterer ikke createRequire konsistent).
// Holdes i sync manuelt med data/frp-program.js.

const FRP_PROGRAM = {
  skatt: {
    programpunkter: [
      {
        tekst: 'Fjerne formuesskatten helt (i alt. budsjett 2026: senke sats til 0,8 % og heve innslagspunkt fra 1,9 til 3 mill.).',
        kilde: 'Partiprogram 2025-2029 + alt. budsjett 2026',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Fjerne grunnrenteskatten på havbruk i sin helhet.',
        kilde: 'Vedtatt resolusjon landsmøtet 2025',
        kilde_url: 'https://www.frp.no/files/Landsmote/2025/Vedtatte-resolusjoner-04.05.25.pdf',
      },
      {
        tekst: 'Fjerne fagforeningsfradraget — gir fagorganiserte ca. 1 000 kr mindre i skattelette.',
        kilde: 'Alt. budsjett 2026 (bekreftet av Frp selv)',
        kilde_url: 'https://frifagbevegelse.no/nyheter/frp-gir-fagorganiserte-1000-kroner-mindre-i-skattelette-6.158.1178758.776dd39a08',
      },
      {
        tekst: 'Halvere moms på mat (fra 15 til 7,5 %) — koster ca. 9 mrd.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf',
      },
      {
        tekst: 'Halvere veibruksavgiften på drivstoff.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf',
      },
      {
        tekst: 'Samlede skatte- og avgiftslettelser: ca. 50,7 mrd. — hvorav 32,7 mrd. i formues- og inntektsskatt.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://frifagbevegelse.no/nyheter/frp-gir-fagorganiserte-1000-kroner-mindre-i-skattelette-6.158.1178758.776dd39a08',
      },
    ],
    inndekning: 'Frp henter inn ca. 2,5 mrd. ekstra fra oljefondet, kutter 15 mrd. i bistand, 5–7,5 mrd. i integrering/flyktninger, og krever økte utbytter fra Statkraft/Argentum/Folketrygdfondet.',
    motargument: 'Formuesskatt-kuttet gir 400 rikeste over 10 mrd. i lettelse (Torvik-utvalget NOU 2022:20 anbefalte motsatt). Fagforeningsfradrag-kuttet rammer 1,9 mill. fagorganiserte for at bl.a. milliardærer skal betale mindre skatt.',
  },

  velferd: {
    programpunkter: [
      {
        tekst: 'Bygge 4 000 heldøgns omsorgsplasser hvert år 2025-2029 (3 000 netto vekst), med reduserte arealkrav per beboer for å bygge "raskere og billigere".',
        kilde: 'Vedtatt resolusjon landsmøtet 2025',
        kilde_url: 'https://www.frp.no/files/Landsmote/2025/Vedtatte-resolusjoner-04.05.25.pdf',
      },
      {
        tekst: 'Fritt brukervalg mellom offentlige og private helse- og omsorgstjenester, betalt av staten.',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Utrede "tidskontoordning" for sykepenger — kortere ordinær varighet, mulighet for utvidelse opptil 2 år ved lav sykemeldingsgrad.',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Vri velferdsytelser fra kontant til skattefradrag.',
        kilde: 'Partiprogram (Arbeid og velferd)',
        kilde_url: 'https://www.frp.no/var-politikk/arbeid-og-velferd/velferd',
      },
      {
        tekst: 'Programfestet privatisering av fengsler, fangetransport, NRK og Vinmonopolet.',
        kilde: 'Programutkast 2025-2029 (dokumentert av Fagforbundet)',
        kilde_url: 'https://www.fagforbundet.no/contentassets/46834bf84e1a4613a18784cab0526ab3/rep-sak-3-vedlegg---mye-a-miste---hefte-fra-agenda.pdf',
      },
      {
        tekst: 'Øke minstepensjonen med 15 000 kr/år (kostnad: 1 mrd.).',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf',
      },
    ],
    motargument: 'Helsepersonellkommisjonen (NOU 2023:4) advarer eksplisitt mot mer privatisering av helse — det finnes "ingen mulighet" for å løse eldrebølgen ved å bygge ut mer. Redusert arealkrav per sykehjemsplass strider mot faglige anbefalinger.',
  },

  arbeidsliv: {
    programpunkter: [
      {
        tekst: 'Fjerne fagforeningsfradraget helt.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://frifagbevegelse.no/nyheter/frp-gir-fagorganiserte-1000-kroner-mindre-i-skattelette-6.158.1178758.776dd39a08',
      },
      {
        tekst: 'Differensiere arbeidsgiveravgiften geografisk (mer markedsorientert næringspolitikk).',
        kilde: 'Programutvalgets forslag 2025-2029',
        kilde_url: 'https://dinbedrift.no/frp-vil-redusere-skatter-byrakrati-og-statens-rolle/',
      },
      {
        tekst: 'Målsetting: arbeidsinntekt opp til 300 000 kr fritatt inntektsskatt (langsiktig mål fra landsmøteresolusjon).',
        kilde: 'Vedtatt resolusjon landsmøtet 2025',
        kilde_url: 'https://www.frp.no/files/Landsmote/2025/Vedtatte-resolusjoner-04.05.25.pdf',
      },
    ],
    motargument: 'Fjerning av fagforeningsfradraget svekker den norske modellen med sterke parter — samtidig som partiet ellers roser modellens produktivitetsgevinster.',
  },

  klima: {
    programpunkter: [
      {
        tekst: 'Ingen skal betale mer enn 50 øre/kWh for strøm inkl. moms så lenge prisene er "unormalt høye".',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf',
      },
      {
        tekst: 'Nei til enhver økning i CO₂-avgiftene.',
        kilde: 'Alt. budsjett 2026 (Innst. 2 S)',
        kilde_url: 'https://www.stortinget.no/no/Saker-og-publikasjoner/Publikasjoner/Innstillinger/Stortinget/2025-2026/inns-202526-002s/',
      },
      {
        tekst: 'Kutte 1,7 mrd. i grønn industrifinansiering, 1,5 mrd. til Enova, og 2,1 mrd. fra Langskip (CCS).',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
      {
        tekst: 'Stanse elektrifisering av Melkøya og norsk sokkel med kraft fra land.',
        kilde: 'Vedtatt resolusjon landsmøtet 2025 (nr. 15)',
        kilde_url: 'https://www.frp.no/files/Landsmote/2025/Vedtatte-resolusjoner-04.05.25.pdf',
      },
      {
        tekst: 'Bygge gasskraftverk i Norge.',
        kilde: 'Vedtatt resolusjon landsmøtet 2025 (nr. 14)',
        kilde_url: 'https://www.frp.no/files/Landsmote/2025/Vedtatte-resolusjoner-04.05.25.pdf',
      },
      {
        tekst: 'Fortsatt full satsning på oljeindustrien, færre klimakrav.',
        kilde: 'Programutkast 2025-2029',
        kilde_url: 'https://www.fagforbundet.no/contentassets/46834bf84e1a4613a18784cab0526ab3/rep-sak-3-vedlegg---mye-a-miste---hefte-fra-agenda.pdf',
      },
    ],
    motargument: 'Norge har juridisk bindende klimamål mot 2030 (55 %) og 2050 (netto null). Frps kutt i Enova + CO₂-avgift-frys + gasskraftverk-satsing er inkompatibelt med disse forpliktelsene og klimaloven.',
  },

  innvandring: {
    programpunkter: [
      {
        tekst: 'Opprette asylsentre utenfor Europa der ALLE asylsøkere sendes for behandling.',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Stoppe muligheten til å søke asyl ved norsk grense.',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Trekke Norge ut av FNs migrasjonsavtale.',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Stanse mottak av kvoteflyktninger inntil integreringen "er under kontroll".',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Bosettingsstopp i kommuner/bydeler der innvandrere utgjør >15 % av befolkningen.',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Bruke bistandsmidler til å inngå tredjelandsavtaler for asylsentre.',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Kutt 7,5 mrd. i bosetting/ytelser til flyktninger + 5 mrd. i integreringstilskudd + 360 mill. i norsk-/samfunnskunnskap.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
    ],
    motargument: 'Å sende alle asylsøkere ut av Europa bryter med Flyktningkonvensjonen (som Norge er forpliktet av). Storbritannias Rwanda-modell — som er inspirasjonen — kollapset juridisk og økonomisk. Bosettingsstopp basert på befolknings-prosent er også menneskerettslig problematisk.',
  },

  justis: {
    programpunkter: [
      {
        tekst: 'Livsvarig fengsel for de farligste (endring av strafferammer).',
        kilde: 'Vedtatt resolusjon landsmøtet 2025 (nr. 10)',
        kilde_url: 'https://www.frp.no/files/Landsmote/2025/Vedtatte-resolusjoner-04.05.25.pdf',
      },
      {
        tekst: 'Øke grunnbemanning i politidistriktene med 1,2 mrd.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
      {
        tekst: '250 mill. mot ungdoms- og gjengkriminalitet, 200 mill. til kriminalomsorg (bl.a. flere fengselsplasser for unge lovbrytere).',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
      {
        tekst: 'Privatisering av fengsler og fangetransport (programfestet).',
        kilde: 'Programutkast 2025-2029',
        kilde_url: 'https://www.fagforbundet.no/contentassets/46834bf84e1a4613a18784cab0526ab3/rep-sak-3-vedlegg---mye-a-miste---hefte-fra-agenda.pdf',
      },
      {
        tekst: 'Utvidet bruk av omvendt voldsalarm; strengere brudd på besøksforbud; økte strafferammer for vold/trusler.',
        kilde: 'Vedtatt resolusjon landsmøtet 2025',
        kilde_url: 'https://www.frp.no/files/Landsmote/2025/Vedtatte-resolusjoner-04.05.25.pdf',
      },
    ],
    motargument: 'Forskning viser at strengere straff ikke reduserer kriminalitet — forebygging gjør det. Privatisering av fengsler har i USA og UK gitt økte kostnader og dårligere soningsforhold.',
  },

  distrikt: {
    programpunkter: [
      {
        tekst: 'Legge ned fylkeskommunen og fordele oppgavene mellom stat, kommune og private.',
        kilde: 'Partiprogram 2025-2029',
        kilde_url: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
      },
      {
        tekst: 'Fjerne statsforvalteren.',
        kilde: 'Programutkast 2025-2029',
        kilde_url: 'https://www.fagforbundet.no/contentassets/46834bf84e1a4613a18784cab0526ab3/rep-sak-3-vedlegg---mye-a-miste---hefte-fra-agenda.pdf',
      },
      {
        tekst: 'Avskaffe boplikten.',
        kilde: 'Programutkast 2025-2029',
        kilde_url: 'https://www.fagforbundet.no/contentassets/46834bf84e1a4613a18784cab0526ab3/rep-sak-3-vedlegg---mye-a-miste---hefte-fra-agenda.pdf',
      },
      {
        tekst: 'Fjerne kommunens rett til å finansiere velferd gjennom eiendomsskatt.',
        kilde: 'Programutkast 2025-2029',
        kilde_url: 'https://www.fagforbundet.no/contentassets/46834bf84e1a4613a18784cab0526ab3/rep-sak-3-vedlegg---mye-a-miste---hefte-fra-agenda.pdf',
      },
      {
        tekst: 'Kutt 2 mrd. til fylkeskommunen i alt. budsjett 2026.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.fagforbundet.no/contentassets/46834bf84e1a4613a18784cab0526ab3/rep-sak-3-vedlegg---mye-a-miste---hefte-fra-agenda.pdf',
      },
    ],
    motargument: 'Frp har ikke lenger noe eget distriktskapittel i programmet — kombinasjonen av å avskaffe boplikt, fjerne eiendomsskatt-inntekter og legge ned fylkeskommunen fjerner sentrale distriktsverktøy. 2 mrd.-kuttet svekker fylkesveier, videregående skoler og kollektivtransport.',
  },

  samferdsel: {
    programpunkter: [
      {
        tekst: 'Fjerne bompenger.',
        kilde: 'Partiprogram 2025-2029 (hovedsak siden partiets stiftelse)',
        kilde_url: 'https://www.frp.no/om-frp',
      },
      {
        tekst: 'Halvere veibruksavgiften på drivstoff.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf',
      },
      {
        tekst: '6,7 mrd. i samferdselssatsning (vei først, kollektiv sekundært).',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
      {
        tekst: 'Fjerne flypassasjeravgiften; reversere endringer i tobakkskvote og tillate igjen vin mot tobakk på taxfree.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
    ],
    motargument: 'Fjerning av bompenger uten ny finansiering vil enten kreve betydelig økt oljepengebruk eller stanse veibygging. Frp valgte selv oljepenger — 15 mrd. ekstra i alt.budsjett 2026.',
  },

  budsjett: {
    programpunkter: [
      {
        tekst: 'Øke oljepengebruken med 15 mrd. utover regjeringens forslag (2,5 mrd. mer enn saldert; 15 mrd. iht. Altinget).',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
      {
        tekst: 'Kutte 15 mrd. i bistand.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
      {
        tekst: 'Kutte 5,7 mrd. fra kirke og kultur.',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
      {
        tekst: 'Hente inn 3,2 mrd. via "samfunnsøkonomisk effekt av redusert innvandring" (kalkulatorisk anslag).',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten',
      },
      {
        tekst: 'Kontinuerlig ABE-reform i alle etater (unntatt sykehus, operativt politi og Forsvaret).',
        kilde: 'Alt. budsjett 2026',
        kilde_url: 'https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf',
      },
    ],
    motargument: 'Handlingsregelen (3 %) er brutt i utgangspunktet — Frps 15 mrd. ekstra oljepenger driver renten og inflasjonen opp. "Samfunnsøkonomisk effekt av innvandring" som inntektspost er ikke reell budsjettinndekning, men et regneark-anslag.',
  },
};

export { FRP_PROGRAM };
