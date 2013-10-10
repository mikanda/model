
# model

  Lightweight model which supports proper dirty state and change events.

## Installation

  Install with [component(1)](http://component.io):

    $ component install mikanda/model

## Usage

  ```js
  var model = require('model');
  var Address = model()
    .attr('street')
    .attr('zipCode')
    .attr('locality');
  var User = model()
    .attr('name')
    .attr('age', Number)
    .attr('address', Address);

  var user = new User({
    name: 'Mister test',
    age: '49', /* Is automatically turned into a number */
    address: { street: '...' }
  });
  user.on('change', function(name, value, old){

    // `name` is the keypath to the value that changed; e.g.
    //
    //   - 'address.street'
    //   - 'name'
    //   - etc.
    //
    // `value` is the new value of the attribute and `old` was the old value

  });

  // fires the change event
  user.name = 'New name';

  // fires the change event with 'address.street' as name
  user.address.street = 'New street';

  // to listen to the change of a specific attribute only use the following
  user.on('change name', function(){

    // ...

  });
  ```

## model creation API

### constructor Model()

  Initializes a new model.

### Model.attr()

  Defines a new attribute.

#### Parameters

  * `{String} name` - Just the name of the attribute
  * `{Object|Function|Any} opts` - This can be either a `function` which is then
    handled as constructor (called with `new`) for each incoming value.  In
    case of an object it is handled as an options object which supports the
    following options:

     * `preset` - Acts as default value for the attribute.
       **default: undefined**
     * `persistent` - If false this value is not included within the JSON
       representation of the model and doesn't affect the dirty status of the
       model.  **default: false**

## model instance API

### Events

  * `change(name, value, old)` - Fired on every change of the model. `name` is
  the name of the attribute which changed, `value` is the 

### constructor model([values])

  Initializes the model with the given `values`.  `values` is an object
  holding the values for the model.  e.g. `{ name: 'My name', ... }

### model.ATTR

  Getter and setter for `ATTR`.  `ATTR` represents the attribute-name you want
  to access.  e.g. `model.name`.

  ```js
  ...

  var model = new Model({ name: 'Hans' });
  console.log(model.name);  // => 'Hans'

  // fires the change events
  model.name = 'Peter';
  ```

### model.update([values])

  Update the model with the given `values`.  Also calls constructors of the
  properties if defined.

### model.isDirty([attrName])

  Checks if the attribute at `attrName` is dirty.  If none is given checks if
  the whole model is dirty.

### model.resetDirty()

  Resets the dirty state of the model and all submodels.

### model.toJSON()

  Get a JSON representation of the model.  Excludes all attributes declared
  with the option `persistent: false`.

## Tests

  Checkout the repository and run the following commands:

    $ npm install
    $ component install --dev
    $ npm test

  This will run a test server on the port 3000.  Afterwards you should open
  your browser and navigate to `http://localhost:3000`.
