/**
 * Authoritative Starsilk Dossier & Compendium Canon Registry.
 * READ-ONLY INTERPRETATION — NEVER AUTHORS OR PROMOTES FICTION TO CANON.
 * Sources:
 * - https://github.com/westkitty/Starsilk_Character_Dossier
 * - STARSILK_DRAXIS_CONTINUITY_ATLAS_V2/DOSSIER_127_STABLE_IDS.json (127 stable identities)
 * - STARSILK_DRAXIS_CONTINUITY_ATLAS_V2/CANON_REPAIR_QUEUE.json (75 tracked issues)
 * - STARSILK_DRAXIS_CONTINUITY_ATLAS_V2/DRAKKEN_93_SOURCE_CROSSWALK.json
 */

export const DOSSIER_URL_BASE = 'https://westkitty.github.io/Starsilk_Character_Dossier/';

export const CANON_INVARIANTS = Object.freeze({
  bloodEclipseWarDurationYears: 170,
  bloodEclipseWarRejectedYears: 17,
  siegeWallNature: 'Starless black-hole containment lattice and cosmic absence (never a glowing magical barrier)',
  starsilkNature: 'Programmable cosmological substrate (never sentient decorative energy)',
  causalSequence: Object.freeze([
    '1. Drakken weaponize Starsilk against divine authority',
    '2. Tiger heliocide response (Year 170)',
    '3. Formation and permanent locking of the Siege Wall containment lattice'
  ]),
  rubyEclipseYear: 121,
  drakkenPublishedCount: 60,
  drakkenCandidatesCount: 35,
});

const RAW_IDENTITIES = [
  ["shard-god","principal"],["codec","principal"],["dao","principal"],["kail","principal"],["marcel","principal"],["jazen","principal"],
  ["wordstreamer","peripheral"],["nialbu","peripheral"],["anika","peripheral"],["jory","peripheral"],["selim","peripheral"],["vessa","peripheral"],["orin","peripheral"],["mael","peripheral"],["sera-inventory","peripheral"],["hesh","peripheral"],["mara","peripheral"],["rin","peripheral"],["kira","peripheral"],["jalen","peripheral"],["safi","peripheral"],["kaelen","peripheral"],["lyra","peripheral"],["rhys","peripheral"],["anya","peripheral"],["sela-orrin","peripheral"],["marn","peripheral"],["joss","peripheral"],["reth","peripheral"],["iven","peripheral"],["khar-venn-child","peripheral"],["nyle-quarth","peripheral"],["shardlings","peripheral"],["allkept","peripheral"],["little-king","peripheral"],["marshal-venn","peripheral"],["administrator-pell","peripheral"],["technician-naresh","peripheral"],["captain-serr","peripheral"],["harold","peripheral"],["mara-syrin4","peripheral"],["tomas","peripheral"],["jonah","peripheral"],["clara","peripheral"],["eli","peripheral"],["ruth-syrin4","peripheral"],["kails-mother","peripheral"],
  ["drk-the-egg","drakken"],["drk-magma-pleuron","drakken"],["drk-granithelion","drakken"],["drk-fault-tongue","drakken"],["drk-obsidian-gul","drakken"],["drk-tremorhound","drakken"],["drk-glassspine","drakken"],["drk-quarrymind","drakken"],["drk-aerokarst","drakken"],["drk-cloudmaw","drakken"],["drk-atmantid","drakken"],["drk-weathernode","drakken"],["drk-vortenbray","drakken"],["drk-fumericus","drakken"],["drk-skymourn","drakken"],["drk-verdgorge","drakken"],["drk-pollenvault","drakken"],["drk-mycethron","drakken"],["drk-raintaster","drakken"],["drk-terragullet","drakken"],["drk-petalnest","drakken"],["drk-feralseed","drakken"],["drk-abyssoriel","drakken"],["drk-brinechoir","drakken"],["drk-currenthalo","drakken"],["drk-shelfcarver","drakken"],["drk-glacierthroat","drakken"],["drk-veilcurrent","drakken"],["drk-coronaxis","drakken"],["drk-solnexus","drakken"],["drk-nullthorn","drakken"],["drk-helionth","drakken"],["drk-umbrakrael","drakken"],["drk-cinderverge","drakken"],["drk-singularch","drakken"],["drk-ironcant","drakken"],["drk-gridsaint","drakken"],["drk-spiremolt","drakken"],["drk-roadthorn","drakken"],["drk-habitarch","drakken"],["drk-archivore","drakken"],["drk-harborhex","drakken"],["drk-lexiclast","drakken"],["drk-calendarion","drakken"],["drk-dreamtaxon","drakken"],["drk-crownmute","drakken"],["drk-hymnlock","drakken"],["drk-memorialvein","drakken"],["drk-shrinehunger","drakken"],["drk-redacted-grin","drakken"],["drk-spinal-loop","drakken"],["drk-gloryfail","drakken"],["drk-viral-bastion","drakken"],["mother","drakken"],["gorevault","drakken"],["ringthroat","drakken"],["lyriboris","drakken"],["cradle-exe","drakken"],["foldhowl","drakken"],["manifest-discord","drakken"],
  ["cover","supporting"],["world","supporting"],["chronology","supporting"],["starsilk-material","supporting"],["drakken-registry","supporting"],["blood-rings","supporting"],["starbinding","supporting"],["canon-ledger","supporting"],["beyond-wall","supporting"],["systems","supporting"],["peripheral-index","supporting"],["cosmic-architecture","supporting"],["worldsvault-templates","supporting"],["ontology-horror","supporting"],["artifacts-factions","supporting"],["trio-gallery","supporting"],["history-media","supporting"],["media-vault","supporting"],["archive","supporting"],["source","supporting"]
];

export const CANON_IDENTITIES = Object.freeze(
  RAW_IDENTITIES.map(([id, group]) => Object.freeze({
    id,
    group,
    name: id.startsWith('drk-') ? id.slice(4).replace(/-/g, ' ').toUpperCase() : id.replace(/-/g, ' ').toUpperCase(),
    humanUrl: `${DOSSIER_URL_BASE}entities/${id}/`,
    sourcePath: `src/content/sections/${id}.body.html`,
    relationStatus: 'stable identity only; no inferred semantic edges',
    coordinateStatus: 'unauthored',
    canonStatus: 'publication-derived-stable-id'
  }))
);

export const CANON_REPAIR_HIGHLIGHTS = Object.freeze([
  { id: 'AT-001', severity: 'CRITICAL', domain: 'chronology', subject: '170-year Blood Eclipse War duration (not 17 years)', status: 'SUPERSEDED' },
  { id: 'AT-002', severity: 'HIGH', domain: 'chronology', subject: 'Year 121 Siege of Ruby Eclipse in Pharos', status: 'SUPERSEDED' },
  { id: 'AT-003', severity: 'CRITICAL', domain: 'chronology', subject: 'Year 170 Aureal Starsilk strike and immediate Hal\'Ven heliocide response', status: 'SUPERSEDED' },
  { id: 'AT-004', severity: 'HIGH', domain: 'chronology', subject: 'No 17-year administrative war exists in canon', status: 'OPEN' },
  { id: 'AT-005', severity: 'HIGH', domain: 'causality', subject: 'Starsilk discovery precedes Drakken weaponization', status: 'OPEN' },
  { id: 'AT-006', severity: 'CRITICAL', domain: 'taxonomy', subject: '60 published Dossier Drakken vs 35 DRAXIS candidate strains', status: 'OPEN' },
  { id: 'AT-010', severity: 'CRITICAL', domain: 'ontology', subject: 'Mother is a physical homeworld, not a nonphysical collective', status: 'OPEN' },
]);

export const CANON_CHRONOLOGY_MILESTONES = Object.freeze([
  {
    eraId: 'war',
    timeframe: 'YEAR 0',
    title: 'OUTBREAK OF BLOOD ECLIPSE WAR',
    detail: 'Drakken weaponize Starsilk against divine authority; interstellar war erupts.',
    url: `${DOSSIER_URL_BASE}#chronology`
  },
  {
    eraId: 'war',
    timeframe: 'YEAR 3',
    title: 'BLOOD RINGS DOCUMENTED',
    detail: 'Vitrified remnants of shattered planetary systems recorded across early warfronts.',
    url: `${DOSSIER_URL_BASE}#chronology`
  },
  {
    eraId: 'war',
    timeframe: 'YEAR 121',
    title: 'SIEGE OF RUBY ECLIPSE IN PHAROS',
    detail: 'Major campaign in Pharos; documented invariant marker AT-002.',
    url: `${DOSSIER_URL_BASE}#chronology`
  },
  {
    eraId: 'locking',
    timeframe: 'YEAR 170',
    title: 'HELIOCIDE & SIEGE WALL LOCKING',
    detail: 'Aureal Starsilk strike triggers Hal\'Ven heliocide response. 170-year war terminates; starless black-hole containment lattice permanently locked.',
    url: `${DOSSIER_URL_BASE}#chronology`
  },
  {
    eraId: 'post',
    timeframe: 'POST-YEAR 170',
    title: 'POST-SIEGE HOOKSHOT SURVEY',
    detail: 'Reconnection attempts via provisional Hookshot corridors; archival survey and cataloging of surviving sectors.',
    url: `${DOSSIER_URL_BASE}#chronology`
  }
]);

export function findCanonEntity(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();
  return CANON_IDENTITIES.find(item => item.id.toLowerCase() === q || item.name.toLowerCase() === q) || null;
}

export function searchCanonEntities(query, groupFilter = null) {
  const q = (query || '').trim().toLowerCase();
  return CANON_IDENTITIES.filter(item => {
    if (groupFilter && groupFilter !== 'all' && item.group !== groupFilter) return false;
    if (!q) return true;
    return item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
  });
}

export function listCanonGroups() {
  return [
    { id: 'all', name: 'ALL IDENTITIES', count: CANON_IDENTITIES.length },
    { id: 'principal', name: 'PRINCIPAL FIGURES', count: 6 },
    { id: 'peripheral', name: 'PERIPHERAL PERSONAE', count: 41 },
    { id: 'drakken', name: 'DRAKKEN BIO-WEAPON STRAINS', count: 60 },
    { id: 'supporting', name: 'FOUNDATIONAL SECTIONS', count: 20 },
  ];
}
