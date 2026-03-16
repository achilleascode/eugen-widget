// n8n Code Node: Format Estates + Projects API data into AI Agent knowledge
// Input: $input.all() should contain estates (item 0) and projects (item 1) from HTTP Request nodes

const estatesData = $('Fetch Estates').first().json.data.estates;
const projectsData = $('Fetch Projects').first().json.data.projects;

const now = new Date().toLocaleString('de-AT', { timeZone: 'Europe/Vienna' });

// Helper: format features list
function getFeatures(props) {
  const features = [];
  if (props.has_elevator) features.push('Aufzug');
  if (props.is_barrier_free) features.push('Barrierefrei');
  if (props.is_air_conditioned) features.push('Klimaanlage');
  if (props.has_balconies > 0 || props.count_balconies > 0) features.push('Balkon');
  if (props.has_fitness_area) features.push('Fitnessbereich');
  if (props.has_bike_room) features.push('Fahrradraum');
  if (props.has_laundry_room) features.push('Waschküche');
  if (props.has_parcel_locker) features.push('Paketfach');
  if (props.has_common_garden) features.push('Gemeinschaftsgarten');
  if (props.has_common_terrace) features.push('Gemeinschaftsterrasse');
  if (props.has_pool) features.push('Pool');
  if (props.has_wellness_area) features.push('Wellnessbereich');
  if (props.has_co_working_space) features.push('Co-Working');
  if (props.has_smart_home_system) features.push('Smart Home');
  if (props.has_e_charging) features.push('E-Ladestation');
  if (props.has_concierge_service) features.push('Concierge');
  if (props.has_resident_app) features.push('Bewohner-App');
  if (props.has_pv_system) features.push('PV-Anlage');
  if (props.count_parking_spaces > 0) features.push(`${props.count_parking_spaces} Stellplatz/-plätze`);
  return features;
}

// Helper: get outdoor spaces
function getOutdoor(area) {
  const outdoor = [];
  if (area.garden > 0) outdoor.push(`Garten ca. ${area.garden} m²`);
  if (area.balconies > 0) outdoor.push(`Balkon ca. ${area.balconies} m²`);
  if (area.terraces > 0) outdoor.push(`Terrasse ca. ${area.terraces} m²`);
  if (area.loggias > 0) outdoor.push(`Loggia ca. ${area.loggias} m²`);
  if (area.roof_terraces > 0) outdoor.push(`Dachterrasse ca. ${area.roof_terraces} m²`);
  return outdoor;
}

// Filter active estates (child objects = individual apartments)
const activeEstates = estatesData.filter(e =>
  e.meta.is_child_object && e.meta.status === 1
);

// Build project lookup
const projectMap = {};
projectsData.forEach(p => {
  projectMap[p.id] = p;
});

// Group estates by parent project
const estatesByProject = {};
activeEstates.forEach(e => {
  const pid = e.parent_id || 'standalone';
  if (!estatesByProject[pid]) estatesByProject[pid] = [];
  estatesByProject[pid].push(e);
});

// Stats
const allRents = activeEstates.map(e => e.financial.rent_gross).filter(r => r > 0);
const allAreas = activeEstates.map(e => e.area.living_space).filter(a => a > 0);
const minRent = allRents.length ? Math.min(...allRents) : 0;
const maxRent = allRents.length ? Math.max(...allRents) : 0;
const minArea = allAreas.length ? Math.min(...allAreas) : 0;
const maxArea = allAreas.length ? Math.max(...allAreas) : 0;

// Build summary text
let summary = `## Aktuell verfügbare Wohnungen (Stand: ${now})\n`;
summary += `Insgesamt ${activeEstates.length} Wohnungen verfügbar`;
if (allRents.length) summary += ` | Mietpreisspanne: ca. €${minRent} - €${maxRent} brutto`;
if (allAreas.length) summary += ` | Flächen: ca. ${minArea} - ${maxArea} m²`;
summary += `\n\n`;

// Format each project group
for (const [pid, estates] of Object.entries(estatesByProject)) {
  const project = projectMap[pid];

  if (project) {
    const pLang = project.lang?.deu || {};
    const pTitle = pLang.title || `Projekt ${pid}`;
    const pSlug = pLang.slug || '';
    summary += `### Projekt: ${pTitle}\n`;
    summary += `Standort: ${project.location.district}, ${project.location.postal_code} ${project.location.city}\n`;
    summary += `Adresse: ${project.location.street} ${project.location.number}\n`;
    summary += `Gesamteinheiten im Haus: ${project.properties.count_units}\n`;
    summary += `Aktuell verfügbar: ${estates.length} Wohnungen\n`;
    if (project.financial.rent_range.rent_from > 0) {
      summary += `Mietpreisspanne Projekt: ca. €${project.financial.rent_range.rent_from} - €${project.financial.rent_range.rent_to}\n`;
    }
    if (project.financial.parking_space > 0) {
      summary += `Stellplatz: ca. €${project.financial.parking_space}/Monat\n`;
    }
    if (pSlug) {
      summary += `Projektseite: https://eugen.immo/projekte/${pSlug}/\n`;
    }

    // Project features
    const pFeatures = getFeatures(project.properties);
    if (pFeatures.length) {
      summary += `Haus-Ausstattung: ${pFeatures.join(', ')}\n`;
    }

    // Project description (short)
    if (pLang.description_general) {
      const desc = pLang.description_general.replace(/<[^>]*>/g, '').substring(0, 300);
      summary += `Beschreibung: ${desc}...\n`;
    }
  } else {
    summary += `### Einzelobjekte\n`;
  }

  summary += '\n';

  // Format each estate in this project
  estates.forEach((e, idx) => {
    const lang = e.lang?.deu || {};
    const title = lang.title || `Wohnung ${e.id}`;
    const slug = lang.slug || '';

    summary += `**${idx + 1}. ${title}**\n`;
    summary += `- Adresse: ${e.location.street} ${e.location.number}`;
    if (e.location.top_full) summary += `, Top ${e.location.top_full}`;
    if (e.location.floor) summary += `, ${e.location.floor}. OG`;
    summary += `\n`;
    summary += `- Bezirk: ${e.location.district}, ${e.location.postal_code}\n`;
    summary += `- Fläche: ca. ${e.area.living_space} m²\n`;
    summary += `- Zimmer: ${e.properties.count_rooms}`;
    if (e.properties.count_bedrooms) summary += ` (${e.properties.count_bedrooms} Schlafzimmer)`;
    summary += `\n`;

    // Financial
    if (e.financial.rent_gross > 0) {
      summary += `- Gesamtmiete brutto: ca. €${e.financial.rent_gross}/Monat\n`;
      if (e.financial.rent_main > 0) summary += `  - Hauptmietzins: ca. €${e.financial.rent_main}\n`;
      if (e.financial.operating_costs > 0) summary += `  - Betriebskosten: ca. €${e.financial.operating_costs}\n`;
    }
    if (e.financial.parking_space > 0) {
      summary += `- Stellplatz: ca. €${e.financial.parking_space}/Monat\n`;
    }

    // Availability
    if (lang.available_from) summary += `- Verfügbar ab: ${lang.available_from}\n`;
    if (lang.limited) summary += `- Befristung: ${lang.limited}\n`;
    if (lang.deposit) summary += `- Kaution: ${lang.deposit}\n`;

    // Outdoor
    const outdoor = getOutdoor(e.area);
    if (outdoor.length) summary += `- Freiflächen: ${outdoor.join(', ')}\n`;

    // Key features (compact)
    const features = getFeatures(e.properties);
    if (features.length) summary += `- Ausstattung: ${features.slice(0, 8).join(', ')}\n`;

    // Heating
    if (e.properties.heating?.length) {
      summary += `- Heizung: ${e.properties.heating.join(', ')}`;
      if (e.properties.heating_class) summary += ` (Energieklasse ${e.properties.heating_class})`;
      summary += `\n`;
    }

    // Link
    if (slug) {
      summary += `- Inserat: https://eugen.immo/immobilien/${slug}/\n`;
    }

    // Commission
    if (e.financial.commission_free) summary += `- Provisionsfrei!\n`;

    summary += '\n';
  });

  summary += '---\n\n';
}

// Add instructions for the AI agent
summary += `## Hinweise für den KI-Agenten\n`;
summary += `- Alle m²-Angaben und Preise sind mit "ca." anzugeben\n`;
summary += `- Mieten sind grundsätzlich Bruttomieten (Kaltmiete + BK), ohne Heizkosten\n`;
summary += `- Bei Wohnungsvorschlägen: immer den Link zum Inserat mitgeben\n`;
summary += `- Pro Anfrage 1-3 passende Vorschläge machen\n`;
summary += `- Falls keine passende Wohnung: Alternative vorschlagen (max €200 teurer oder Nachbarbezirk)\n`;
summary += `- Stellplätze sind separat auf eugen.immo/immobilien/ zu finden\n`;

return [{ json: { estates_summary: summary } }];
