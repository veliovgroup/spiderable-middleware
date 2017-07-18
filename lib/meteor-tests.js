import Spiderable from 'meteor/ostrio:spiderable-middleware';

Meteor.startup(function(){
  if(Meteor.isServer){
    Tinytest.add('Has Spiderable Object', function(test){
      test.isTrue(_.isObject(Spiderable));
      console.log(new Spiderable({
          rootURL: 'http://example.com',
          serviceURL: 'https://render.ostr.io',
          auth: 'APIUser:APIPass'
      }));
    });
  }
});
