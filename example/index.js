var mapboxgl = require('mapbox-gl')

var SharedVectorSource = require('../')

mapboxgl.accessToken = window.getAccessToken()
mapboxgl.Source.addType('vector-shared-dynamic', SharedVectorSource)
createMap()
createMap()
createMap()

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
      url: 'mapbox://devseed.wapo-2016-us-election'
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
    setInterval(function () {
      var data = {}
      var i = Math.round(Math.random() * 50)
      data[i] = { x: Math.random() * 100 }
      map.getSource('us').update(data)
    }, 50)
  })
  .on('click', function () {
    map.setFilter('states', ['<', '$id', Math.random() * 100])
  })

  return map
}
