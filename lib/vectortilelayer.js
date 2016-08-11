'use strict'

var CachedVectorTileFeature = require('./vectortilefeature.js')

module.exports = CachedVectorTileLayer
var util = require('mapbox-gl/js/util/util')

function CachedVectorTileLayer (layer) {
  // Public
  Object.assign(this, util.pick(layer, ['version', 'name', 'extent', 'length']))

  // Private
  if (typeof layer.feature === 'function') {
    this._features = []
    for (var i = 0; i < layer.length; i++) {
      var feature = layer.feature(i)
      this._features.push(new CachedVectorTileFeature(feature))
    }
  } else {
    this._features = layer._features.map(function (feature) {
      return new CachedVectorTileFeature(feature)
    })
  }
}

CachedVectorTileLayer.prototype.feature = function (i) {
  return new CachedVectorTileFeature(this._features[i])
}

