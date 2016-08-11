'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tap').test
var LRU = require('lru-cache')
var VectorTile = require('vector-tile').VectorTile
var Protobuf = require('pbf')
var CachedVectorTile = require('../lib/vectortile')

var tilesEqual = require('./helpers').tilesEqual

test('cached vector tile from pbf-parsed vector tile', function (t) {
  var data = fs.readFileSync(path.join(__dirname, '/fixtures/14-8801-5371.vector.pbf'))
  var tile = new VectorTile(new Protobuf(data))
  var cachedTile = new CachedVectorTile(tile)
  t.ok(tilesEqual(tile, cachedTile))
  t.end()
})

test('cached vt from plain JS object', function (t) {
  var data = fs.readFileSync(path.join(__dirname, '/fixtures/14-8801-5371.vector.pbf'))
  var tile = new VectorTile(new Protobuf(data))
  var cachedTile = new CachedVectorTile(tile)
  var deserialized = new CachedVectorTile(cachedTile)
  t.ok(tilesEqual(deserialized, tile))
  t.ok(tilesEqual(deserialized, cachedTile, true))
  t.end()
})

test('cached vt from LRU cache', function (t) {
  var cache = LRU({ max: 10 })
  var data = fs.readFileSync(path.join(__dirname, '/fixtures/14-8801-5371.vector.pbf'))

  var tile = new VectorTile(new Protobuf(data))
  cache.set('0', new CachedVectorTile(tile))
  var deserialized = new CachedVectorTile(cache.get('0'))

  t.ok(tilesEqual(deserialized, tile))
  t.end()
})

