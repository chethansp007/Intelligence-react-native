'use strict';

describe('core', function(){
  var config = require('./intelligence.spec.config'),
      defaultConfig = require('./intelligence.config').defaultConfig,
      sut = new Intelligence(config);

  describe('version', function(){
    it( 'should have a version', function() {
        expect(sut.version).toBeDefined();
    });
  });

  describe('event listener', function(){

    it ('should allow the registration of events', function(){
      expect(sut.on('test event', function(){})).not.toBeNull();
    });

    it ('should uniquely identify each handler', function(){
      var handlerId = sut.on('test event', function(){});
      expect(handlerId).not.toEqual(sut.on('test event', function(){}));
    });

    it ('should call a handler when notified of an event', function(done){

      expect(sut.emit('count event', {
        count : 5
      })).toEqual(0);

      sut.on('count event', function(data){
        expect(data.count).toEqual(5);
      });

      expect(sut.emit('count event', {
        count : 5
      })).toEqual(1);

      sut.on('count event', function(data){
        expect(data.count).toEqual(5);
        done();
      });

      expect(sut.emit('count event', {
        count : 5
      })).toEqual(2);
    });

    it ('should allow handlers to be removed', function(done){
      sut.on('remove event', function(data){
        expect(data.count).toEqual(5);
      });

      expect(sut.emit('remove event', {
        count : 5
      })).toEqual(1);

      var handlerID = sut.on('remove event', function(data){
        throw(new Error('This shouldn\'t be called'));
      });

      sut.on('remove event', function(data){
        expect(data.count).toEqual(5);
        done();
      });

      expect(sut.removeListener('remove event', 'Invalid ID')).toBe(false);
      expect(sut.removeListener('remove event', handlerID)).toBe(true);

      expect(sut.emit('remove event', {
        count : 5
      })).toEqual(2);
    });

  });

  describe('functionality', function(){
    it ('should require a client secret and a client id to create', function(){
      expect(function(){
        new Intelligence();
      }).toThrow();

      expect(function(){
        new Intelligence({
          clientId : 'test'
        });
      }).toThrow();

      expect(function(){
        new Intelligence({
          clientSecret : 'test'
        });
      }).toThrow();

      new Intelligence({
        clientId : 'test',
        clientSecret : 'test',
        projectId : 1
      });
    });

    if ('should require a projectId to create', function(){
      expect(function(){new Intelligence({
        clientId : 'test',
        clientSecret : 'test'
      });}).toThrow();

      new Intelligence({
        clientId : 'test',
        clientSecret : 'test',
        projectId : 1
      });
    });

    it ('should respond with an access token when attempting to validate', function(done){
      sut.authenticate(config.username, config.password, function(err, token){
        expect(err).toBeNull();
        expect(token).not.toBeNull();
        done();
      });
    });

    it ('should respond with an error token when attempting to validate', function(done){
      sut.authenticate('invalid@invalid.com', 'invalid', function(err, token){
        expect(err).not.toBeNull();
        expect(token).toBeUndefined();
        done();
      });
    });

    it ('should respond with an error when attempting to validate against invalid local store information', function(done){
      localStorage.setItem(defaultConfig.localStorage.accessTokenKey, JSON.stringify({
        accessToken : 'An invalid token',
        tokenType : 'Bearer',
        expiry : new Date(),
        created : new Date()
      }));

      sut.validate(function(err, token){
        expect(err).not.toBeNull();
        expect(token).toBeUndefined();
        done();
      });
    });

    it ('should respond with a token when attempting to validate against valid local store information if rememberMe is indicated', function(done){
      sut.authenticate(config.username, config.password, function(err, token){
        if (!err) {
          var storedToken = localStorage.getItem(defaultConfig.localStorage.accessTokenKey).accessToken;

          expect(storedToken).toBeUndefined();
        }
      });

      sut.authenticate(config.username, config.password, false, function(err, token){
        if (!err) {
          var storedToken = localStorage.getItem(defaultConfig.localStorage.accessTokenKey).accessToken;

          expect(storedToken).toBeUndefined();
        }
      });

      sut.authenticate(config.username, config.password, true, function(err, token){
        if (!err) {
          var storedToken = localStorage.getItem(defaultConfig.localStorage.accessTokenKey).accessToken;

          sut.validate(function(err, token){
            expect(err).toBeNull();
            expect(token).not.toBeNull();
            expect(storedToken).toEqual(localStorage.getItem(defaultConfig.localStorage.accessTokenKey).accessToken);
            done();
          });
        }
      });
    });

    it('allows the creation of events', function(){
      var event = sut.event('test', {meta : true});
      expect(event).toBeDefined();
      expect(event.ProjectId).toBeDefined();
    });

  });
});