// API endpoints
const earthquakeApi = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
const tectonicPlatesApi = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Fetch earthquake data and initiate map creation
fetchData(earthquakeApi, createFeatures);

// Fetch data from API
function fetchData(apiUrl, callback) {
  d3.json(apiUrl).then(data => {
    console.log(data);
    callback(data.features);
  });
}

// Choose color based on depth
function chooseColor(depth) {
  const colors = ["#00FF00", "greenyellow", "yellow", "orange", "orangered", "#FF0000"];
  const thresholds = [10, 30, 50, 70, 90];
  for (let i = 0; i < thresholds.length; i++) {
    if (depth < thresholds[i]) return colors[i];
  }
  return colors[colors.length - 1];
}

// Create features for earthquakes
function createFeatures(earthquakeData) {
  const earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: bindPopups,
    pointToLayer: createMarker
  });
  createMap(earthquakes);
}

// Bind popup data to each feature
function bindPopups(feature, layer) {
  layer.bindPopup(`<h3>Location: ${feature.properties.place}</h3><hr><p>Date: ${new Date(feature.properties.time)}</p><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`);
}

// Create markers with custom properties
function createMarker(feature, latlng) {
  const markerOptions = {
    radius: feature.properties.mag * 20000,
    fillColor: chooseColor(feature.geometry.coordinates[2]),
    fillOpacity: 0.7,
    color: "black",
    weight: 0.5
  };
  return L.circle(latlng, markerOptions);
}

// Create the map
function createMap(earthquakes) {
  // Tile layers
  const tileLayers = {
    "Basic": createTileLayer('mapbox/streets-v11'),
    "Grayscale": createTileLayer('mapbox/light-v11'),
    "Outdoors": createTileLayer('mapbox/outdoors-v12')
  };

  // Tectonic plates layer
  const tectonicPlates = new L.layerGroup();
  fetchData(tectonicPlatesApi, data => {
    L.geoJSON(data, { color: "orange", weight: 2 }).addTo(tectonicPlates);
  });

  // Map initialization
  const myMap = L.map("map", {
    center: [37.09, -95.71],
    zoom: 5,
    layers: [tileLayers["Basic"], earthquakes, tectonicPlates]
  });

  // Add legend
  addLegend(myMap);

  // Layer control
  L.control.layers(tileLayers, {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonicPlates
  }, {
    collapsed: false
  }).addTo(myMap);
}

// Create a tile layer
function createTileLayer(style) {
  return L.tileLayer(`https://api.mapbox.com/styles/v1/{style}/tiles/{z}/{x}/{y}?access_token={access_token}`, {
    attribution: "Map attribution",
    style: style,
    access_token: api_key // Make sure to define your api_key
  });
}

// Add legend to map
function addLegend(map) {
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
    const div = L.DomUtil.create("div", "info legend");
    const depth = [-10, 10, 30, 50, 70, 90];
    div.innerHTML += "<h3 style='text-align: center'>Depth</h3>";
    for (let i = 0; i < depth.length; i++) {
      div.innerHTML += `<i style="background:${chooseColor(depth[i] + 1)}"></i> ${depth[i]}${depth[i + 1] ? `&ndash;${depth[i + 1]}<br>` : '+'}`;
    }
    return div;
  };
  legend.addTo(map);
}
