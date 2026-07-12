// Sentrale utredninger og høringer per tema
// Rendret som statisk HTML på hver temaside via inject_utredninger.py
// URL-er verifisert til å peke på faktiske dokumenter

const UTREDNINGER = {
  skatt: {
    intro: 'Sentrale skatteutredninger og høringer som er lagt til grunn for norsk skattepolitikk. Frp har i praksis avvist alle helhetlige skattereformer og valgt symbolske skattekutt i stedet.',
    items: [
      {
        tittel: 'NOU 2022:20 — Et helhetlig skattesystem',
        undertittel: 'Skatteutvalget (Torvik-utvalget)',
        aar: '2022',
        type: 'NOU',
        beskrivelse: 'Bred gjennomgang av det norske skattesystemet. Foreslo å styrke skatt på bolig, arv og grunnrente, og senke skatt på arbeid. Frp avviste utvalget nærmest samlet, mens Ap-regjeringen har gradvis innført deler.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2022-20/id2951826/',
      },
      {
        tittel: 'Grunnrenteskatt på havbruk',
        undertittel: 'Prop. 78 LS (2022–2023) og etterfølgende høringer',
        aar: '2023–',
        type: 'Reform',
        beskrivelse: 'Grunnrenteskatten på laks ble innført av Ap-regjeringen. Frp gikk imot og vil fjerne den — noe som ville gitt milliardkutt til de største havbrukskonsernene.',
        url: 'https://www.regjeringen.no/no/dokumenter/prop.-78-ls-20222023/id2967786/',
      },
      {
        tittel: 'Formuesskatten — Torvik-utvalgets vurdering',
        undertittel: 'Kapittel om skatt på formue og bolig',
        aar: '2022',
        type: 'Fagvurdering',
        beskrivelse: 'Utvalget anbefalte å beholde og forbedre formuesskatten, og gradvis øke boligbeskatningen. Frp foreslår motsatt: å fjerne formuesskatten helt, noe som ville gitt de 400 rikeste over 10 mrd i skattekutt.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2022-20/id2951826/',
      },
    ],
  },

  velferd: {
    intro: 'Sentrale utredninger som setter rammene for velferdsstatens utvikling. Frps politikk om «privat før offentlig» er i strid med flere av disse.',
    items: [
      {
        tittel: 'NOU 2023:4 — Tid for handling',
        undertittel: 'Helsepersonellkommisjonen',
        aar: '2023',
        type: 'NOU',
        beskrivelse: 'Advarer mot fortsatt privatisering og mener det er «ingen mulighet» for å løse eldrebølgen ved å bygge ut mer helse. Krever prioritering og styrking av offentlig helsetjeneste — motsatt av Frps program.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2023-4/id2961552/',
      },
      {
        tittel: 'Nasjonal helse- og samhandlingsplan 2024–2027',
        undertittel: 'Meld. St. 9 (2023–2024)',
        aar: '2024',
        type: 'Stortingsmelding',
        beskrivelse: 'Regjeringens plan for å styrke fastlegeordningen, sykehusene og kommunehelsetjenesten. Frp vil derimot åpne for mer kommersiell drift og fritt behandlingsvalg, noe fagmiljøene mener drenerer det offentlige.',
        url: 'https://www.regjeringen.no/no/dokumenter/meld.-st.-9-20232024/id3027594/',
      },
      {
        tittel: 'NOU 2020:16 — Levekår i byene',
        undertittel: 'Områdesatsingsutvalget',
        aar: '2020',
        type: 'NOU',
        beskrivelse: 'Dokumenterer at kutt i sosiale ordninger og AAP rammer barnefamilier hardest. Frps program om strammere AAP-vilkår og lavere trygdeytelser vil forsterke disse levekårs­forskjellene.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2020-16/id2788410/',
      },
    ],
  },

  arbeidsliv: {
    intro: 'Sentrale utredninger om arbeidslivet og trepartssamarbeidet. Ap-regjeringen har fulgt opp med lovendringer; Frp vil reversere flere av dem.',
    items: [
      {
        tittel: 'NOU 2021:9 — Den norske modellen og fremtidens arbeidsliv',
        undertittel: 'Fougner-utvalget',
        aar: '2021',
        type: 'NOU',
        beskrivelse: 'Grunnleggende utredning om løsarbeid, plattformøkonomi og innleie. Danner grunnlaget for Ap-regjeringens innstramminger i innleieregelverket fra 2023. Frp vil myke opp reglene igjen.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2021-9/id2862822/',
      },
      {
        tittel: 'Innleiereformen 2023',
        undertittel: 'Prop. 131 L (2021–2022) og forskrift',
        aar: '2023',
        type: 'Reform',
        beskrivelse: 'Strengere regler for innleie fra bemanningsforetak — særlig i Oslo/Viken-området innen byggenæringen. Frp har lovet å fjerne begrensningene, noe LO og fagforeningene advarer mot.',
        url: 'https://www.regjeringen.no/no/dokumenter/prop.-131-l-20212022/id2921815/',
      },
      {
        tittel: 'Norgesmodellen mot arbeidslivskriminalitet',
        undertittel: 'Handlingsplan mot sosial dumping og a-krim',
        aar: '2024',
        type: 'Handlingsplan',
        beskrivelse: 'Krav om lærlinger, faste ansettelser og maks to underleverandørledd ved offentlige innkjøp. Frp vil svekke disse kravene under merkelappen «byråkratikutt».',
        url: 'https://www.regjeringen.no/no/tema/arbeidsliv/arbeidsmiljo-og-sikkerhet/innsiktsartikler/a-krim/norgesmodellen/id2988082/',
      },
    ],
  },

  klima: {
    intro: 'Sentrale klimautredninger som setter rammene for norsk klimapolitikk. Frp er det eneste stortingspartiet som fortsatt tviler på hoveddelen av klimavitenskapen og som vil kutte klimapolitiske tiltak.',
    items: [
      {
        tittel: 'NOU 2023:25 — Omstilling til lavutslipp',
        undertittel: 'Klimautvalget 2050',
        aar: '2023',
        type: 'NOU',
        beskrivelse: 'Utvalgets hovedbudskap: Norge må kutte utslippene 55 % innen 2030 og bli et lavutslippssamfunn innen 2050. Frps program bryter med dette — de vil redusere klimatiltak, avvikle CO₂-avgifter og fortsette petroleumsvirksomhet uten begrensning.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2023-25/id3006059/',
      },
      {
        tittel: 'Meld. St. 26 (2022–2023) — Klimastatus og -plan',
        undertittel: 'Regjeringens klimahandlingsplan',
        aar: '2023',
        type: 'Stortingsmelding',
        beskrivelse: 'Detaljert plan for å nå Norges klimamål under Parisavtalen. Inneholder virkemiddelbruk for CO₂-avgift, elbilfordeler og karbonfangst. Frp vil reversere hoveddelen.',
        url: 'https://www.regjeringen.no/no/dokumenter/meld.-st.-26-20222023/id2985349/',
      },
      {
        tittel: 'Energikommisjonens rapport — Mer av alt, raskere',
        undertittel: 'NOU 2023:3',
        aar: '2023',
        type: 'NOU',
        beskrivelse: 'Bred kartlegging av Norges kraftbalanse. Anbefaler massiv utbygging av havvind, sol, energisparing og oppgradert vannkraft. Frp har programfestet motstand mot havvind på steder der det er reelt kraftpotensial.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2023-3/id2961311/',
      },
    ],
  },

  innvandring: {
    intro: 'Sentrale utredninger om innvandring, integrering og asylpolitikk. Frps politikk baserer seg i stor grad på retorikk framfor kunnskapsgrunnlaget i disse.',
    items: [
      {
        tittel: 'NOU 2017:2 — Integrasjon og tillit',
        undertittel: 'Brochmann II-utvalget',
        aar: '2017',
        type: 'NOU',
        beskrivelse: 'Fortsatt sentral i norsk integreringspolitikk. Advarer mot både naiv åpenhet og symbolske innstramminger uten forankring i fakta. Frps program om drastiske innstramminger går utenfor utvalgets anbefalinger.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2017-2/id2536701/',
      },
      {
        tittel: 'Integrasjonsloven fra 2020 — evalueringer',
        undertittel: 'Forskningsrapporter fra Fafo og OsloMet',
        aar: '2023–',
        type: 'Evaluering',
        beskrivelse: 'Norsk integreringspolitikk er blant Europas mest effektive når det gjelder arbeidsdeltakelse. 70 % av flyktninger fra 2015 er nå i jobb eller utdanning. Frps krisebilde stemmer ikke med data.',
        url: 'https://www.regjeringen.no/no/tema/innvandring-og-integrering/verktoy/integreringsloven/id2792978/',
      },
      {
        tittel: 'Ekspertutvalg for ukrainske flyktninger',
        undertittel: 'Rapport 2024',
        aar: '2024',
        type: 'Rapport',
        beskrivelse: 'Nærmere halvparten av ukrainerne i Norge er i jobb — mye høyere andel enn Frps retorikk antyder. Utvalget anbefaler fortsatt kompetansekartlegging og norskopplæring, ikke innstramming.',
        url: 'https://www.regjeringen.no/no/aktuelt/narmere-halvparten-av-ukrainerne-er-i-jobb/id3111244/',
      },
    ],
  },

  justis: {
    intro: 'Sentrale utredninger om justissektoren. Frps «hard mot krim»-retorikk står ofte i motsetning til det fagmiljøene faktisk anbefaler.',
    items: [
      {
        tittel: 'NOU 2023:31 — Bedre beskyttelse av barns utvikling',
        undertittel: 'Barnevoldsutvalget II',
        aar: '2023',
        type: 'NOU',
        beskrivelse: 'Anbefaler betydelig styrking av forebygging, ikke bare strengere straffer. Frp har prioritert høyere strafferammer — noe faglige eksperter mener har begrenset effekt uten forebygging.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2023-31/id3013571/',
      },
      {
        tittel: 'NOU 2020:16 — Politiets arbeid i mangfoldige samfunn',
        undertittel: 'Politianalysen',
        aar: '2020',
        type: 'NOU',
        beskrivelse: 'Grunnlag for politireformen og nærpolitistrategien. Anbefaler flere lokale politipatruljer og bedre forebygging. Frp har vaklet mellom «mer synlig politi» og kutt i politiets driftsbudsjett.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2020-16/id2788410/',
      },
      {
        tittel: 'Totalberedskapskommisjonen — NOU 2023:17',
        undertittel: 'Nå er det alvor',
        aar: '2023',
        type: 'NOU',
        beskrivelse: 'Grunnleggende gjennomgang av Norges beredskap etter pandemi og krig i Europa. Krever storsatsing på sivil beredskap. Frps alt.budsjett kutter i deler av dette.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2023-17/id2985683/',
      },
    ],
  },

  distrikt: {
    intro: 'Sentrale utredninger om distrikts- og kommunepolitikk. Frps sentraliseringspolitikk (redusert bostøtte, kutt i tilskudd) står i motsetning til kunnskapsgrunnlaget.',
    items: [
      {
        tittel: 'NOU 2020:15 — Det handler om Norge',
        undertittel: 'Demografiutvalget',
        aar: '2020',
        type: 'NOU',
        beskrivelse: 'Framhever at aldringen rammer distriktene først og hardest. Anbefaler styrking av desentraliserte tjenester og distriktspolitikk. Frps program om kommunesammenslåing går motsatt vei.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2020-15/id2788483/',
      },
      {
        tittel: 'Inntektssystemutvalget — NOU 2022:10',
        undertittel: 'Inntektssystemet for kommunene',
        aar: '2022',
        type: 'NOU',
        beskrivelse: 'Grunnlag for hvordan skatteinntekter og rammetilskudd fordeles mellom kommunene. Anbefaler forsterket distriktsvekting. Frps alt.budsjett kutter i distriktstilskuddet.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2022-10/id2924789/',
      },
      {
        tittel: 'Landbruksmelding 2024',
        undertittel: 'Meld. St. 11 (2023–2024)',
        aar: '2024',
        type: 'Stortingsmelding',
        beskrivelse: 'Regjeringens plan for økt selvforsyning og styrking av norsk landbruk. Krever økte overføringer. Frp vil derimot fjerne importvern og kutte landbruksstøtten — noe som vil legge ned små og mellomstore bruk.',
        url: 'https://www.regjeringen.no/no/dokumenter/meld.-st.-11-20232024/id3028564/',
      },
    ],
  },

  samferdsel: {
    intro: 'Sentrale utredninger om samferdselspolitikk. Frps prioritering av motorveier på bekostning av tog og kollektiv går imot fagmiljøenes tilrådninger.',
    items: [
      {
        tittel: 'Nasjonal transportplan 2025–2036',
        undertittel: 'Meld. St. 14 (2023–2024)',
        aar: '2024',
        type: 'Stortingsmelding',
        beskrivelse: 'Prioriterer vedlikehold, jernbane og trafikksikkerhet før store nye motorveiprosjekter. Frps program vil derimot åpne for flere firefeltsveier og reversere prioriteringen — noe fagetatene har rådet mot.',
        url: 'https://www.regjeringen.no/no/dokumenter/meld.-st.-14-20232024/id3033168/',
      },
      {
        tittel: 'Nullvisjonen for trafikkdød',
        undertittel: 'Handlingsplan 2022–2025',
        aar: '2022',
        type: 'Handlingsplan',
        beskrivelse: 'Bygger på forskning som viser at fartsgrenser, ATK og trafikksikkerhetstiltak reduserer dødsulykker mest effektivt. Frp vil heve fartsgrenser og redusere fotoboksene — noe Statens vegvesen har advart mot.',
        url: 'https://www.regjeringen.no/no/tema/transport-og-kommunikasjon/veg_og_vegtrafikk/nullvisjonen/id2076944/',
      },
      {
        tittel: 'NOU 2019:22 — Fra statussymbol til allemannseie',
        undertittel: 'Bilavgiftsutvalget',
        aar: '2019',
        type: 'NOU',
        beskrivelse: 'Grunnleggende utredning om omlegging av bilavgiftssystemet. Anbefaler gradvis overgang til utslippsbaserte og bruksbaserte avgifter. Frps program om å fjerne veibruksavgift og engangsavgift bryter med utvalgets anbefalinger.',
        url: 'https://www.regjeringen.no/no/dokumenter/nou-2019-22/id2678318/',
      },
    ],
  },
};

// CommonJS eksport hvis brukt i Node, ellers globalt
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UTREDNINGER;
  module.exports.UTREDNINGER = UTREDNINGER;
}
