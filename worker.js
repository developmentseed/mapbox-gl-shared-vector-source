'use strict'
var VectorTile = require('vector-tile').VectorTile
var Protobuf = require('pbf')
var ajax = require('mapbox-gl/js/util/ajax')
var WorkerTile = require('mapbox-gl/js/source/worker_tile')
var LRU = require('lru-cache')
var CachedVectorTile = require('./lib/vectortile.js')

var hash = require('./lib/object-hash')

var cache = LRU({
  max: 1 + 4 + 16 + 64,
  length: function (tile) { return 1 }
})

module.exports = SharedVectorWorker

function SharedVectorWorker (actor, style) {
  this.actor = actor
  this.style = style
  this.loading = {}
  this.loaded = {}
}

SharedVectorWorker.prototype = {
  /**
   * Implements {@link WorkerSource#loadTile}.
   *
   * @param {object} params
   * @param {string} params.source The id of the source for which we're loading this tile.
   * @param {string} params.uid The UID for this tile.
   * @param {TileCoord} params.coord
   * @param {number} params.zoom
   * @param {number} params.overscaling
   * @param {number} params.angle
   * @param {number} params.pitch
   * @param {boolean} params.showCollisionBoxes
   */
  loadTile: function (params, callback) {
    var source = params.source
    var uid = params.uid

    if (!this.loading[source]) {
      this.loading[source] = {}
    }

    var tile = this.loading[source][uid] = new WorkerTile(params)

    var cached = cache.get(params.url)
    if (cached) {
      var vt = new CachedVectorTile(cached.tile)
      var data = cached.buffer.slice(0)
      console.log('cache hit', vt)
      var timer = setTimeout(done.bind(this), 0, null, data, vt)
      tile.abort = function () { clearTimeout(timer) }
    } else {
      var xhr = ajax.getArrayBuffer(params.url, done.bind(this))
      tile.abort = function () { xhr.abort() }
    }

    function done (err, rawTileData, cachedTile) {
      if (err) { return callback(err) }
      var vt
      if (cachedTile) {
        vt = new CachedVectorTile(cachedTile)
      } else {
        vt = new CachedVectorTile(new VectorTile(new Protobuf(new Uint8Array(rawTileData))))
        console.log(vt.serialize())
        cache.set(params.url, {
          tile: vt.serialize(),
          buffer: rawTileData.slice(0)
        })
      }

      tile.parse(vt, this.style.getLayerFamilies(), this.actor, rawTileData, callback)
      tile._style = this.getStyleHash()
      this.loaded[source] = this.loaded[source] || {}
      this.loaded[source][uid] = tile
    }
  },

  updateTile: function (params, callback) {
    var source = params.source
    var uid = params.uid
    if (!this.loaded[source] || !this.loaded[source][uid]) {
      return callback()
    }

    var layerFamilies = this.style.getLayerFamilies()
    var tile = this.loaded[source][uid]

    // we have params.propertyData, which maps feature ids to properties
    // objects.
    // transform it into an object mapping layer ids to (possibly sparse)
    // arrays of updated feature properties
    var propertyData = {}
    var layers = tile.data.layers
    for (var layerId in layers) {
      propertyData[layerId] = []
      for (var i = 0; i < layers[layerId].length; i++) {
        var id = layers[layerId].feature(i).id
        if (typeof id !== 'undefined' && params.propertyData[id]) {
          propertyData[layerId].push(params.propertyData[id])
        } else {
          propertyData[layerId].push(null)
        }
      }
    }

    tile.updateProperties(propertyData, layerFamilies, this.actor, done.bind(this))

    function done (err, data, buffers) {
      if (err) { return callback(err) }
      data.action = 'update-properties'
      callback(err, data, buffers)
    }
  },

  reloadTile: function (params, callback) {
    var source = params.source
    var uid = params.uid
    var style = this.getStyleHash()
    var tile = this.loaded[source] && this.loaded[source][uid]
    if (params.propertyData && tile && tile._style === style) {
      // just update the properties, because the style hasn't changed
      this.updateTile(params, callback)
    } else {
      this.loadTile(params, callback)
    }
  },

  abortTile: function (params) {
    var loading = this.loading[params.source]
    var uid = params.uid
    if (loading && loading[uid] && loading[uid].abort) {
      loading[uid].abort()
      delete loading[uid]
    }
  },

  removeTile: function (params) {
    var source = params.source
    var uid = params.uid
    if (this.loaded[source] && this.loaded[source][uid]) {
      delete this.loaded[source][uid]
    }
  },

  getStyleHash: function () {
    var serialized = {}
    var layerFamilies = this.style.getLayerFamilies()
    for (var k in layerFamilies) {
      var parent = layerFamilies[k][0]
      serialized[k] = parent.serialize()
    }
    return hash(serialized)
  }
}
