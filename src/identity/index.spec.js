'use strict';

describe('identity', function(){

  var config = require('../core/intelligence.spec.config.js');
  var sut = new Intelligence(config);

  describe('user', function(){
    it( 'should have an authenticate method', function() {
        expect(sut.authenticate).toBeDefined();
    });

    it('should not authenticate an invalid user', function(done){
      sut.authenticate('test', 'invalid', function(err){
        expect(err).toBeDefined();
        done();
      });
    });

    it('should authenticate a valid user', function(done){
      sut.authenticate(config.username, config.password, function(err, token){
        expect(err).toBeNull();
        expect(token).toBeDefined();
        done();
      });
    });

    it('should fire an authenticated event when a user is authenticated', function(done){
      var eventId = sut.on('authenticated', function(data){
        sut.removeListener('authenticated', eventId);
        expect(data.accessToken).toBeDefined();
        expect(typeof data.accessToken.validate).toBe('function');
        done();
      });

      sut.authenticate(config.username, config.password, function(err, token){
      });
    });

    it('should authenticate as an application if no token is found and no credentials are passed', function(done){
      sut.authenticate(function(err, token){
        expect(err).toBeNull();
        expect(token).toBeDefined();
        done();
      });
    });

    it('should be able to check if the identity is being resolved', function(done){
      var eventId = sut.on('resolved', function(data){
        expect(sut.isResolving()).toBe(false);
        sut.removeListener('resolved', eventId);
        expect(data).toBeDefined();
        done();
      });

      sut.authenticate(config.username, config.password, function(err, token){
      });
    });
  });
});