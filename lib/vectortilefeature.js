'use strict'

var VTFeature = require('vector-tile').VectorTileFeature
var Point = require('point-geometry')

module.exports = CachedVectorTileFeature

function CachedVectorTileFeature (feature) {
    // Public
  this.properties = Object.assign({}, feature.properties)
  this.extent = feature.extent
  this.type = feature.type

  // Private
  var lines = typeof feature.loadGeometry === 'function' ? feature.loadGeometry() : feature._lines
  this._lines = cloneArray(lines)
  var bbox = typeof feature.bbox === 'function' ? feature.bbox() : feature._bbox
  this._bbox = cloneArray(bbox)
}

CachedVectorTileFeature.types = ['Unknown', 'Point', 'LineString', 'Polygon']

CachedVectorTileFeature.prototype.loadGeometry = function () {
  return cloneArray(this._lines)
}
CachedVectorTileFeature.prototype.bbox = function () {
  return cloneArray(this._bbox)
}
CachedVectorTileFeature.prototype.toGeoJSON = VTFeature.prototype.toGeoJSON

function cloneArray (arr) {
  if (Array.isArray(arr)) {
    return arr.map(cloneArray)
  }
  if (typeof arr === 'object' && typeof arr.x === 'number') {
    return new Point(arr.x, arr.y)
  }
  return arr
}
