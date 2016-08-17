/**
 * Return a hash for the given object, suitable for use as a content-based
 * identifier for the object, particulary as a JS object key.
 *
 * On a full style JSON object, this particular implementation is 0.5x
 * the speed of plain JSON.stringify, but the resulting keys, being
 * smaller, lead to object lookups that are 15x faster.
 *
 * (It's also a couple orders of magnitude faster than md5 or sha1 via
 * https://github.com/puleos/object-hash)
 *
 * Algorithm: 32 bit FNV-1a hash
 * Ref: http://stackoverflow.com/a/22429679
 *
 * @param {object} obj the input value
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {string}
 * @private
 */
module.exports = function hashFnv32a (obj, seed) {
  var str = JSON.stringify(obj)
  var i
  var l
  var hval = (seed === undefined) ? 0x811c9dc5 : seed

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i)
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
  }
    // Convert to 8 digit hex string
  return ('0000000' + (hval >>> 0).toString(16)).substr(-8)
}
