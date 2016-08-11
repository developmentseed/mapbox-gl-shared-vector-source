'use strict'

var util = require('mapbox-gl/js/util/util')
var VTFeature = require('vector-tile').VectorTileFeature
var Point = require('point-geometry')

module.exports = CachedVectorTileFeature

function CachedVectorTileFeature (feature) {
    // Public
  this.properties = Object.assign({}, feature.properties)
  this.extent = feature.extent
  this.type = feature.type

  // Private
  this._lines = typeof feature.loadGeometry === 'function'
    ? feature.loadGeometry()
    : cloneArray(feature._lines)
  var bbox = typeof feature.bbox === 'function' ? feature.bbox() : cloneArray(feature._bbox)
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

CachedVectorTileFeature.prototype.serialize = function () {
  return Object.assign(util.pick(this, ['properties', 'extent', 'type']), {
    _lines: cloneArray(this._lines, true),
    _bbox: this._bbox
  })
}

function cloneArray (arr, bare) {
  if (Array.isArray(arr)) {
    return arr.map(cloneArray)
  }
  if (typeof arr === 'object' && typeof arr.x === 'number') {
    return bare ? {x: arr.x, y: arr.y} : new Point(arr.x, arr.y)
  }
  return arr
}
