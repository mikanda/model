

/**
 * Module dependencies.
 */

var chai = require('chai')
  , request = require('superagent')
  , model = require('model')
  , expect = chai.expect;


/**
 * Tests.
 */

describe('Model', function(){
  it('should create a new model with primitive attrs', function(){
    var Model = model()
      .attr('name', '')
      .attr('myone', '');
    var m = new Model();
    expect(m.name).to.equal('');
    expect(m.myone).to.equal('');
    m.name = 'TestName';
    m.myone = 'MyOne';
    expect(m.name).to.equal('TestName');
    expect(m.myone).to.equal('MyOne');
  });
  it('should define preset values', function(){
    var Model = model()
      .attr('name', 'Name')
      .attr('myone', { preset: 'MyOne' });
    var m = new Model();
    expect(m.name).to.equal('Name');
    expect(m.myone).to.equal('MyOne');
  });
  it('should interprete persistent option', function(){
    var Model = model()
      .attr('name', { persistent: false })
      .attr('myone', { persisten: true });
    var m = new Model();
    m.myone = 'Test';
    expect(m.toJSON()).to.eql({ myone: 'Test' });
  });
  it('should load initial values', function(){
  });
  it('should interprete type', function(done){
    request
      .get('/address')
      .end(function(err, res){
        if (err) return done(err);
        var user = new User();
        user.address = res.body;
        expect(user.address instanceof Address).to.be['true'];
        expect(user.address.name).to.equal(res.body.name);
        request
          .get('/contact')
          .end(function(err, res){
            if (err) return done(err);
            user.contact = res.body;
            expect(user.contact instanceof Contact).to.be['true'];
            expect(user.contact.name).to.equal(res.body.name);
            done();
          });
      });
  });
  it('should load initial values', function(done){
    request
      .get('/user')
      .end(function(err, res){
        if (err) return done(err);
        var user = new User(res.body);
        expect(user.name).to.equal(res.body.name);
        expect(user.address instanceof Address).to.be['true'];
        expect(user.address.name).to.equal(res.body.address.name);
        expect(user.contact instanceof Contact).to.be['true'];
        expect(user.contact.name).to.equal(res.body.contact.name);
        done();
      });
  });
  it('should fire change events', function(done){
    request
      .get('/user')
      .end(function(err, res){
        if (err) return done(err);
        var user = new User(res.body)
          , spy = sinon.spy();
        var name = user.name;
        var addressName = user.address.name;
        user.on('change', spy);
        user.on('change name', spy);
        user.name = 'Hans';
        user.address.name = 'New one';
        setTimeout(function(){
          expect(spy.callCount).to.equal(4);
          expect(spy.args).to.eql([
            ['dirty', true, false],
            ['name', 'Hans', name],
            ['Hans', name],
            ['address.name', 'New one', addressName]
          ]);
          done();
        }, 0);
      });
  });
  it('should ignore setting a new value equals the old one', function(done){
    request
      .get('/user')
      .end(function(err, res){
        if (err) return done(err);
        var user = new User(res.body);
        var lastLogin = user.lastLogin;
        user.lastLogin = new Date(user.lastLogin);
        expect(user.dirty).to.be.false;
        expect(user.lastLogin).to.equal(lastLogin);
        done();
      });
  });
  describe('.reset()', function(){
    it('should reset the example model', function(done){
      request
        .get('/user')
        .end(function(err, res){
          if (err) return done(err);
          var user = new User(res.body);
          user.name = '';
          user.address.name = '';
          expect(user.dirty).to.be.true;
          user.reset();
          expect(user.dirty).to.be.false;
          expect(user.name).to.equal(res.body.name);
          expect(user.address.name).to.equal(res.body.address.name);
          done();
        });
      });
  });
  describe('.reset(name)', function(){
    it(
      'should reset attribute `name` and `address`.`name` of the example model',
      function(done){
        request
          .get('/user')
          .end(function(err, res){
            if (err) return done(err);
            var user = new User(res.body);
            user.name = '';
            user.address.name = '';
            expect(user.dirty).to.be.true;
            user.reset('name');
            expect(user.dirty).to.be.true;
            expect(user.name).to.equal(res.body.name);
            expect(user.address.name).not.to.equal(res.body.address.name);
            user.address.reset('name');
            expect(user.dirty).to.be.false;
            expect(user.address.name).to.equal(res.body.address.name);
            done();
          });
      });
  });
  describe('.clone()', function(){
    it('should make a clone of the model with all non-persistent options', function(done){
      request
        .get('/user')
        .end(function(err, res){
          if (err) return done(err);
          var user = new User(res.body);
          expect(user.state).to.equal('default');
          expect(user.toJSON().state).to.be.undefined;
          expect(user.toJSON(true).state).to.equal('default');
          var clone = user.clone();
          expect(clone).to.not.equal(user);
          expect(clone.toJSON(true)).eql(user.toJSON(true));
          done();
        });
      });
  });
});


/**
 * Models.
 */

var Address = model()
  .attr('name')
  .attr('streetAddress')
  .attr('secondaryAddress')
  .attr('postalCode')
  .attr('addressLocality')
  .attr('addressRegion')
  .attr('addressCountry');

var Contact = model()
  .attr('name')
  .attr('streetAddress')
  .attr('telephone')
  .attr('faxNumber')
  .attr('email')
  .attr('area');

var User = model()
  .attr('name')
  .attr('state', { persistent: false })
  .attr('lastLogin', Date)
  .attr('address', Address)
  .attr('contact', { type: Contact });
