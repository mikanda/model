

/**
 * Module dependencies.
 */

var factory = require('factorify')
  , Charlatan = require('charlatan');


/**
 * Module exports.
 */

exports.User = factory()
  .attr('name', function(){
    return Charlatan.Name.name();
  })
  .attr('state', function(){
    return 'default';
  })
  .attr('lastLogin', function(){
    return new Date();
  })
  .attr('address', function(){
    return new exports.Address();
  })
  .attr('contact', function(){
    return new exports.Contact();
  });

exports.Address = factory()
  .attr('name', function(){
    return Charlatan.Name.name();
  })
  .attr('streetAddress', function(){
    return Charlatan.Address.streetAddress();
  })
  .attr('secondaryAddress', function(){
    return Charlatan.Address.secondaryAddress();
  })
  .attr('postalCode', function(){
    return Charlatan.Address.zipCode();
  })
  .attr('addressLocality', function(){
    return Charlatan.Address.city();
  })
  .attr('addressRegion', function(){
    return Charlatan.Address.county();
  })
  .attr('addressCountry', function(){
    return Charlatan.Address.country();
  });

exports.Contact = factory()
  .attr('name', function(){
    return Charlatan.Name.name();
  })
  .attr('streetAddress', function(){
    return Charlatan.Address.streetAddress() + ', '
            + Charlatan.Address.zipCode() + ' '
            + Charlatan.Address.city();
  })
  .attr('telephone', function(){
    return Charlatan.PhoneNumber.phoneNumber();
  })
  .attr('faxNumber', function(){
    return Charlatan.PhoneNumber.phoneNumber();
  })
  .attr('email', function(){
    return Charlatan.Internet.email();
  })
  .attr('area', function(){
    return null;
  });
