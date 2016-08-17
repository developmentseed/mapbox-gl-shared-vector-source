'use strict'
var vt = require('vector-tile')
var Protobuf = require('pbf')
var util = require('mapbox-gl/js/util/util')
var normalizeURL = require('mapbox-gl/js/util/mapbox').normalizeTileURL
var VectorSource = require('mapbox-gl/js/source/vector_tile_source')

var webworkify = require('webworkify')

module.exports = SharedVectorSource

function SharedVectorSource (id, options, dispatcher) {
  VectorSource.call(this, id, options, dispatcher)
  this.tileFeatures = {}
}

var worker = webworkify(require('./register-worker'), {bare: true})
SharedVectorSource.workerSourceURL = URL.createObjectURL(worker)

SharedVectorSource.prototype = util.inherit(VectorSource, {
  type: 'vector-shared-dynamic',
  update: function (data) {
    this._data = data
    this.fire('change')
  },

  loadTile: function (tile, callback) {
    var overscaling = tile.coord.z > this.maxzoom ? Math.pow(2, tile.coord.z - this.maxzoom) : 1
    var params = {
      type: this.type,
      url: normalizeURL(tile.coord.url(this.tiles, this.maxzoom, this.scheme), this.url),
      uid: tile.uid,
      coord: tile.coord,
      zoom: tile.coord.z,
      tileSize: this.tileSize * overscaling,
      source: this.id,
      overscaling: overscaling,
      angle: this.map.transform.angle,
      pitch: this.map.transform.pitch,
      showCollisionBoxes: this.map.showCollisionBoxes,
      propertyData: this._filterPropertiesForTile(tile)
    }

    if (!tile.workerID) {
      tile.workerID = tile.coord.id % this.dispatcher.actors.length
      if (typeof tile.workerID !== 'number') { throw new Error('Bad workerID ' + tile.workerID) }
    }

    if (tile.state === 'reloading') {
      params.rawTileData = tile.rawTileData
      this.dispatcher.send('reload tile', params, done.bind(this), tile.workerID)
    } else {
      this.dispatcher.send('load tile', params, done.bind(this), tile.workerID)
    }

    function done (err, data) {
      if (tile.aborted) {
        return
      }

      if (err) {
        return callback(err)
      }

      if (data.action === 'update-properties') {
        return this._handleTileUpdate(tile, data, callback)
      }

      this._handleTileLoad(tile, data, callback)
    }
  },

  _handleTileLoad: function (tile, data, callback) {
    tile.loadVectorData(data, this.map.style)

    // we need to parse the VT now, so might as well save it for use by the
    // feature index during query*Features
    this.vtLayers = new vt.VectorTile(new Protobuf(new Uint8Array(tile.rawTileData))).layers

    // store the feature id's for each feature in this vector tile.
    // tileFeatures = {
    //    [tile uid]: {
    //        [vt layer id]: [feature id, feature id, ... ]
    //    }
    // }
    var layers = this.tileFeatures[tile.uid] = {}
    for (var id in this.vtLayers) {
      var features = layers[id] = []
      var layer = this.vtLayers[id]
      for (var i = 0; i < layer.length; i++) {
        var feature = layer.feature(i)
        features.push(feature.id)
      }
    }

    if (tile.redoWhenDone) {
      tile.redoWhenDone = false
      tile.redoPlacement(this)
    }

    callback(null)
  },

  _handleTileUpdate: function (tile, data, callback) {
    // if the worker did a properties-only update, then we should only update
    // the paint vertex buffers
    for (var i = 0; i < data.buckets.length; i++) {
      var updatedBucket = data.buckets[i]
      var existingBucket = tile.buckets[updatedBucket.layerId]
      existingBucket.updatePaintVertexBuffers(updatedBucket.arrays)
    }
    return callback()
  },

  _filterPropertiesForTile: function (tile) {
    // copy the subset of the data needed for this tile
    if (!this._data || !this.tileFeatures[tile.uid]) { return null }
    var data = {}
    var tileFeatures = this.tileFeatures[tile.uid]
    for (var layer in tileFeatures) {
      for (var i = 0; i < tileFeatures[layer].length; i++) {
        var id = tileFeatures[layer][i]
        data[id] = this._data[id]
      }
    }
    return data
  }
})
