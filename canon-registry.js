/**
 * Authoritative Starsilk Dossier & Compendium Canon Registry.
 * READ-ONLY INTERPRETATION — NEVER AUTHORS OR PROMOTES FICTION TO CANON.
 * Sources:
 * - https://github.com/westkitty/Starsilk_Character_Dossier
 * - STARSILK_DRAXIS_CONTINUITY_ATLAS_V2/DOSSIER_127_STABLE_IDS.json (127 stable identities)
 * - STARSILK_DRAXIS_CONTINUITY_ATLAS_V2/CANON_REPAIR_QUEUE.json (75 tracked issues)
 * - STARSILK_DRAXIS_CONTINUITY_ATLAS_V2/DRAKKEN_93_SOURCE_CROSSWALK.json
 */

import { TOPOLOGY } from './source-topology.js';

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

export const DRAKKEN_CROSSWALK = Object.freeze({
  "drk-magma-pleuron": ["DRK-F001", "OMEGA", "THERMOFERROUS", "S4 L173", "PUBLISHED-NAME-MATCH"],
  "drk-granithelion": ["DRK-F002", "HIGH", "STONE / HARDLIGHT", "S4 L203", "PUBLISHED-NAME-MATCH"],
  "drk-fault-tongue": ["DRK-F003", "MEDIUM", "SEISMIC / SONIC", "S4 L231", "PUBLISHED-NAME-MATCH"],
  "drk-obsidian-gul": ["DRK-F004", "EXTREME", "VOLCANIC GLASS / PYROCLASTIC", "S4 L259", "PUBLISHED-NAME-MATCH"],
  "drk-tremorhound": ["DRK-F005", "MODERATE", "VIBROSEISMIC", "S4 L288", "PUBLISHED-NAME-MATCH"],
  "drk-glassspine": ["DRK-F006", "LOW", "CRYSTALLINE / OPTIC", "S4 L317", "PUBLISHED-NAME-MATCH"],
  "drk-quarrymind": ["DRK-F007", "HIGH", "MINERAL / BINARY EARTH", "S4 L346", "PUBLISHED-NAME-MATCH"],
  "drk-aerokarst": ["DRK-F008", "EXTREME", "WIND / VACUUM", "S4 L376", "PUBLISHED-NAME-MATCH"],
  "drk-cloudmaw": ["DRK-F009", "HIGH", "VAPOR / PLASMA", "S4 L404", "PUBLISHED-NAME-MATCH"],
  "drk-atmantid": ["DRK-F010", "MODERATE", "SOUND / PARTICULATE", "S4 L432", "PUBLISHED-NAME-MATCH"],
  "drk-weathernode": ["DRK-F011", "LOW", "PRESSURE / EQUILIBRIUM", "S4 L460", "PUBLISHED-NAME-MATCH"],
  "drk-vortenbray": ["DRK-F012", "OMEGA", "INTELLIGENT WIND / DATAWAVE", "S4 L490", "PUBLISHED-NAME-MATCH"],
  "drk-fumericus": ["DRK-F013", "HIGH", "POISON / INDUSTRIAL", "S4 L521", "PUBLISHED-NAME-MATCH"],
  "drk-skymourn": ["DRK-F014", "MYTHIC", "THERMAL / MEMORY", "S4 L549", "PUBLISHED-NAME-MATCH"],
  "drk-verdgorge": ["DRK-F015", "EXTREME", "PLANT / FUNGAL", "S4 L581", "PUBLISHED-NAME-MATCH"],
  "drk-pollenvault": ["DRK-F016", "LOW", "AIRBORNE DNA / MEMORY", "S4 L612", "PUBLISHED-NAME-MATCH"],
  "drk-mycethron": ["DRK-F017", "HIGH", "FUNGUS / NEUROBIOLOGICAL", "S4 L642", "PUBLISHED-NAME-MATCH"],
  "drk-raintaster": ["DRK-F018", "MODERATE", "WATER / ORGANIC SALT", "S4 L669", "PUBLISHED-NAME-MATCH"],
  "drk-terragullet": ["DRK-F019", "HIGH", "EARTH / INGESTION", "S4 L698", "PUBLISHED-NAME-MATCH"],
  "drk-petalnest": ["DRK-F020", "MYTHIC", "SYMBIOTIC BLOOM", "S4 L727", "PUBLISHED-NAME-MATCH"],
  "drk-feralseed": ["DRK-F021", "OMEGA", "CORRUPTION / ADAPTATION", "S4 L756", "PUBLISHED-NAME-MATCH"],
  "drk-abyssoriel": ["DRK-F022", "OMEGA", "PRESSURE / ABYSSAL THERMAL", "S4 L789", "PUBLISHED-NAME-MATCH"],
  "drk-brinechoir": ["DRK-F023", "HIGH", "SALT / DISSOLVED MINERAL", "S4 L813", "PUBLISHED-NAME-MATCH"],
  "drk-currenthalo": ["DRK-F024", "EXTREME", "CIRCULATION / WATERSHED", "S4 L837", "PUBLISHED-NAME-MATCH"],
  "drk-shelfcarver": ["DRK-F025", "HIGH", "COAST / EROSION", "S4 L861", "PUBLISHED-NAME-MATCH"],
  "drk-glacierthroat": ["DRK-F026", "MYTHIC", "ICE / MELTSTATE", "S4 L885", "PUBLISHED-NAME-MATCH"],
  "drk-veilcurrent": ["DRK-F027", "OMEGA", "DUST / ION DRIFT", "S4 L909", "PUBLISHED-NAME-MATCH"],
  "drk-coronaxis": ["DRK-F028", "OMEGA", "CORONA / MAGNETIC FLUX", "S4 L933", "PUBLISHED-NAME-MATCH"],
  "ringthroat": ["DRK-F029", "OMEGA", "PRESSURE / VITRIFIED SLURRY", "S4 L957", "PUBLISHED-NAME-MATCH"],
  "drk-solnexus": ["DRK-F030", "OMEGA", "STELLAR / GRAVITIC", "S4 L982", "PUBLISHED-NAME-MATCH"],
  "drk-nullthorn": ["DRK-F031", "HIGH", "VOID / MASS INVERSION", "S4 L1013", "PUBLISHED-NAME-MATCH"],
  "lyriboris": ["DRK-F032", "MODERATE", "SOUND / RADIOSTORM", "S4 L1041", "PUBLISHED-NAME-MATCH"],
  "drk-helionth": ["DRK-F033", "HIGH", "LIGHT / STRUCTURE", "S4 L1070", "PUBLISHED-NAME-MATCH"],
  "drk-umbrakrael": ["DRK-F034", "EXTREME", "DARK / OCCLUSION", "S4 L1098", "PUBLISHED-NAME-MATCH"],
  "drk-cinderverge": ["DRK-F035", "HIGH", "ASH / ENTROPY", "S4 L1126", "PUBLISHED-NAME-MATCH"],
  "drk-singularch": ["DRK-F036", "OMEGA", "CODE / NULLFIELD", "S4 L1154", "SPELLING-REVIEW"],
  "drk-ironcant": ["DRK-F037", "HIGH", "METAL / INDUSTRIAL HYMN", "S4 L1186", "PUBLISHED-NAME-MATCH"],
  "drk-gridsaint": ["DRK-F038", "EXTREME", "ELECTRICITY / DISTRIBUTION", "S4 L1210", "PUBLISHED-NAME-MATCH"],
  "drk-spiremolt": ["DRK-F039", "HIGH", "VERTICALITY / HARDLIGHT STONE", "S4 L1234", "PUBLISHED-NAME-MATCH"],
  "drk-roadthorn": ["DRK-F040", "HIGH", "MOTION / LINEAR EARTH", "S4 L1258", "PUBLISHED-NAME-MATCH"],
  "drk-habitarch": ["DRK-F041", "OMEGA", "POPULATION / HABITAT ORDER", "S4 L1282", "PUBLISHED-NAME-MATCH"],
  "drk-archivore": ["DRK-F042", "EXTREME", "DOCUMENT / INSTITUTIONAL MEMORY", "S4 L1306", "PUBLISHED-NAME-MATCH"],
  "drk-harborhex": ["DRK-F043", "HIGH", "PORT / TRANSFER GEOMETRY", "S4 L1330", "PUBLISHED-NAME-MATCH"],
  "gorevault": ["DRK-F044", "OMEGA", "BLOOD / INDUSTRIAL ORGANIC", "S4 L1354", "PUBLISHED-NAME-MATCH"],
  "drk-lexiclast": ["DRK-F045", "OMEGA", "LANGUAGE / COMMAND FORM", "S4 L1381", "PUBLISHED-NAME-MATCH"],
  "drk-calendarion": ["DRK-F046", "HIGH", "SEASON / RECURRENCE", "S4 L1405", "PUBLISHED-NAME-MATCH"],
  "drk-dreamtaxon": ["DRK-F047", "EXTREME", "DREAM / CLASSIFICATION", "S4 L1429", "PUBLISHED-NAME-MATCH"],
  "drk-crownmute": ["DRK-F048", "OMEGA", "LEGITIMACY / SILENCE", "S4 L1453", "PUBLISHED-NAME-MATCH"],
  "drk-hymnlock": ["DRK-F049", "HIGH", "RITUAL / RESONANCE", "S4 L1477", "PUBLISHED-NAME-MATCH"],
  "drk-memorialvein": ["DRK-F050", "MYTHIC", "MEMORY / GRIEF", "S4 L1501", "PUBLISHED-NAME-MATCH"],
  "drk-shrinehunger": ["DRK-F051", "EXTREME", "DEVOTION / SACRED GEOGRAPHY", "S4 L1525", "PUBLISHED-NAME-MATCH"],
  "drk-redacted-grin": ["DRK-F052", "UNKNOWN", "CENSORSHIP / FEAR", "S4 L1550", "PUBLISHED-NAME-MATCH"],
  "drk-spinal-loop": ["DRK-F053", "HIGH", "TIME-LAG / EARTH", "S4 L1577", "PUBLISHED-NAME-MATCH"],
  "cradle-exe": ["DRK-F054", "VARIABLE", "ABANDONWARE / WOMB", "S4 L1605", "PUBLISHED-NAME-MATCH"],
  "foldhowl": ["DRK-F055", "EXTREME", "NOISE / BROKEN SPACE", "S4 L1634", "PUBLISHED-NAME-MATCH"],
  "manifest-discord": ["DRK-F056", "HYPERCRITICAL", "PARADOX / MEME", "S4 L1661", "PUBLISHED-NAME-MATCH"],
  "drk-gloryfail": ["DRK-F057", "TRAGIC", "FAILED MACRO / FORMER DIVINE", "S4 L1689", "PUBLISHED-NAME-MATCH"],
  "drk-viral-bastion": ["DRK-F058", "MAXIMUM", "DEFENSE / CONTAGION", "S4 L1717", "PUBLISHED-NAME-MATCH"]
});

const RAW_IDENTITIES = [
  ["shard-god","principal"],["codec","principal"],["dao","principal"],["kail","principal"],["marcel","principal"],["jazen","principal"],
  ["wordstreamer","peripheral"],["nialbu","peripheral"],["anika","peripheral"],["jory","peripheral"],["selim","peripheral"],["vessa","peripheral"],["orin","peripheral"],["mael","peripheral"],["sera-inventory","peripheral"],["hesh","peripheral"],["mara","peripheral"],["rin","peripheral"],["kira","peripheral"],["jalen","peripheral"],["safi","peripheral"],["kaelen","peripheral"],["lyra","peripheral"],["rhys","peripheral"],["anya","peripheral"],["sela-orrin","peripheral"],["marn","peripheral"],["joss","peripheral"],["reth","peripheral"],["iven","peripheral"],["khar-venn-child","peripheral"],["nyle-quarth","peripheral"],["shardlings","peripheral"],["allkept","peripheral"],["little-king","peripheral"],["marshal-venn","peripheral"],["administrator-pell","peripheral"],["technician-naresh","peripheral"],["captain-serr","peripheral"],["harold","peripheral"],["mara-syrin4","peripheral"],["tomas","peripheral"],["jonah","peripheral"],["clara","peripheral"],["eli","peripheral"],["ruth-syrin4","peripheral"],["kails-mother","peripheral"],
  ["drk-the-egg","drakken"],["drk-magma-pleuron","drakken"],["drk-granithelion","drakken"],["drk-fault-tongue","drakken"],["drk-obsidian-gul","drakken"],["drk-tremorhound","drakken"],["drk-glassspine","drakken"],["drk-quarrymind","drakken"],["drk-aerokarst","drakken"],["drk-cloudmaw","drakken"],["drk-atmantid","drakken"],["drk-weathernode","drakken"],["drk-vortenbray","drakken"],["drk-fumericus","drakken"],["drk-skymourn","drakken"],["drk-verdgorge","drakken"],["drk-pollenvault","drakken"],["drk-mycethron","drakken"],["drk-raintaster","drakken"],["drk-terragullet","drakken"],["drk-petalnest","drakken"],["drk-feralseed","drakken"],["drk-abyssoriel","drakken"],["drk-brinechoir","drakken"],["drk-currenthalo","drakken"],["drk-shelfcarver","drakken"],["drk-glacierthroat","drakken"],["drk-veilcurrent","drakken"],["drk-coronaxis","drakken"],["drk-solnexus","drakken"],["drk-nullthorn","drakken"],["drk-helionth","drakken"],["drk-umbrakrael","drakken"],["drk-cinderverge","drakken"],["drk-singularch","drakken"],["drk-ironcant","drakken"],["drk-gridsaint","drakken"],["drk-spiremolt","drakken"],["drk-roadthorn","drakken"],["drk-habitarch","drakken"],["drk-archivore","drakken"],["drk-harborhex","drakken"],["drk-lexiclast","drakken"],["drk-calendarion","drakken"],["drk-dreamtaxon","drakken"],["drk-crownmute","drakken"],["drk-hymnlock","drakken"],["drk-memorialvein","drakken"],["drk-shrinehunger","drakken"],["drk-redacted-grin","drakken"],["drk-spinal-loop","drakken"],["drk-gloryfail","drakken"],["drk-viral-bastion","drakken"],["mother","drakken"],["gorevault","drakken"],["ringthroat","drakken"],["lyriboris","drakken"],["cradle-exe","drakken"],["foldhowl","drakken"],["manifest-discord","drakken"],
  ["cover","supporting"],["world","supporting"],["chronology","supporting"],["starsilk-material","supporting"],["drakken-registry","supporting"],["blood-rings","supporting"],["starbinding","supporting"],["canon-ledger","supporting"],["beyond-wall","supporting"],["systems","supporting"],["peripheral-index","supporting"],["cosmic-architecture","supporting"],["worldsvault-templates","supporting"],["ontology-horror","supporting"],["artifacts-factions","supporting"],["trio-gallery","supporting"],["history-media","supporting"],["media-vault","supporting"],["archive","supporting"],["source","supporting"]
];

export const CANON_IDENTITIES = Object.freeze(
  RAW_IDENTITIES.map(([id, group]) => {
    const crosswalk = DRAKKEN_CROSSWALK[id];
    return Object.freeze({
      id,
      group,
      name: id.startsWith('drk-') ? id.slice(4).replace(/-/g, ' ').toUpperCase() : id.replace(/-/g, ' ').toUpperCase(),
      humanUrl: `${DOSSIER_URL_BASE}entities/${id}/`,
      sourcePath: `src/content/sections/${id}.body.html`,
      relationStatus: 'stable identity only; no inferred semantic edges',
      coordinateStatus: 'unauthored',
      canonStatus: 'publication-derived-stable-id',
      drakkenMetadata: crosswalk ? Object.freeze({
        candidateId: crosswalk[0],
        threatTier: crosswalk[1],
        affinity: crosswalk[2],
        sourceAnchor: crosswalk[3],
        matchingState: crosswalk[4],
        canonApproved: null, // Invariant: matching is not approval
      }) : null,
    });
  })
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
    if (item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)) return true;
    if (item.sourcePath && item.sourcePath.toLowerCase().includes(q)) return true;
    if (item.drakkenMetadata) {
      const d = item.drakkenMetadata;
      if (d.candidateId && d.candidateId.toLowerCase().includes(q)) return true;
      if (d.affinity && d.affinity.toLowerCase().includes(q)) return true;
      if (d.threatTier && d.threatTier.toLowerCase().includes(q)) return true;
      if (d.sourceAnchor && d.sourceAnchor.toLowerCase().includes(q)) return true;
    }
    return false;
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

export function getCanonicalRelations(entityId) {
  if (!entityId || typeof entityId !== 'string') return [];
  const q = entityId.trim().toLowerCase();
  const directEdges = TOPOLOGY.edges.filter(e => e.from === q || e.to === q);
  return directEdges.map(e => {
    const isOut = e.from === q;
    const targetId = isOut ? e.to : e.from;
    const targetNode = TOPOLOGY.nodes.find(n => n.id === targetId);
    return Object.freeze({
      relation: isOut ? e.relation : `inverse-${e.relation}`,
      targetId,
      targetName: targetNode ? targetNode.label : targetId,
      sourceUrl: e.sourceUrl,
      graphUrl: e.graphUrl,
      certainty: e.certainty,
      geometryStatus: e.geometryStatus,
    });
  });
}
