// Loads all JSON bundles produced by the python pipeline once at boot.
window.HK = window.HK || {};

HK.loadAll = async function () {
  const files = {
    districts: 'data/districts.geojson',
    regions:   'data/regions.geojson',
    density:   'data/density_by_district.json',
    roomtype:  'data/roomtype_by_district.json',
    topics:    'data/topics_by_segment.json',
    wordcloud: 'data/wordcloud_by_segment.json',
    examples:  'data/examples_by_district.json',
    mix:       'data/mix_by_region.json',
    points:    'data/listing_points.json',
    seaMask:   'data/sea_mask.geojson',
  };
  const out = {};
  await Promise.all(Object.entries(files).map(async ([k, path]) => {
    const r = await fetch(path);
    if (!r.ok) throw new Error('failed to fetch ' + path + ' (' + r.status + ')');
    out[k] = await r.json();
  }));
  HK.DATA = out;
  return out;
};

// Helper: lookup the per-district density vector for the current selector.
HK.densityFor = function (compareBy, segment) {
  const D = HK.DATA.density.density;
  if (segment === 'all') return D.all.all;
  return (D[compareBy] && D[compareBy][segment]) || D.all.all;
};

// Helper: which scope_id to use for topic/wordcloud lookups.
HK.scopeId = function (scope) {
  if (scope.level === 'district') return scope.district;
  if (scope.level === 'region')   return scope.region;
  return 'all';
};

HK.scopeLabel = function (scope) {
  if (scope.level === 'district') return scope.district;
  if (scope.level === 'region')   return scope.region;
  return 'All Hong Kong';
};

HK.regionTagClass = function (region) {
  if (region === 'Hong Kong Island') return 'island';
  if (region === 'Kowloon')          return 'kowloon';
  if (region === 'New Territories')  return 'nt';
  return '';
};
