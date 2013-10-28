

/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , each = require('each')
  , proto = require('./proto')
  , statics = require('./statics');


/**
 * Module exports.
 */

module.exports = model;


/**
 * Create new model.
 *
 * Generated models fire a 'construct' event when creating a new
 * instance.
 *
 * @return {Function} model constructor
 */

function model() {
  var Model = constructor();
  Emitter(Model);
  Emitter(Model.prototype);
  Model.attrs = Model._attrs = {
    dirty: { preset: false, persistent: false }
  };


  // bootstrap methods

  each(proto, function(key, fn){
    Model.prototype[key] = fn;
  });
  each(statics, function(key, fn){
    Model[key] = fn;
  });
  return Model;
}


/**
 * Create the new constructor.
 *
 * @return {Function}
 * @api private
 */

function constructor() {


  /**
   * Initialize new object.
   *
   * @param {Object} values the initial values to assign to the model
   */

  function Model(values) {
    values = values || {};
    var self = this;
    this._values = {};
    this._handlers = [];


    // save original values

    this._orig = {};
    this._dirtyCount = 0;
    this.model = Model;
    attrs(this);


    // set initial values

    for (var key in values) {
      if (!values.hasOwnProperty(key)) continue;
      self.set(key, values[key], true);
    }
    Model.emit('construct', this);
  }
  return Model;
}


/**
 * Initialize the attrs on a constructor.  Iterates over the attrs
 * registered on the model and bootstraps them.
 *
 * @param {Model} inst the model instance
 * @api private
 */

function attrs(inst) {


  // generate attr setter/getter

  each(inst.model._attrs, function(attr, opts){
    Object.defineProperty(inst, attr, {
      get: function(){
        return this.get(attr, opts.preset);
      },
      set: function(value){
        return this.set(attr, value);
      },
      enumerable: true
    });
  });
}
