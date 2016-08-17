'use strict'

var util = require('mapbox-gl/js/util/util')
var CachedVectorTileLayer = require('./vectortilelayer')

module.exports = CachedVectorTile

/**
 * An alternative implementation of the VectorTile interface that is backed by
 * plain JS objects/arrays rather than a protobuf that is parsed on demand.
 * Trades away memory efficiency for faster feature.loadGeometry() calls.
 */
function CachedVectorTile (vt, properties) {
  var length = 0
  this.layers = util.mapObject(vt.layers, function (layer) {
    length += layer.length
    return new CachedVectorTileLayer(layer, properties)
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
