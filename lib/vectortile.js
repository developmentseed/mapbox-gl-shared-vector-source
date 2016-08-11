'use strict'

var util = require('mapbox-gl/js/util/util')
var CachedVectorTileLayer = require('./vectortilelayer')

module.exports = CachedVectorTile

function CachedVectorTile (vt, end) {
  var length = 0
  this.layers = util.mapObject(vt.layers, function (layer) {
    length += layer.length
    return new CachedVectorTileLayer(layer)
  })
  this.length = length
}

CachedVectorTile.prototype = {
  serialize: function () {
    return {
      length: this.length,
      layers: util.mapObject(this.layers, function (layer) { return layer.serialize() })
    }
  }
}
