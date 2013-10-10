

/**
 * Module dependencies.
 */

var fs = require('fs')
  , express = require('express')
  , Builder = require('component-builder')
  , factories = require('./factories')
  , writeFile = fs.writeFileSync;


/**
 * Module exports.
 */

var app = module.exports = express();
app.set('view engine', 'jade');
app.set('views', __dirname);
app.use(express.static(__dirname));
app.use(function(req, res, next){
  var builder = new Builder('.');
  builder.development();
  builder.copyAssetsTo('test');
  builder.build(function(err, res){
    if (err) return next(err);
    writeFile('test/build.js', res.require + res.js);
    writeFile('test/build.css', res.css);
    next();
  });
});
app.get('/', function(req, res){
  res.render('index');
});
app.get('/user', function(req, res){
  res.send(new factories.User());
});
app.get('/address', function(req, res){
  res.send(new factories.Address());
});
app.get('/contact', function(req, res){
  res.send(new factories.Contact());
});
app.listen(3000, function(){
  require('util').log('test server listening on port 3000');
});
