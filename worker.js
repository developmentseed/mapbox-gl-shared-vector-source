'use strict'
var VectorTile = require('vector-tile').VectorTile
var Protobuf = require('pbf')
var ajax = require('mapbox-gl/js/util/ajax')
var WorkerTile = require('mapbox-gl/js/source/worker_tile')
var LRU = require('lru-cache')
var CachedVectorTile = require('./lib/vectortile.js')

var cache = LRU({
  max: 1 + 4 + 16 + 64,
  length: function (tile) { return 1 }
})

module.exports = SharedVectorWorker

function SharedVectorWorker (actor, styleLayers) {
  this.actor = actor
  this.styleLayers = styleLayers
  this.loading = {}
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
        vt = new VectorTile(new Protobuf(new Uint8Array(rawTileData)))
        cache.set(params.url, {
          tile: new CachedVectorTile(vt),
          buffer: rawTileData.slice(0)
        })
      }

      tile.parse(vt, this.styleLayers.getLayerFamilies(), this.actor, rawTileData, callback)
    }
  },

  reloadTile: function (params, callback) {
    return this.loadTile(params, callback)
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
  },

  /**
   * @param {object} params
   * @param {string} params.url The URL of the tile PBF to load.
   */
  loadVectorData: function (params, callback) {
  }
}

