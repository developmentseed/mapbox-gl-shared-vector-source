'use strict'

var SharedVectorWorker = require('./worker')
module.exports = function (self) {
  self.registerWorkerSource('vector-shared-dynamic', SharedVectorWorker)
}
