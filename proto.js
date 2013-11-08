
/**
 * Module dependencies.
 */

var bind = require('bind')
  , each = require('each')
  , object = require('object')
  , equals = require('equals')
  , toFunction = require('to-function');

/**
 * Module exports.
 */

/**
 * Get a value.
 *
 * @return {Any} the value at `attr` or `value` if none is set
 */

exports.get = function(attr, value){
  if (typeof value == 'function') return value();
  if (this._values[attr] === undefined) {
    if (typeof value != 'function') return value;
  }
  return this._values[attr];
};

/**
 * Set a value.
 *
 * @param {String} attr the attr to set
 * @param {Any} value the value to assign to the attr
 * @param {Boolean} silent true if no 'change' nor 'dirty' should be
 * fired
 */

exports.set = function(attr, value, silent){
  var self = this
    , orig = this._orig
    , old = this[attr]
    , opts = this.model._attrs[attr];

  // ignore undefined attrs
  if (opts === undefined) return value;
  if (value === old) return value;

  // convert the value into the type if necessary
  if (typeof opts.type == 'function') {
    if (!(value instanceof opts.type)) {
      value = new opts.type(value);

      // take the value of primitive javascript datatypes
      if (~[Number, Boolean, String].indexOf(opts.type)) {
        value = value.valueOf();
      }
    }
  }
  this._values[attr] = value;
  if (old && old.off) {
    this._unbind(old);
  }
  if (value != null && typeof value.on == 'function') {
    this._bind(value, attr);
  } else if (!silent && opts.persistent) {
    if (!(attr in orig)) orig[attr] = old;
    else if (equals(orig[attr], value)) delete orig[attr];
    this._updateDirty();
  }
  if (!silent) {
    this.emit('change', attr, value, old);
    this.emit('change ' + attr, value, old);
  }
  return value;
};

/**
 * Resets all values. Also iterates on all nested models.
 */

exports.reset = function(){
  var self = this;
  if (!this.dirty) return;
  each(this.model.attrs, function(attr){

    // skip dirty attr
    if (attr == 'dirty') return;
    var value = self[attr];
    if (value != null && typeof value.reset == 'function') {
      value.reset();
    } else {
      self[attr] = self._orig[attr];
    }
  });
};

/**
 * Resets the dirty bit.  Also iterates on all nested models.
 */

exports.resetDirty = function(){
  this._orig = {};
  var self = this;
  each(this.model._attrs, function(attr){

    // skip dirty attr
    if (attr == 'dirty') return;
    var value = self[attr];
    if (value != null) {
      if (typeof value.resetDirty == 'function') {
        value.resetDirty();
      }
    }
  });
  this._dirtyCount = 0;
  this._updateDirty();
};

/**
 * Bind to the change events of a submodel on `attr`.
 *
 * @api private
 */

exports._bind = function(model, attr){
  var self = this;

  // bind change event
  this._handlers.push({ model: model, fn: fire });
  model.on('change', fire);

  /**
   * Fire nested change events.
   */

  function fire(name, value, old){
    var opts = self.model._attrs[attr];
    if (name == 'dirty' && opts.persistent) {
      self._dirtyCount += (value ? 1 : -1);
      self._updateDirty();
      return;
    }
    var args = [].slice.call(arguments, 1);
    var keypath = attr + '.' + name;
    args.unshift(keypath);
    args.unshift('change');
    self.emit.apply(self, args);
    args.shift();
    args.shift();
    args.unshift('change ' + keypath);
    self.emit.apply(self, args);
  };
};

/**
 * Unbind the event handler of a model.
 *
 * @api private
 */

exports._unbind = function(model){
  for (var i = 0; i < this._handlers.length; ++i) {
    if (this._handlers[i].model == model) {
      model.off('change', this._handlers[i].fn);
      this._handlers.splice(i, 1);
      break;
    }
  }
};

/**
 * Update the dirty flag using the current `_dirtyCount` and original
 * values.
 *
 * @api private
 */

exports._updateDirty = function(){
  var orig = this._orig;
  this.dirty = (this._dirtyCount > 0 || object.length(orig) > 0);
};

/**
 * Check if the model is dirty at all or at `attr`.
 *
 * @param {String} [attr] the optional attr to check if dirty.
 */

exports.isDirty = function(attr){
  if (arguments.length == 0) return this.dirty;
  var fn = toFunction(attr.replace(/\.([0-9]+)(\.)?/g, '[$1]$2'))
    , value = fn(this);
  if (value && typeof value.isDirty == 'function') return value.isDirty();
  if (attr in this._orig) return true;

  // call isDirty for parent model, e.g. address.items[0].name
  var parts = attr.replace(/\.?([0-9]+)(\.)?/g, '[$1]$2').split('.');
  if (parts.length < 2) return false;
  var name = parts.pop();
  fn = toFunction(parts.join('.'));
  value = fn(this);
  if (value && typeof value.isDirty == 'function') return value.isDirty(name);

  return false;
};

/**
 * Update the models values.
 *
 * @param {Object} values the data update with
 */

exports.update = function(values){
  var self = this
    , attrs = this.model._attrs;
  each(values, function(key, value){
    if (key in attrs) self[key] = value;
  });
};

/**
 * Convert the model to a JSON object.  Calls .toJSON() on sub-objects
 * if available.
 */

exports.toJSON = function(){
  var self = this
    , json = {};
  each(this.model._attrs, function(attr, opts){
    if (!opts.persistent) return;
    var value = self[attr];
    if (value != null && value.toJSON) return json[attr] = value.toJSON();
    json[attr] = value;
  });
  return json;
};
