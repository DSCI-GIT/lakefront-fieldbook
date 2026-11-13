// CNB4 reference point from the Canada Flight Supplement (N43 58 38, W78 12 00).
export const heliport = { centre: [43 + 58/60 + 38/3600, -78.2], radius: 1852 };

export const photoLabels = {
  missing: 'No photo match',
  possible: 'Possible photo match',
  matched: 'Photo matched'
};

export const photoColours = { missing: '#b95c09', possible: '#7135a5', matched: '#18764e' };

// WGS84 local distances at the midpoint latitude, for poles in the Cobourg area.
function distanceToHeliport(lat, lon) {
  const [centreLat, centreLon] = heliport.centre;
  const radians = Math.PI / 180;
  const latitude = (lat + centreLat) / 2 * radians;
  const eccentricitySquared = 0.00669437999014;
  const scale = Math.sqrt(1 - eccentricitySquared * Math.sin(latitude) ** 2);
  const northRadius = 6378137 * (1 - eccentricitySquared) / scale ** 3;
  const eastRadius = 6378137 / scale * Math.cos(latitude);
  return Math.hypot((lat - centreLat) * radians * northRadius, (lon - centreLon) * radians * eastRadius);
}

export function addPlanningStatus(poles, matches) {
  const matched = new Set(matches.matched);
  const possible = new Set(matches.possible);
  for (const pole of poles) {
    const id = pole.properties.pole_id;
    const [lon, lat] = pole.geometry.coordinates;
    const distance = distanceToHeliport(lat, lon);
    pole.planning = {
      photo: matched.has(id) ? 'matched' : possible.has(id) ? 'possible' : 'missing',
      heliportDistance: distance,
      inHeliport: distance <= heliport.radius,
      nearHeliportBoundary: Math.abs(distance - heliport.radius) <= 20
    };
  }
}

export function matchesPlanningFilter({photo, inHeliport}, photoFilter, heliportOnly) {
  const photoMatches = photoFilter === 'all' || photo === photoFilter ||
    (photoFilter === 'remaining' && photo !== 'matched');
  return photoMatches && (!heliportOnly || inHeliport);
}
