var mapboxgl = require('mapbox-gl')
var stylesheet = require('mapbox-gl-styles/styles/bright-v9.json')

var SharedVectorSource = require('../')

mapboxgl.accessToken = window.getAccessToken()

var empty = Object.assign({}, stylesheet)
empty.sources = {}
empty.layers = []

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
window.addEventListener('click', function () { createMap(false) })

function createMap (addSourceType) {
  var div = document.createElement('div')
  div.className = 'map'
  document.body.appendChild(div)

  console.time('map load')
  var map = new mapboxgl.Map({
    container: div,
    zoom: 12.5,
    center: [-77.01866, 38.888],
    style: empty,
    workerCount: 1
  })

  map.on('load', function () {
    if (addSourceType) {
      map.addSourceType('vector-shared', SharedVectorSource, function (err) {
        if (err) { return console.error(err) }
        setStyle()
      })
    } else {
      setStyle()
    }
  })

  return map

  function setStyle () {
    for (var id in stylesheet.sources) {
      if (stylesheet.sources[id].type === 'vector') {
        stylesheet.sources[id].type = 'vector-shared'
      }
      map.addSource(id, stylesheet.sources[id])
    }
    stylesheet.layers
      .filter(function (layer) { return !map.getLayer(layer.id) })
      .map(function (layer) { return map.addLayer(layer) })

    map.on('render', function () {
      if (map.loaded()) {
        console.timeEnd('map load')
        map.off('render')
      }
    })
  }
}
