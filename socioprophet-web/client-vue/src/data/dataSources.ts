// The data catalog — every source the cockpit reads, registered in one place with its live-adapter
// status, real upstream endpoint, license, geographic scope, and an HONEST quality grade. The #1
// credibility gap is "fixtures vs. live feeds"; this registry is the seam. Graphical integrity is
// the moat (Tufte): we grade our own data A–F and say plainly where it's thin. `scope` +
// `coverageModel` drive the per-country grading in features/catalogue/coverage.ts.
export type AdapterStatus = 'live' | 'fixture' | 'planned';
export type SourceDomain = 'Civic' | 'Markets' | 'Real Estate' | 'Legal' | 'News' | 'Geospatial' | 'Graph' | 'Supply' | 'Economy' | 'Weather' | 'Identity';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
// Auth requirement — the moat is "no-key CORS": free open feeds we can call straight from the browser.
export type KeyReq = 'none' | 'free-tier' | 'commercial' | 'sovereign';
// How a source's coverage maps onto the world (see coverage.ts for the weighting math).
//  us            — United States only (federal/agency data)
//  us-metros     — a set of US metros only (GTFS-class)
//  geo-global    — physical/model, genuinely uniform worldwide (earthquakes, weather, air)
//  mapped-global — depends on human OSM mapping density; strong in cities, thin in poor/rural regions
//  stats-global  — national statistics / structured data; tracks a state's statistical capacity
//  media-global  — worldwide but thins in lower-income/less-covered countries (news, events, social)
//  markets-global— market/econ data, strong in developed markets, thin in frontier
//  sparse-global — technically worldwide, genuinely thin everywhere (niche panels)
//  sovereign     — our own governed substrate, not a country-indexed feed
export type CoverageModel = 'us' | 'us-metros' | 'geo-global' | 'mapped-global' | 'stats-global' | 'media-global' | 'sparse-global' | 'markets-global' | 'sovereign';

export interface DataSource {
  id: string;
  name: string;
  domain: SourceDomain;
  upstream: string;          // the real-world feed this represents
  status: AdapterStatus;
  feeds: string[];           // surfaces / layers it powers
  cadence: string;           // refresh cadence
  license: string;
  // Catalogue metadata (added in the catalogue build):
  endpoint?: string;         // real upstream URL when live
  adapter?: string;          // src/data/adapters/*.ts module backing it
  scope: CoverageModel;      // geographic reach
  keyReq: KeyReq;            // auth requirement to reach it
  grade: Grade;              // honest overall data-quality grade for THIS source
  gradeNote: string;         // one line: why that grade — the honest caveat
}

export const DATA_SOURCES: DataSource[] = [
  // ── Civic / demographics (US federal + agency) ─────────────────────────────
  { id: 'acs', name: 'Census ACS', domain: 'Civic', upstream: 'US Census American Community Survey (ACS5) + TIGERweb tracts', status: 'live', adapter: 'censusLive', endpoint: 'https://api.census.gov/data/2023/acs/acs5', scope: 'us', keyReq: 'none', cadence: 'annual', license: 'public domain', grade: 'A', feeds: ['Map · People', 'Map · Economic', 'Map · Housing'], gradeNote: 'Gold-standard US demographics at tract resolution; ~1yr lag, US-only.' },
  { id: 'fips', name: 'FCC / Census FIPS', domain: 'Civic', upstream: 'FCC Census Block API (lat/lon → FIPS)', status: 'live', adapter: 'fipsLive', endpoint: 'https://geo.fcc.gov/api/census/area', scope: 'us', keyReq: 'none', cadence: 'static', license: 'public domain', grade: 'A', feeds: ['Geocoding · FIPS', 'Map join keys'], gradeNote: 'Authoritative US block/county FIPS resolver; US-only reference data.' },
  { id: 'aqi', name: 'Air quality (Open-Meteo)', domain: 'Civic', upstream: 'Open-Meteo Air Quality (CAMS/GEOS-CF)', status: 'live', adapter: 'airLive', endpoint: 'https://air-quality-api.open-meteo.com/v1/air-quality', scope: 'geo-global', keyReq: 'none', cadence: 'hourly', license: 'CC-BY 4.0', grade: 'B', feeds: ['Map · Environment', 'Weather'], gradeNote: 'Global modeled AQI, hourly; model output not ground sensors, so local spikes can be smoothed.' },
  { id: 'crime', name: 'Crime incidents', domain: 'Civic', upstream: 'Open municipal crime feeds (Socrata-class)', status: 'live', adapter: 'crimeLive', scope: 'us', keyReq: 'none', cadence: 'daily', license: 'open / public domain', grade: 'C', feeds: ['Map · Public Safety'], gradeNote: 'Only the US cities that publish open feeds; no national coverage, definitions vary by city.' },
  { id: 'cdc-places', name: 'CDC PLACES', domain: 'Civic', upstream: 'CDC PLACES health measures', status: 'fixture', scope: 'us', keyReq: 'none', cadence: 'annual', license: 'public domain', grade: 'B', feeds: ['Map · Health'], gradeNote: 'Modeled small-area health estimates; not yet wired to a live adapter.' },
  { id: 'nces', name: 'NCES / DOE', domain: 'Civic', upstream: 'Dept. of Education NCES', status: 'fixture', scope: 'us', keyReq: 'none', cadence: 'annual', license: 'public domain', grade: 'C', feeds: ['Map · Education'], gradeNote: 'US school data; fixture only for now, annual lag.' },
  { id: 'mobility', name: 'Mobility panel', domain: 'Civic', upstream: 'Placer / SafeGraph-class mobility', status: 'planned', scope: 'sparse-global', keyReq: 'commercial', cadence: 'daily', license: 'commercial', grade: 'D', feeds: ['Map · Foot Traffic', 'Site selection'], gradeNote: 'Commercial panel, no free adapter; sampled not census — inferential only.' },
  // ── Geospatial (OpenStreetMap family — global) ─────────────────────────────
  { id: 'osm', name: 'OpenStreetMap basemap', domain: 'Geospatial', upstream: 'OSM raster/vector tiles', status: 'live', adapter: '(MapLibre)', endpoint: 'https://tile.openstreetmap.org', scope: 'mapped-global', keyReq: 'none', cadence: 'live', license: 'ODbL', grade: 'A', feeds: ['Map basemap'], gradeNote: 'Best open global basemap; density varies — sparse in rural low-income regions.' },
  { id: 'overpass', name: 'Overpass (OSM query)', domain: 'Geospatial', upstream: 'Overpass API over OSM', status: 'live', adapter: 'overpassLive', endpoint: 'https://overpass-api.de/api/interpreter', scope: 'mapped-global', keyReq: 'none', cadence: 'live', license: 'ODbL', grade: 'B', feeds: ['Map · POIs', 'Land mask'], gradeNote: 'Global feature queries; completeness tracks OSM mapping density, thin outside cities.' },
  { id: 'streets', name: 'Street network', domain: 'Geospatial', upstream: 'Overpass ways → routing graph', status: 'live', adapter: 'streetsLive', endpoint: 'https://overpass-api.de/api/interpreter', scope: 'mapped-global', keyReq: 'none', cadence: 'live', license: 'ODbL', grade: 'B', feeds: ['Isochrones', 'Map · Streets'], gradeNote: 'Real routable graph where OSM is well-mapped; degrades in poorly-mapped areas.' },
  { id: 'geocode', name: 'Nominatim geocoder', domain: 'Geospatial', upstream: 'OSM Nominatim', status: 'live', adapter: 'geocodeLive', endpoint: 'https://nominatim.openstreetmap.org/search', scope: 'mapped-global', keyReq: 'none', cadence: 'live', license: 'ODbL', grade: 'B', feeds: ['Search · Places'], gradeNote: 'Global forward/reverse geocoding; 1 req/s courtesy limit, address coverage uneven.' },
  { id: 'wikidata', name: 'Wikidata', domain: 'Geospatial', upstream: 'Wikidata entities/SPARQL', status: 'live', adapter: 'wikidataLive', endpoint: 'https://www.wikidata.org/w/api.php', scope: 'stats-global', keyReq: 'none', cadence: 'live', license: 'CC0', grade: 'B', feeds: ['Entity enrichment', 'Graph'], gradeNote: 'Global structured entities, CC0; coverage/quality varies by topic and language.' },
  { id: 'gaia', name: 'GAIA world model', domain: 'Geospatial', upstream: 'GAIA OSM ingest / WorldClaim tile catalog', status: 'fixture', scope: 'mapped-global', keyReq: 'sovereign', cadence: 'batch', license: 'ODbL + sovereign', grade: 'C', feeds: ['Map · GAIA layers'], gradeNote: 'Our governed world-model layer; ingest pipeline live, cockpit still reads fixtures.' },
  // ── Weather / hazards (NOAA + Open-Meteo) ──────────────────────────────────
  { id: 'weather', name: 'Weather forecast', domain: 'Weather', upstream: 'Open-Meteo forecast (multi-model)', status: 'live', adapter: 'weatherLive', endpoint: 'https://api.open-meteo.com/v1/forecast', scope: 'geo-global', keyReq: 'none', cadence: 'hourly', license: 'CC-BY 4.0', grade: 'A', feeds: ['Weather', 'Land & Resources'], gradeNote: 'Global hourly forecast, no key; excellent coverage, model resolution varies by region.' },
  { id: 'nws-alerts', name: 'NWS active alerts', domain: 'Weather', upstream: 'NWS/NOAA active alerts API', status: 'live', adapter: 'nwsAlertsLive', endpoint: 'https://api.weather.gov/alerts/active', scope: 'us', keyReq: 'none', cadence: 'live', license: 'public domain', grade: 'A', feeds: ['Weather · Alerts', 'Supply · Disruption'], gradeNote: 'Authoritative real-time US watches/warnings; US + territories only.' },
  { id: 'flood', name: 'FEMA flood zones (NFHL)', domain: 'Weather', upstream: 'FEMA National Flood Hazard Layer', status: 'live', adapter: 'floodLive', endpoint: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer', scope: 'us', keyReq: 'none', cadence: 'quarterly', license: 'public domain', grade: 'B', feeds: ['Map · Flood risk', 'Real Estate · Risk'], gradeNote: 'Official US flood zones; not all counties mapped, panels updated on a rolling basis.' },
  { id: 'quakes', name: 'USGS earthquakes', domain: 'Weather', upstream: 'USGS earthquake GeoJSON feed', status: 'live', adapter: 'quakesLive', endpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', scope: 'geo-global', keyReq: 'none', cadence: 'live', license: 'public domain', grade: 'A', feeds: ['Map · Seismic', 'Supply · Disruption'], gradeNote: 'Authoritative global seismicity, near-real-time; small-magnitude completeness best over instrumented regions.' },
  // ── Markets / economy ──────────────────────────────────────────────────────
  { id: 'markets', name: 'Crypto & FX spot', domain: 'Markets', upstream: 'CoinGecko (crypto) + Frankfurter/ECB (FX)', status: 'live', adapter: 'marketsLive', endpoint: 'https://api.coingecko.com/api/v3/simple/price', scope: 'markets-global', keyReq: 'none', cadence: 'realtime', license: 'open / attribution', grade: 'B', feeds: ['Market Monitor', 'Portfolio', 'Algo'], gradeNote: 'Real no-key crypto + ECB FX. Equities/futures still need a licensed feed — that class is fixture.' },
  { id: 'treasury', name: 'US Treasury yield curve', domain: 'Markets', upstream: 'US Treasury daily par yield curve (XML)', status: 'live', adapter: 'treasuryLive', endpoint: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml', scope: 'us', keyReq: 'none', cadence: 'daily', license: 'public domain', grade: 'A', feeds: ['Rates', 'Economy', 'Value Drivers'], gradeNote: 'Authoritative daily US par-yield curve; US sovereign rates only.' },
  { id: 'worldbank', name: 'World Bank indicators', domain: 'Economy', upstream: 'World Bank Open Data API v2', status: 'live', adapter: 'worldBankLive', endpoint: 'https://api.worldbank.org/v2', scope: 'stats-global', keyReq: 'none', cadence: 'annual', license: 'CC-BY 4.0', grade: 'B', feeds: ['Economy', 'Country profiles', 'Value Drivers'], gradeNote: 'Best free all-country macro panel; many indicators lag 1–2yr and are sparse for low-income states.' },
  { id: 'labor', name: 'Labor / job market', domain: 'Economy', upstream: 'Remotive remote-jobs API', status: 'live', adapter: 'laborLive', endpoint: 'https://remotive.com/api/remote-jobs', scope: 'sparse-global', keyReq: 'none', cadence: 'daily', license: 'open / attribution', grade: 'C', feeds: ['Labor', 'Economy'], gradeNote: 'Real live listings but a narrow slice (remote/tech); not a representative labor-market panel.' },
  { id: 'fred', name: 'FRED / BLS', domain: 'Economy', upstream: 'St. Louis Fed FRED + BLS', status: 'fixture', scope: 'us', keyReq: 'free-tier', cadence: 'monthly', license: 'public domain', grade: 'A', feeds: ['Economy', 'Value Drivers'], gradeNote: 'Deep US macro series; key-gated, so wired as fixture pending key-minting in CI.' },
  // ── Legal / regulatory ─────────────────────────────────────────────────────
  { id: 'fedreg', name: 'Federal Register', domain: 'Legal', upstream: 'federalregister.gov API v1', status: 'live', adapter: 'federalRegisterLive', endpoint: 'https://www.federalregister.gov/api/v1/documents.json', scope: 'us', keyReq: 'none', cadence: 'daily', license: 'public domain', grade: 'A', feeds: ['Law & Regulation'], gradeNote: 'Authoritative daily US federal rules/notices; US federal executive only.' },
  { id: 'courts', name: 'Court dockets', domain: 'Legal', upstream: 'PACER / CourtListener', status: 'planned', scope: 'us', keyReq: 'free-tier', cadence: 'daily', license: 'mixed', grade: 'C', feeds: ['Law · Case law'], gradeNote: 'CourtListener is free-tier; PACER is paywalled. Not yet wired.' },
  // ── News / social ──────────────────────────────────────────────────────────
  { id: 'gdelt', name: 'GDELT global news', domain: 'News', upstream: 'GDELT 2.0 Doc API', status: 'live', adapter: 'gdeltLive', endpoint: 'https://api.gdeltproject.org/api/v2/doc/doc', scope: 'media-global', keyReq: 'none', cadence: 'live', license: 'open', grade: 'B', feeds: ['News', 'Events'], gradeNote: 'Worldwide event/news monitoring; English-media skew, thinner for low-coverage countries.' },
  { id: 'hn-news', name: 'HN / tech news', domain: 'News', upstream: 'Hacker News (Algolia) search', status: 'live', adapter: 'newsLive', endpoint: 'https://hn.algolia.com/api/v1/search_by_date', scope: 'media-global', keyReq: 'none', cadence: 'live', license: 'open', grade: 'C', feeds: ['News · Tech'], gradeNote: 'Live but a narrow tech/startup slice, not general news.' },
  { id: 'bsky', name: 'Bluesky (ATProto)', domain: 'News', upstream: 'Bluesky public AppView searchPosts', status: 'live', adapter: 'blueskyLive', endpoint: 'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts', scope: 'media-global', keyReq: 'none', cadence: 'live', license: 'open', grade: 'C', feeds: ['News · Social'], gradeNote: 'Real live social; a single network — sample, not the whole social graph.' },
  // ── Supply / logistics ─────────────────────────────────────────────────────
  { id: 'transit', name: 'Transit (GTFS via OSM)', domain: 'Supply', upstream: 'Overpass public_transport routes', status: 'live', adapter: 'transitLive', endpoint: 'https://overpass-api.de/api/interpreter', scope: 'us-metros', keyReq: 'none', cadence: 'live', license: 'ODbL', grade: 'C', feeds: ['Map · Mobility', 'Supply'], gradeNote: 'OSM-derived transit lines; not schedule-accurate GTFS, coverage best in mapped metros.' },
  { id: 'cowork', name: 'Coworking / workspace', domain: 'Supply', upstream: 'Overpass office=coworking POIs', status: 'live', adapter: 'coworkLive', endpoint: 'https://overpass-api.de/api/interpreter', scope: 'sparse-global', keyReq: 'none', cadence: 'live', license: 'ODbL', grade: 'D', feeds: ['Workspace', 'Site selection'], gradeNote: 'OSM POI tag — very incomplete; presence ≠ full inventory.' },
  { id: 'delivery', name: 'Delivery excellence', domain: 'Supply', upstream: 'Composite (quakes + NWS + provider geo)', status: 'live', adapter: 'deliveryExcellenceLive', scope: 'sparse-global', keyReq: 'none', cadence: 'live', license: 'mixed', grade: 'C', feeds: ['Supply Chain', 'Digital Twin'], gradeNote: 'Derived disruption signal joining hazards to provider geo; heuristic, not carrier telemetry.' },
  { id: 'logistics', name: 'Carrier telemetry', domain: 'Supply', upstream: 'project44 / FourKites-class', status: 'planned', scope: 'markets-global', keyReq: 'commercial', cadence: 'live', license: 'commercial', grade: 'D', feeds: ['Supply Chain', 'Digital Twin'], gradeNote: 'True shipment telemetry is commercial; no free adapter.' },
  // ── Graph / identity (sovereign) ───────────────────────────────────────────
  { id: 'controlplane', name: 'Noetica governance', domain: 'Graph', upstream: 'Noetica Agent Machine governance API', status: 'live', adapter: 'controlPlaneLive', endpoint: 'http://localhost:8080/api/governance', scope: 'sovereign', keyReq: 'sovereign', cadence: 'live', license: 'sovereign', grade: 'A', feeds: ['Control Plane'], gradeNote: 'Our own governed agent-machine; authoritative for the estate, read + write.' },
  { id: 'hellgraph', name: 'HellGraph', domain: 'Graph', upstream: 'Sovereign federated hypergraph (Hypercore/Autobase)', status: 'live', adapter: '(hellgraph client)', scope: 'sovereign', keyReq: 'sovereign', cadence: 'live', license: 'sovereign', grade: 'B', feeds: ['Graph dock', 'PersonGraph', 'KnowledgeGraph'], gradeNote: 'Our federated hypergraph; authoritative for what we ingest, coverage grows with ingest.' },
  { id: 'holographme', name: 'HolographMe', domain: 'Identity', upstream: 'HolographMe reputation lattice', status: 'planned', scope: 'sovereign', keyReq: 'sovereign', cadence: 'live', license: 'sovereign', grade: 'D', feeds: ['People', 'News', 'Marketplace'], gradeNote: 'Reputation lattice; design-stage, not yet wired.' },
];

export const sourcesByStatus = (s: AdapterStatus) => DATA_SOURCES.filter((d) => d.status === s);
export const GRADE_ORDER: Grade[] = ['A', 'B', 'C', 'D', 'F'];
