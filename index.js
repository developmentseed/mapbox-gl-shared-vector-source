'use strict'
var util = require('mapbox-gl/js/util/util')
var normalizeURL = require('mapbox-gl/js/util/mapbox').normalizeTileURL
var VectorSource = require('mapbox-gl/js/source/vector_tile_source')

var webworkify = require('webworkify')

module.exports = SharedVectorSource

function SharedVectorSource (id, options, dispatcher) {
  VectorSource.call(this, id, options, dispatcher)
}

var worker = webworkify(require('./register-worker'), {bare: true})
SharedVectorSource.workerSourceURL = URL.createObjectURL(worker)

SharedVectorSource.prototype = util.inherit(VectorSource, {
  type: 'vector-shared',
  loadTile: function (tile, callback) {
    var overscaling = tile.coord.z > this.maxzoom ? Math.pow(2, tile.coord.z - this.maxzoom) : 1
    var params = {
      type: 'vector-shared',
      url: normalizeURL(tile.coord.url(this.tiles, this.maxzoom, this.scheme), this.url),
      uid: tile.uid,
      coord: tile.coord,
      zoom: tile.coord.z,
      tileSize: this.tileSize * overscaling,
      source: this.id,
      overscaling: overscaling,
      angle: this.map.transform.angle,
      pitch: this.map.transform.pitch,
      showCollisionBoxes: this.map.showCollisionBoxes
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

      tile.loadVectorData(data, this.map.style)

      if (tile.redoWhenDone) {
        tile.redoWhenDone = false
        tile.redoPlacement(this)
      }

      callback(null)
    }
  }
})
