'use strict'
var VTFeature = require('vector-tile').VectorTileFeature
var Point = require('point-geometry')

module.exports = CachedVectorTileFeature

function CachedVectorTileFeature (feature) {
    // Public
  this.properties = feature.properties

  this.extent = feature.extent
  this.type = feature.type

  // Private
  var isCached = feature instanceof CachedVectorTileFeature || typeof feature.loadGeometry !== 'function'
  this._lines = isCached ? feature._lines : feature.loadGeometry()
  this._bbox = isCached ? feature._bbox : feature.bbox()
}

CachedVectorTileFeature.types = ['Unknown', 'Point', 'LineString', 'Polygon']

CachedVectorTileFeature.prototype.loadGeometry = function () {
  return cloneGeometry(this._lines)
}
CachedVectorTileFeature.prototype.bbox = function () {
  return this._bbox.slice()
}
CachedVectorTileFeature.prototype.toGeoJSON = VTFeature.prototype.toGeoJSON

CachedVectorTileFeature.prototype.serialize = function () {
  return {
    properties: cloneProperties(this.properties),
    extent: this.extent,
    type: this.type,
    _lines: this.loadGeometry(),
    _bbox: this.bbox()
  }
}

function cloneGeometry (arr, bare) {
  var clone = arr.slice()
  var len = arr.length

  if (len === 0 || typeof clone[0] === 'number') { return clone }
  var points = typeof clone[0] === 'object' && typeof clone[0].x === 'number'

  for (var i = 0; i < len; i++) {
    clone[i] = points
      ? (bare ? {x: clone[i].x, y: clone[i].y} : new Point(clone[i].x, clone[i].y))
      : cloneGeometry(clone[i])
  }

  return clone
}

function cloneProperties (properties) {
  var clone = {}
  for (var k in properties) {
    clone[k] = properties[k]
  }
  return clone
}
