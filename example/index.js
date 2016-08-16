var mapboxgl = require('mapbox-gl')

var SharedVectorSource = require('../')

mapboxgl.accessToken = window.getAccessToken()
mapboxgl.Source.addType('vector-shared-dynamic', SharedVectorSource)

window.testHelpers = require('../test/helpers')
var deepdiff = require('deep-diff').diff
window.diff = function (o1, o2) {
  var changes = deepdiff(o1, o2)
  changes.forEach(function (d) {
    if (d.kind === 'A') {
      console.log(d.kind, d.index, d.item.kind, d.item.lhs, d.item.rhs)
    } else {
      console.log(d.kind, d.path.join('.'), d.lhs, d.rhs)
    }
  })
}

createMap(true)
// window.addEventListener('click', function () { createMap(false) })

function createMap () {
  var div = document.createElement('div')
  div.className = 'map'
  document.body.appendChild(div)

  var map = new mapboxgl.Map({
    container: div,
    zoom: 0,
    center: [0, 0],
    style: {
      version: 8,
      glyphs: 'mapbox://fonts/devseed/{fontstack}/{range}.pbf',
      sources: {},
      layers: [{
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#003333' }
      }]
    },
    workerCount: 1
  })
  .on('load', function () {
    map.addSource('us', {
      type: 'vector-shared-dynamic',
      url: 'http://localhost:8080/index.json'
    })
    map.addLayer({
      id: 'states',
      type: 'fill',
      source: 'us',
      'source-layer': 'states',
      paint: {
        'fill-color': {
          property: 'x',
          stops: [
            [0, '#888888'],
            [100, '#ffff00']
          ]
        },
        'fill-outline-color': '#440033'
      }
    })
  })
  .on('click', function (e) {
    var f = map.queryRenderedFeatures(e.point, { layers: ['states'] })
    if (!f[0]) return
    f = f[0]
    var data = {}
    data[f.id] = { x: Math.random() * 100 }
    map.getSource('us').update(data)
    console.log(f)
  })
  return map
}
