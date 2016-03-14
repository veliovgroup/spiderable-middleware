Meteor.startup(function(){
  if(Meteor.isServer){
    Tinytest.add('Has Spiderable Object', function(test){
      test.isTrue(_.isObject(Spiderable));
      console.log(new Spiderable());
    });
  }
});