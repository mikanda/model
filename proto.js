
/**
 * Module dependencies.
 */

var bind = require('bind')
  , each = require('each')
  , object = require('object')
  , equals = require('equals')
  , type = require('type')
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
  var fn = this.model._attrs[attr].compute;
  if (fn) return fn.call(this, attr);
  if (this._values[attr] === undefined) return value;
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
    , opts = this.model._attrs[attr] || {}
    , orig = this._orig
    , old = this._values[attr] === undefined
        ? opts.preset
        : this._values[attr];

  // ignore undefined attrs
  if (opts === undefined) return value;
  if ((type(old) === 'object' && value === old)
    || (type(old) !== 'object' && equals(value, old))) return value;

  // convert the value into the type if necessary and not null
  if (typeof opts.type == 'function') {
    if (!(value instanceof opts.type) && value !== null) {
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
    else if ((type(orig[attr]) === 'object' && orig[attr] === value)
      || (type(orig[attr]) !== 'object' && equals(orig[attr], value))) delete orig[attr];
    this._updateDirty();
  }
  if (!silent) {
    this.emit('change', attr, value, old);
    this.emit('change ' + attr, value, old);
  }
  return value;
};

/**
 * Resets the given attribute or all values. Also iterates on all nested models.
 */

exports.reset = function(attr){
  var self = this;
  if (!this.dirty) return;
  function reset(attr) {

    // skip dirty attr
    if (attr == 'dirty') return;
    var value = self[attr];
    if (value != null && typeof value.reset == 'function') {
      value.reset();
    } else if (self._orig.hasOwnProperty(attr)) {
      self[attr] = self._orig[attr];
    }
  }
  return attr === undefined ? each(this.model.attrs, reset) : reset(attr);
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
  for (var key in values) {
    if (!values.hasOwnProperty(key)) continue;
    if (key in attrs) self[key] = values[key];
  }
};

/**
 * Clone the instance.
 */

exports.clone = function(){
  var Model = this.model;
  return new Model(this.toJSON(true));
};

/**
 * Convert the model to a JSON object.  Calls .toJSON() on sub-objects
 * if available.
 *
 * @param {Boolean} nonPersistent `true` if non-persistent attributes
 * should be included
 */

exports.toJSON = function(nonPersistent){
  var self = this
    , json = {};
  each(this.model._attrs, function(attr, opts){
    if (!nonPersistent && !opts.persistent) return;
    if (attr === 'dirty') return;
    var value = self[attr];
    if (value != null && value.toJSON) {
      return json[attr] = value.toJSON(nonPersistent);
    }
    json[attr] = value;
  });
  return json;
};
