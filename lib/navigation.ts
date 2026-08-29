type NavigableSpot = {
  name: string;
  navigationUrl?: string;
};

export function getSpotNavigationUrl(spot: NavigableSpot) {
  if (spot.navigationUrl) return spot.navigationUrl;
  const keyword = encodeURIComponent(`大连理工大学 ${spot.name}`);
  return `https://uri.amap.com/search?keyword=${keyword}&city=${encodeURIComponent("大连")}&view=map&src=guangying-dagong`;
}
