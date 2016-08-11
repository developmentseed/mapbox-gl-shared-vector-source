# mapbox-gl-shared-vector-source

A custom vector tile source for mapbox-gl that caches and shares parsed vector
tiles across Map instances.

## example

Clone, `npm install`, run `npm start`, and open http://localhost:9966/.

Clicking on the window boots up a new map; watch the console for time to first
full map render.

## usage

```js
var mapboxgl = require('mapboxgl')
var SharedVectorSource = require('mapbox-gl-shared-vector-source')

var map = new mapboxgl.Map({
  container: 'map',
  zoom: 12.5,
  center: [-77.01866, 38.888],
  style: 'mapbox://youraccount.yourstyle'
})

map.on('load', function () {
  map.addSourceType('vector-shared', SharedVectorSource, function (err) {
    if (err) { return console.error(err) }
    map.addLayer({ /* a style layer */ })
  })
})
```
