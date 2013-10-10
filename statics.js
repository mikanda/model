
/**
 * Module exports.
 */

/**
 * Define an attribute.
 *
 *   `value` can be either:
 *     - a primitive value which is then used as preset value.
 *     - an options object.
 *
 *   Options:
 *     - `preset`: Defines a default value.
 *     - `persistent`: This is a boolean indicating if this attr should be
 *           included in the JSON representation.  If set to `false` there
 *           will be no `dirty` change on an update of this value and it
 *           won't be available in the object resulting from `.toJSON()`.
 *
 * @param {String|Number|Boolean|Object} value
 * @return {Function} `self` for chaining
 */

exports.attr = function(name, value){
  var opts = {};
  if (typeof value == 'object') opts = value;
  else if (typeof value == 'function') opts.type = value;
  else if (value !== undefined) opts.preset = value;
  opts.persistent = opts.persistent == undefined ? true : !!opts.persistent;
  this._attrs[name] = opts;
  return this;
};

/**
 * Use a plugin.
 *
 * @param {Function} plugin `function(Model)` to call on construction.
 */

exports.use = function(plugin){
  plugin(this);
  return this;
};
