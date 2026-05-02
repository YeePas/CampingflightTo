import { PackItem, Tip } from './types';

export const DEFAULT_ITEMS: PackItem[] = [
  // Kleding
  { id: 'c1', name: 'Wandelschoenen', category: 'Kleding', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'c2', name: 'Regenjas', category: 'Kleding', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'c3', name: 'Thermokleding (ondershirts)', category: 'Kleding', tripTypes: ['weekend', 'week'], mountains: true, kids: false },
  { id: 'c4', name: 'Fleece vest', category: 'Kleding', tripTypes: ['weekend', 'week'], mountains: true, kids: false },
  { id: 'c5', name: 'Zonnebril', category: 'Kleding', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'c6', name: 'Wandelsokken (extra)', category: 'Kleding', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 'c7', name: 'Zwemkleding', category: 'Kleding', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 'c8', name: 'Pet / zonnehoed', category: 'Kleding', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'c9', name: 'Handschoenen', category: 'Kleding', tripTypes: ['weekend', 'week'], mountains: true, kids: false },
  { id: 'c10', name: 'Muts', category: 'Kleding', tripTypes: ['weekend', 'week'], mountains: true, kids: false },

  // Slaap
  { id: 's1', name: 'Tent', category: 'Slaap', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 's2', name: 'Slaapzak', category: 'Slaap', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 's3', name: 'Slaapmat / luchtbed', category: 'Slaap', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 's4', name: 'Kussen', category: 'Slaap', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 's5', name: 'Oordopjes', category: 'Slaap', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 's6', name: 'Slaapzak kinderen', category: 'Slaap', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: true },

  // Keuken & Eten
  { id: 'k1', name: 'Campingkooktoestel', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'k2', name: 'Gaspatronen (extra)', category: 'Keuken & Eten', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 'k3', name: 'Pannen / kookset', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'k4', name: 'Bestek & borden', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'k5', name: 'Mok / thermosbeker', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'k6', name: 'Waterfles (per persoon)', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'k7', name: 'Waterfilter / zuiveringstabletten', category: 'Keuken & Eten', tripTypes: ['week'], mountains: true, kids: false },
  { id: 'k8', name: 'Afwasbak & zeep', category: 'Keuken & Eten', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 'k9', name: 'Aansteker / lucifers', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'k10', name: 'Koelbox / koeltas', category: 'Keuken & Eten', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 'k11', name: 'Snacks voor onderweg', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'k12', name: 'Kindersnacks extra', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: true },
  { id: 'k13', name: 'Koffie / thee', category: 'Keuken & Eten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'k14', name: 'Vuilniszakken', category: 'Keuken & Eten', tripTypes: ['weekend', 'week'], mountains: false, kids: false },

  // Hygiëne
  { id: 'h1', name: 'Tandenborstel & tandpasta', category: 'Hygiëne', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'h2', name: 'Zeep / douche gel', category: 'Hygiëne', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 'h3', name: 'Handdoeken (snel-droog)', category: 'Hygiëne', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 'h4', name: 'Toiletpapier', category: 'Hygiëne', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'h5', name: 'Zonnebrandcrème', category: 'Hygiëne', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'h6', name: 'Insectenwerend middel', category: 'Hygiëne', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'h7', name: 'Nat doekjes', category: 'Hygiëne', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'h8', name: 'Luiers / zindelijkheidsspullen', category: 'Hygiëne', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: true },

  // Kinderen
  { id: 'ki1', name: 'Kinderzonnebrandcrème (hoge factor)', category: 'Kinderen', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: true },
  { id: 'ki2', name: 'Rugzak voor kinderen', category: 'Kinderen', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: true },
  { id: 'ki3', name: 'Draagzak / kinderkraan', category: 'Kinderen', tripTypes: ['dag', 'weekend', 'week'], mountains: true, kids: true },
  { id: 'ki4', name: 'Speelgoed (klein & licht)', category: 'Kinderen', tripTypes: ['weekend', 'week'], mountains: false, kids: true },
  { id: 'ki5', name: 'Geneesmiddelen kinderen (paracetamol etc.)', category: 'Kinderen', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: true },
  { id: 'ki6', name: 'Verzorgingscrème / wondjes', category: 'Kinderen', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: true },
  { id: 'ki7', name: 'Regen- en warmkleding kinderen', category: 'Kinderen', tripTypes: ['weekend', 'week'], mountains: true, kids: true },
  { id: 'ki8', name: 'Boekjes / spelletjes voor avond', category: 'Kinderen', tripTypes: ['weekend', 'week'], mountains: false, kids: true },

  // EHBO
  { id: 'e1', name: 'EHBO-kit', category: 'EHBO', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'e2', name: 'Pijnstillers', category: 'EHBO', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'e3', name: 'Pleister & verband', category: 'EHBO', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'e4', name: 'Teken-verwijderaar', category: 'EHBO', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'e5', name: 'Nooddeken (folie)', category: 'EHBO', tripTypes: ['weekend', 'week'], mountains: true, kids: false },
  { id: 'e6', name: 'Antidiarreemiddel', category: 'EHBO', tripTypes: ['week'], mountains: false, kids: false },

  // Navigatie
  { id: 'n1', name: 'Kaart van het gebied', category: 'Navigatie & Kaarten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'n2', name: 'Kompas', category: 'Navigatie & Kaarten', tripTypes: ['weekend', 'week'], mountains: true, kids: false },
  { id: 'n3', name: 'GPS / wandel-app (offline kaarten)', category: 'Navigatie & Kaarten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'n4', name: 'Hoofdlamp + reservebatterijen', category: 'Navigatie & Kaarten', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },

  // Gereedschap
  { id: 'g1', name: 'Zakmes / multitool', category: 'Gereedschap', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'g2', name: 'Touw / paracord', category: 'Gereedschap', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'g3', name: 'Haringen & hamer', category: 'Gereedschap', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'g4', name: 'Duct tape', category: 'Gereedschap', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
  { id: 'g5', name: 'Powerbank', category: 'Gereedschap', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'g6', name: 'Klim-/wandelstokken', category: 'Gereedschap', tripTypes: ['dag', 'weekend', 'week'], mountains: true, kids: false },
  { id: 'g7', name: 'Pikhouweel / ijsbijl', category: 'Bergen', tripTypes: ['weekend', 'week'], mountains: true, kids: false },

  // Overig
  { id: 'o1', name: 'Identiteitsbewijs / paspoort', category: 'Overig', tripTypes: ['week'], mountains: false, kids: false },
  { id: 'o2', name: 'Verzekeringspas', category: 'Overig', tripTypes: ['week'], mountains: false, kids: false },
  { id: 'o3', name: 'Geld / creditcard', category: 'Overig', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'o4', name: 'Telefoonoplader + adapter', category: 'Overig', tripTypes: ['dag', 'weekend', 'week'], mountains: false, kids: false },
  { id: 'o5', name: 'Campinggids / reserveringsbevestiging', category: 'Overig', tripTypes: ['weekend', 'week'], mountains: false, kids: false },
];

export const DEFAULT_TIPS: Tip[] = [
  {
    id: 't1',
    title: 'Paalsteek',
    category: 'Knopen',
    content: 'De paalsteek maakt een vaste lus die niet strakker trekt onder belasting.\n\n1. Maak een kleine lus in het touw (heen gaan over het staande part)\n2. Steek het losse eind omhoog door de lus\n3. Ga achter het staande part langs\n4. Steek het losse eind terug door de lus naar beneden\n5. Trek stevig aan\n\nGebruik: tent vastzetten, reddingslijn, aan paal binden.',
  },
  {
    id: 't2',
    title: 'Schootsteek',
    category: 'Knopen',
    content: 'Verbindt twee touwen van verschillende dikte.\n\n1. Maak een bocht in het dikste touw\n2. Steek het dunne touw door de bocht van onderaf\n3. Ga achter beide einden van de bocht langs\n4. Steek terug onder zichzelf door\n5. Trek stevig aan\n\nGebruik: twee touwen aan elkaar, tarp spannen.',
  },
  {
    id: 't3',
    title: 'Prusik',
    category: 'Knopen',
    content: 'Glijdende klauwerknoop voor aan een touw.\n\n1. Neem een stuk dunner touw, maak er een lus van (vissersknoop)\n2. Wikkel de lus 3x om het staande touw\n3. Haal de lus door zichzelf\n4. Trek strak\n\nAangespannen: glijdt niet. Ontspannen: schuift langs het touw.\n\nGebruik: veiligheidsknoop bij klimmen, zelf-reddingsituaties.',
  },
  {
    id: 't4',
    title: 'Eten koken zonder stroom',
    category: 'Koken',
    content: 'Thermosgaar koken:\n1. Breng het water met bijv. pasta of rijst aan de kook\n2. Kook 2 minuten\n3. Stop de pan in een slaapzak of wikkel in een deken\n4. Laat 20-30 minuten staan\n5. Klaar! Bespaart veel gas.\n\nTip: werkt perfect op hoogte waar kookpunt lager ligt.',
  },
  {
    id: 't5',
    title: 'Hoogteproblemen voorkomen',
    category: 'Bergen',
    content: 'Boven 2500m:\n• Stijg niet meer dan 300-500m per dag in slaaphoogte\n• Drink veel water (3-4 liter per dag)\n• Eet koolhydraatrijk\n• Vermijd alcohol de eerste dagen\n• Bij hoofdpijn/misselijkheid: daal af en rust\n• Regel: "klimmen hoog, slapen laag"',
  },
  {
    id: 't6',
    title: 'Kinderen motiveren op lange wandelingen',
    category: 'Kinderen',
    content: 'Tips om kinderen wandelend te houden:\n• Geef ze een eigen kleine rugzak (met iets leuks erin)\n• Zoek naar dieren, insecten, paddenstoelen\n• Tellen: hoeveel bruggen, hekken, koeien?\n• Beloningssnoep op de top of halverwege\n• Splits de route in kleine stukjes: "nog 10 minuten dan stoppen we"\n• Laat ze de kaart vasthouden',
  },
  {
    id: 't7',
    title: 'Tarp spannen in regen',
    category: 'Algemeen',
    content: 'Snel afdak met tarp:\n1. Zoek twee bomen op ~4m afstand\n2. Span een lijn tussen de bomen op ooghoogte\n3. Gooi de tarp over de lijn (asymmetrisch: meer aan één kant)\n4. Span de hoeken omlaag met haringen\n5. Trek de middenlijn strak\n\nTip: laat de voorkant hoger hangen dan de achterkant zodat regen wegglijdt.',
  },
  {
    id: 't8',
    title: 'Bliksemgevaar in de bergen',
    category: 'Veiligheid',
    content: '30-30 regel:\n• Als de tijd tussen bliksem en donder < 30 sec: zoek beschutting\n• Wacht 30 min na de laatste donderslag\n\nWat te doen:\n• Daaldalen of afdalen van open plekken\n• Niet onder de hoogste boom\n• Niet bij water blijven\n• Hurk neer op geïsoleerde ondergrond (rugzak)\n• Vermijd metalen voorwerpen',
  },
];
