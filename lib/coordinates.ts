/**
 * Convert WGS84 coordinates to the GCJ-02 datum used by mainland China map
 * providers such as the AMap (Gaode) raster tile source.
 *
 * The source data remains WGS84. Call this only at the map display boundary.
 * Coordinates outside the mainland-China bounding box are returned unchanged
 * because GCJ-02 must not be applied there.
 */
const AXIS = 6378245.0;
const ECCENTRICITY_SQUARED = 0.00669342162296594323;
const OUT_OF_CHINA = {
  minLongitude: 72.004,
  maxLongitude: 137.8347,
  minLatitude: 0.8293,
  maxLatitude: 55.8271,
};

function isOutsideChina(latitude: number, longitude: number) {
  return (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    longitude < OUT_OF_CHINA.minLongitude ||
    longitude > OUT_OF_CHINA.maxLongitude ||
    latitude < OUT_OF_CHINA.minLatitude ||
    latitude > OUT_OF_CHINA.maxLatitude
  );
}

function transformLatitude(x: number, y: number) {
  let result =
    -100.0 +
    2.0 * x +
    3.0 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  result +=
    ((20.0 * Math.sin(6.0 * x * Math.PI) +
      20.0 * Math.sin(2.0 * x * Math.PI)) *
      2.0) /
    3.0;
  result +=
    ((20.0 * Math.sin(y * Math.PI) +
      40.0 * Math.sin((y / 3.0) * Math.PI)) *
      2.0) /
    3.0;
  result +=
    ((160.0 * Math.sin((y / 12.0) * Math.PI) +
      320 * Math.sin((y * Math.PI) / 30.0)) *
      2.0) /
    3.0;
  return result;
}

function transformLongitude(x: number, y: number) {
  let result =
    300.0 +
    x +
    2.0 * y +
    0.1 * x * x +
    0.1 * x * y +
    0.1 * Math.sqrt(Math.abs(x));
  result +=
    ((20.0 * Math.sin(6.0 * x * Math.PI) +
      20.0 * Math.sin(2.0 * x * Math.PI)) *
      2.0) /
    3.0;
  result +=
    ((20.0 * Math.sin(x * Math.PI) +
      40.0 * Math.sin((x / 3.0) * Math.PI)) *
      2.0) /
    3.0;
  result +=
    ((150.0 * Math.sin((x / 12.0) * Math.PI) +
      300.0 * Math.sin((x / 30.0) * Math.PI)) *
      2.0) /
    3.0;
  return result;
}

/** Return a Leaflet-friendly [latitude, longitude] pair in GCJ-02. */
export function wgs84ToGcj02(latitude: number, longitude: number): [number, number] {
  if (isOutsideChina(latitude, longitude)) return [latitude, longitude];

  const deltaLatitude = transformLatitude(longitude - 105.0, latitude - 35.0);
  const deltaLongitude = transformLongitude(longitude - 105.0, latitude - 35.0);
  const latitudeRadians = (latitude / 180.0) * Math.PI;
  const sineLatitude = Math.sin(latitudeRadians);
  const magic = 1 - ECCENTRICITY_SQUARED * sineLatitude * sineLatitude;
  const squareRootMagic = Math.sqrt(magic);
  const adjustedLatitude =
    (deltaLatitude * 180.0) /
    (((AXIS * (1 - ECCENTRICITY_SQUARED)) / (magic * squareRootMagic)) * Math.PI);
  const adjustedLongitude =
    (deltaLongitude * 180.0) /
    ((AXIS / squareRootMagic) * Math.cos(latitudeRadians) * Math.PI);

  return [latitude + adjustedLatitude, longitude + adjustedLongitude];
}
