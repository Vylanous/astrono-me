/**
 * ASTRONO-ME ephemeris.
 *
 * Low-precision astronomical calculations that run entirely on-device.
 * The method follows Paul Schlyter's well-known "How to compute planetary
 * positions" (mean orbital elements with the main perturbation terms for
 * the Moon, Jupiter and Saturn). Accuracy is roughly 1-2 arc-minutes for
 * the Sun, a few arc-minutes for the Moon, and within a degree or so for
 * the outer planets — more than enough to place every body in the correct
 * sign and to date Moon sign changes and phases, which is what the
 * readings use. We say this plainly on the How ASTRONO-ME Works page.
 */

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;
export type Sign = (typeof SIGNS)[number];

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';

export function elementOf(sign: Sign): Element {
  const i = SIGNS.indexOf(sign);
  return (['Fire', 'Earth', 'Air', 'Water'] as Element[])[i % 4];
}

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function rev(x: number): number {
  return x - Math.floor(x / 360) * 360;
}
function sind(x: number): number {
  return Math.sin(x * RAD);
}
function cosd(x: number): number {
  return Math.cos(x * RAD);
}

/** Days since 2000 Jan 0.0 (JD 2451543.5), Schlyter's "d". */
export function dayNumber(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5 - 2451543.5;
}

export function signOf(longitude: number): Sign {
  return SIGNS[Math.floor(rev(longitude) / 30) % 12];
}

export function degreeInSign(longitude: number): number {
  return rev(longitude) % 30;
}

/* ------------------------------------------------------------------ Sun */

interface SunPos {
  longitude: number;
  meanLongitude: number;
  meanAnomaly: number;
  distance: number;
}

function sunPosition(d: number): SunPos {
  const w = 282.9404 + 4.70935e-5 * d; // longitude of perihelion
  const e = 0.016709 - 1.151e-9 * d; // eccentricity
  const M = rev(356.047 + 0.9856002585 * d); // mean anomaly

  const E = M + e * DEG * sind(M) * (1 + e * cosd(M)); // eccentric anomaly (approx.)
  const xv = cosd(E) - e;
  const yv = Math.sqrt(1 - e * e) * sind(E);
  const v = Math.atan2(yv, xv) * DEG; // true anomaly
  const r = Math.sqrt(xv * xv + yv * yv);
  const longitude = rev(v + w);
  return { longitude, meanLongitude: rev(M + w), meanAnomaly: M, distance: r };
}

export function sunLongitude(date: Date): number {
  return sunPosition(dayNumber(date)).longitude;
}

export function sunSign(date: Date): Sign {
  return signOf(sunLongitude(date));
}

/* ------------------------------------------------------------------ Moon */

interface MoonPos {
  longitude: number;
  latitude: number;
  meanAnomaly: number;
  meanLongitude: number;
  elongation: number; // Moon longitude minus Sun longitude
}

function moonPosition(d: number): MoonPos {
  const N = rev(125.1228 - 0.0529538083 * d);
  const i = 5.1454;
  const w = rev(318.0634 + 0.1643573223 * d);
  const a = 60.2666; // Earth radii
  const e = 0.0549;
  const M = rev(115.3654 + 13.0649929509 * d);

  // Eccentric anomaly, two iterations.
  let E = M + e * DEG * sind(M) * (1 + e * cosd(M));
  E = E - (E - e * DEG * sind(E) - M) / (1 - e * cosd(E));

  const xv = a * (cosd(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * sind(E));
  const v = Math.atan2(yv, xv) * DEG;
  const r = Math.sqrt(xv * xv + yv * yv);

  // Ecliptic rectangular coordinates.
  const xh = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i));
  const yh = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i));
  const zh = r * (sind(v + w) * sind(i));

  let lon = rev(Math.atan2(yh, xh) * DEG);
  let lat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * DEG;

  // Main perturbation terms.
  const sun = sunPosition(d);
  const Ms = sun.meanAnomaly;
  const Mm = M;
  const Lm = rev(N + w + M); // Moon mean longitude
  const D = rev(Lm - sun.meanLongitude); // mean elongation
  const F = rev(Lm - N); // argument of latitude

  lon +=
    -1.274 * sind(Mm - 2 * D) +
    0.658 * sind(2 * D) -
    0.186 * sind(Ms) -
    0.059 * sind(2 * Mm - 2 * D) -
    0.057 * sind(Mm - 2 * D + Ms) +
    0.053 * sind(Mm + 2 * D) +
    0.046 * sind(2 * D - Ms) +
    0.041 * sind(Mm - Ms) -
    0.035 * sind(D) -
    0.031 * sind(Mm + Ms) -
    0.015 * sind(2 * F - 2 * D) +
    0.011 * sind(Mm - 4 * D);
  lat +=
    -0.173 * sind(F - 2 * D) -
    0.055 * sind(Mm - F - 2 * D) -
    0.046 * sind(Mm + F - 2 * D) +
    0.033 * sind(F + 2 * D) +
    0.017 * sind(2 * Mm + F);

  return {
    longitude: rev(lon),
    latitude: lat,
    meanAnomaly: M,
    meanLongitude: Lm,
    elongation: rev(rev(lon) - sun.longitude),
  };
}

export function moonLongitude(date: Date): number {
  return moonPosition(dayNumber(date)).longitude;
}

export function moonSign(date: Date): Sign {
  return signOf(moonLongitude(date));
}

export interface MoonPhaseInfo {
  /** Sun-Moon elongation, 0-360. 0 = New, 90 = First Quarter, 180 = Full, 270 = Last Quarter. */
  angle: number;
  /** 0 at New, 1 at Full. */
  illumination: number;
  name: string;
  /** Approximate age of the lunation in days. */
  ageDays: number;
}

const PHASE_NAMES: [number, string][] = [
  [11.25, 'New Moon'],
  [78.75, 'Waxing Crescent'],
  [101.25, 'First Quarter'],
  [168.75, 'Waxing Gibbous'],
  [191.25, 'Full Moon'],
  [258.75, 'Waning Gibbous'],
  [281.25, 'Last Quarter'],
  [348.75, 'Waning Crescent'],
];

export function moonPhase(date: Date): MoonPhaseInfo {
  const pos = moonPosition(dayNumber(date));
  const angle = pos.elongation;
  const illumination = (1 - Math.cos(angle * RAD)) / 2;
  let name = 'New Moon';
  for (const [limit, label] of PHASE_NAMES) {
    if (angle < limit) {
      name = label;
      break;
    }
    name = 'Waning Crescent';
  }
  if (angle >= 348.75) name = 'New Moon';
  return { angle, illumination, name, ageDays: (angle / 360) * 29.530588853 };
}

/* --------------------------------------------------------------- Planets */

interface OrbitalElements {
  N: [number, number]; // longitude of ascending node + daily rate
  i: [number, number]; // inclination
  w: [number, number]; // argument of perihelion
  a: [number, number]; // semi-major axis (AU)
  e: [number, number]; // eccentricity
  M: [number, number]; // mean anomaly
}

const ELEMENTS: Record<string, OrbitalElements> = {
  Mercury: { N: [48.3313, 3.24587e-5], i: [7.0047, 5.0e-8], w: [29.1241, 1.01444e-5], a: [0.387098, 0], e: [0.205635, 5.59e-10], M: [168.6562, 4.0923344368] },
  Venus: { N: [76.6799, 2.4659e-5], i: [3.3946, 2.75e-8], w: [54.891, 1.38374e-5], a: [0.72333, 0], e: [0.006773, -1.302e-9], M: [48.0052, 1.6021302244] },
  Mars: { N: [49.5574, 2.11081e-5], i: [1.8497, -1.78e-8], w: [286.5016, 2.92961e-5], a: [1.523688, 0], e: [0.093405, 2.516e-9], M: [18.6021, 0.5240207766] },
  Jupiter: { N: [100.4542, 2.76854e-5], i: [1.303, -1.557e-7], w: [273.8777, 1.64505e-5], a: [5.20256, 0], e: [0.048498, 4.469e-9], M: [19.895, 0.0830853001] },
  Saturn: { N: [113.6634, 2.3898e-5], i: [2.4886, -1.081e-7], w: [339.3939, 2.97661e-5], a: [9.55475, 0], e: [0.055546, -9.499e-9], M: [316.967, 0.0334442282] },
  Uranus: { N: [74.0005, 1.3978e-5], i: [0.7733, 1.9e-8], w: [96.6612, 3.0565e-5], a: [19.18171, -1.55e-8], e: [0.047318, 7.45e-9], M: [142.5905, 0.011725806] },
  Neptune: { N: [131.7806, 3.0173e-5], i: [1.77, -2.55e-7], w: [272.8461, -6.027e-6], a: [30.05826, 3.313e-8], e: [0.008606, 2.15e-9], M: [260.2471, 0.005995147] },
};

export const PLANET_NAMES = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
] as const;
export type PlanetName = (typeof PLANET_NAMES)[number];

function heliocentricCoords(el: OrbitalElements, d: number) {
  const N = el.N[0] + el.N[1] * d;
  const inc = el.i[0] + el.i[1] * d;
  const w = el.w[0] + el.w[1] * d;
  const a = el.a[0] + el.a[1] * d;
  const e = el.e[0] + el.e[1] * d;
  const M = rev(el.M[0] + el.M[1] * d);

  let E = M + e * DEG * sind(M) * (1 + e * cosd(M));
  if (e > 0.05) {
    // Iterate for the more eccentric orbits (Mercury, Mars).
    for (let k = 0; k < 3; k++) {
      E = E - (E - e * DEG * sind(E) - M) / (1 - e * cosd(E));
    }
  }
  const xv = a * (cosd(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * sind(E));
  const v = Math.atan2(yv, xv) * DEG;
  const r = Math.sqrt(xv * xv + yv * yv);

  const xh = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(inc));
  const yh = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(inc));
  const zh = r * (sind(v + w) * sind(inc));
  return { xh, yh, zh, M };
}

function plutoLongitude(d: number): number {
  const P = 238.9508 + 0.00400703 * d;
  const lon =
    P -
    19.799 * sind(P) +
    19.848 * cosd(P) +
    0.897 * sind(2 * P) -
    4.956 * cosd(2 * P) +
    0.61 * sind(3 * P) +
    1.211 * cosd(3 * P) -
    0.341 * sind(4 * P) -
    0.19 * cosd(4 * P) +
    0.128 * sind(5 * P) -
    0.034 * cosd(5 * P) -
    0.038 * sind(6 * P) +
    0.031 * cosd(6 * P);
  return rev(lon);
}

/** Geocentric ecliptic longitude of a planet at a date. */
export function planetLongitude(planet: PlanetName, date: Date): number {
  const d = dayNumber(date);
  if (planet === 'Sun') return sunPosition(d).longitude;
  if (planet === 'Moon') return moonPosition(d).longitude;
  if (planet === 'Pluto') return plutoLongitude(d);

  const el = ELEMENTS[planet];
  const p = heliocentricCoords(el, d);

  // Earth's heliocentric position is opposite the Sun's geocentric one.
  const sun = sunPosition(d);
  const xs = sun.distance * cosd(sun.longitude);
  const ys = sun.distance * sind(sun.longitude);
  const xg = p.xh + xs;
  const yg = p.yh + ys;
  let lon = rev(Math.atan2(yg, xg) * DEG);

  // Main perturbation terms for Jupiter and Saturn.
  if (planet === 'Jupiter' || planet === 'Saturn') {
    const Mj = rev(ELEMENTS.Jupiter.M[0] + ELEMENTS.Jupiter.M[1] * d);
    const Msa = rev(ELEMENTS.Saturn.M[0] + ELEMENTS.Saturn.M[1] * d);
    if (planet === 'Jupiter') {
      lon +=
        -0.332 * sind(2 * Mj - 5 * Msa - 67.6) -
        0.056 * sind(2 * Mj - 5 * Msa + 21) +
        0.042 * sind(2 * Mj - 2 * Msa + 21) -
        0.036 * sind(Mj - 2 * Msa) +
        0.022 * cosd(Mj - Msa) +
        0.023 * sind(2 * Mj - 3 * Msa + 52) -
        0.016 * sind(Mj - 5 * Msa - 69);
    } else {
      lon +=
        0.812 * sind(2 * Mj - 5 * Msa - 67.6) -
        0.229 * cosd(2 * Mj - 4 * Msa - 2) +
        0.119 * sind(Mj - 2 * Msa - 3) +
        0.046 * sind(2 * Mj - 6 * Msa - 69) +
        0.014 * sind(Mj - 3 * Msa + 32);
    }
  }
  return rev(lon);
}

/* ------------------------------------------------------------- Ascendant */

/**
 * Ascendant (Rising sign longitude) from local sidereal time.
 * `dateUtc` is the birth moment in UTC; latitude/longitude in degrees
 * (east positive). Returns ecliptic longitude 0-360.
 */
export function ascendant(dateUtc: Date, latitude: number, longitude: number): number {
  const d = dayNumber(dateUtc);
  const sun = sunPosition(d);
  // GMST at 0h UT, in degrees, plus the day's elapsed rotation.
  const utHours =
    dateUtc.getUTCHours() +
    dateUtc.getUTCMinutes() / 60 +
    dateUtc.getUTCSeconds() / 3600;
  const gmst = rev(sun.meanLongitude + 180 + 360.98564736629 * (utHours / 24));
  const lst = rev(gmst + longitude); // local sidereal time, degrees
  const ramc = lst;
  const eps = 23.4393 - 3.563e-7 * d; // obliquity
  const asc = Math.atan2(
    cosd(ramc),
    -(sind(eps) * Math.tan(latitude * RAD) + cosd(eps) * sind(ramc)),
  );
  return rev(asc * DEG);
}

/* ------------------------------------------------------------- Birthplaces */

export interface City {
  name: string;
  province: string;
  lat: number;
  lon: number;
  /** Standard-time UTC offset (hours). v1 uses standard time; see How It Works. */
  utcOffset: number;
}

export const CANADIAN_CITIES: City[] = [
  { name: "St. John's", province: 'NL', lat: 47.56, lon: -52.71, utcOffset: -3.5 },
  { name: 'Halifax', province: 'NS', lat: 44.65, lon: -63.57, utcOffset: -4 },
  { name: 'Charlottetown', province: 'PE', lat: 46.24, lon: -63.13, utcOffset: -4 },
  { name: 'Fredericton', province: 'NB', lat: 45.96, lon: -66.64, utcOffset: -4 },
  { name: 'Moncton', province: 'NB', lat: 46.09, lon: -64.77, utcOffset: -4 },
  { name: 'Québec City', province: 'QC', lat: 46.81, lon: -71.21, utcOffset: -5 },
  { name: 'Montréal', province: 'QC', lat: 45.5, lon: -73.57, utcOffset: -5 },
  { name: 'Ottawa', province: 'ON', lat: 45.42, lon: -75.7, utcOffset: -5 },
  { name: 'Toronto', province: 'ON', lat: 43.65, lon: -79.38, utcOffset: -5 },
  { name: 'Hamilton', province: 'ON', lat: 43.26, lon: -79.87, utcOffset: -5 },
  { name: 'Kitchener-Waterloo', province: 'ON', lat: 43.45, lon: -80.48, utcOffset: -5 },
  { name: 'London', province: 'ON', lat: 42.98, lon: -81.25, utcOffset: -5 },
  { name: 'Windsor', province: 'ON', lat: 42.31, lon: -83.04, utcOffset: -5 },
  { name: 'Sudbury', province: 'ON', lat: 46.49, lon: -81.01, utcOffset: -5 },
  { name: 'Thunder Bay', province: 'ON', lat: 48.38, lon: -89.25, utcOffset: -5 },
  { name: 'Winnipeg', province: 'MB', lat: 49.9, lon: -97.14, utcOffset: -6 },
  { name: 'Regina', province: 'SK', lat: 50.45, lon: -104.61, utcOffset: -6 },
  { name: 'Saskatoon', province: 'SK', lat: 52.13, lon: -106.67, utcOffset: -6 },
  { name: 'Edmonton', province: 'AB', lat: 53.55, lon: -113.49, utcOffset: -7 },
  { name: 'Calgary', province: 'AB', lat: 51.04, lon: -114.07, utcOffset: -7 },
  { name: 'Yellowknife', province: 'NT', lat: 62.45, lon: -114.37, utcOffset: -7 },
  { name: 'Whitehorse', province: 'YT', lat: 60.72, lon: -135.05, utcOffset: -7 },
  { name: 'Vancouver', province: 'BC', lat: 49.28, lon: -123.12, utcOffset: -8 },
  { name: 'Surrey', province: 'BC', lat: 49.19, lon: -122.85, utcOffset: -8 },
  { name: 'Victoria', province: 'BC', lat: 48.43, lon: -123.37, utcOffset: -8 },
  { name: 'Kelowna', province: 'BC', lat: 49.89, lon: -119.5, utcOffset: -8 },
];

/** Toronto — used, and labelled as approximate, when a birthplace is not in the table. */
export const FALLBACK_CITY: City = CANADIAN_CITIES[8];

export function findCity(text: string): { city: City; approximate: boolean } {
  const q = text.trim().toLowerCase();
  if (q) {
    const hit = CANADIAN_CITIES.find(
      (c) => c.name.toLowerCase() === q || c.name.toLowerCase().startsWith(q),
    );
    if (hit) return { city: hit, approximate: false };
  }
  return { city: FALLBACK_CITY, approximate: true };
}

/* ------------------------------------------------------------ Natal chart */

export interface BirthProfile {
  firstName?: string;
  /** ISO date, yyyy-mm-dd */
  birthDate: string;
  /** "HH:MM" 24h local time, or null when the user does not know it. */
  birthTime: string | null;
  birthplace: string;
  tone: 'Gentle' | 'Direct';
  cadence: 'Daily' | 'Weekly';
}

export interface Placement {
  planet: PlanetName;
  sign: Sign;
  degree: number; // degree within the sign, 0-30
  longitude: number;
}

export interface NatalChart {
  placements: Placement[];
  sun: Placement;
  moon: Placement;
  /** Null when birth time is unknown — the Rising sign is then honestly unavailable. */
  rising: Placement | null;
  city: City;
  placeApproximate: boolean;
}

/** Convert a local birth date/time at the birthplace into a UTC Date (standard-time offset). */
export function birthMomentUtc(profile: BirthProfile, city: City): Date {
  const [y, m, dd] = profile.birthDate.split('-').map(Number);
  let hh = 12;
  let mm = 0;
  if (profile.birthTime) {
    const parts = profile.birthTime.split(':').map(Number);
    hh = parts[0] || 0;
    mm = parts[1] || 0;
  }
  // Local standard time -> UTC: add the (negative) offset back.
  return new Date(Date.UTC(y, (m || 1) - 1, dd || 1, hh - city.utcOffset, mm));
}

export function natalChart(profile: BirthProfile): NatalChart {
  const { city, approximate } = findCity(profile.birthplace);
  const moment = birthMomentUtc(profile, city);
  const placements: Placement[] = PLANET_NAMES.map((planet) => {
    const longitude = planetLongitude(planet, moment);
    return { planet, sign: signOf(longitude), degree: degreeInSign(longitude), longitude };
  });
  const byName = (p: PlanetName) => placements.find((x) => x.planet === p) as Placement;
  let rising: Placement | null = null;
  if (profile.birthTime) {
    const lon = ascendant(moment, city.lat, city.lon);
    rising = { planet: 'Sun', sign: signOf(lon), degree: degreeInSign(lon), longitude: lon };
    // Label the rising placement distinctly at render time; planet field is a
    // placeholder here and is never displayed for the Rising entry.
  }
  return {
    placements,
    sun: byName('Sun'),
    moon: byName('Moon'),
    rising,
    city,
    placeApproximate: approximate,
  };
}

/* --------------------------------------------------------------- Transits */

export interface WeekEvent {
  date: Date;
  kind: 'moon-ingress' | 'moon-phase';
  /** e.g. "Taurus" for an ingress, "Full Moon" for a phase event. */
  label: string;
  detail: string;
}

export interface TransitSnapshot {
  date: Date;
  moonSign: Sign;
  moonPhase: MoonPhaseInfo;
  sunSign: Sign;
  weekEvents: WeekEvent[];
}

const QUARTERS: { angle: number; label: string }[] = [
  { angle: 0, label: 'New Moon' },
  { angle: 90, label: 'First Quarter' },
  { angle: 180, label: 'Full Moon' },
  { angle: 270, label: 'Last Quarter' },
];

/**
 * The day's Moon sign and phase, plus the coming week's Moon sign changes
 * and quarter phases, each with a real computed date.
 */
export function transitsFor(date: Date): TransitSnapshot {
  const start = new Date(date);
  start.setHours(12, 0, 0, 0);
  const events: WeekEvent[] = [];

  const stepMs = 3 * 3600 * 1000; // 3-hour steps
  const spanMs = 7 * 24 * 3600 * 1000;
  let prev = new Date(start);
  let prevSign = moonSign(prev);
  let prevElong = moonPosition(dayNumber(prev)).elongation;

  for (let t = start.getTime() + stepMs; t <= start.getTime() + spanMs; t += stepMs) {
    const cur = new Date(t);
    const s = moonSign(cur);
    if (s !== prevSign) {
      // Refine to the nearest hour.
      let lo = prev.getTime();
      let hi = cur.getTime();
      while (hi - lo > 3600 * 1000) {
        const mid = new Date((lo + hi) / 2);
        if (moonSign(mid) === prevSign) lo = mid.getTime();
        else hi = mid.getTime();
      }
      const when = new Date(hi);
      events.push({
        date: when,
        kind: 'moon-ingress',
        label: s,
        detail: `The Moon moves into ${s}`,
      });
      prevSign = s;
    }
    const elong = moonPosition(dayNumber(cur)).elongation;
    for (const q of QUARTERS) {
      // Crossing a quarter boundary (allowing the 360 wrap at New Moon).
      const crossed =
        q.angle === 0
          ? prevElong > 300 && elong < 60
          : prevElong < q.angle && elong >= q.angle;
      if (crossed) {
        events.push({
          date: new Date(cur),
          kind: 'moon-phase',
          label: q.label,
          detail:
            q.label === 'Full Moon'
              ? `Full Moon in ${moonSign(cur)}`
              : q.label === 'New Moon'
                ? `New Moon in ${moonSign(cur)}`
                : `${q.label} Moon in ${moonSign(cur)}`,
        });
      }
    }
    prevElong = elong;
    prev = cur;
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return {
    date: start,
    moonSign: moonSign(start),
    moonPhase: moonPhase(start),
    sunSign: sunSign(start),
    weekEvents: events,
  };
}

/** Aspect between two longitudes: name and orb, or null when nothing close is applying. */
export function aspectBetween(
  lonA: number,
  lonB: number,
): { name: string; angle: number; orb: number } | null {
  const diff = Math.abs(rev(lonA - lonB + 180) - 180);
  const aspects = [
    { name: 'conjunction', angle: 0 },
    { name: 'sextile', angle: 60 },
    { name: 'square', angle: 90 },
    { name: 'trine', angle: 120 },
    { name: 'opposition', angle: 180 },
  ];
  for (const a of aspects) {
    const orb = Math.abs(diff - a.angle);
    if (orb <= 6) return { name: a.name, angle: a.angle, orb };
  }
  return null;
}
