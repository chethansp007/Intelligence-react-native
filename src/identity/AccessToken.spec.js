'use strict';

describe('AccessTokens', function(){
  var config = require('../core/intelligence.spec.config.js');
  var intelligence = new Intelligence(config),
      defaultConfig = require('../core/intelligence.config').defaultConfig;

  describe('when not existing', function(){
    it( 'should not be directly creatable', function() {
      expect(function(){var AccessToken = new AccessToken();}).toThrow();
      expect(function(){var AccessToken = new AccessToken({});}).toThrow();
      expect(function(){var AccessToken = new AccessToken({}, {});}).toThrow();
    });
  });

  describe('analytics', function(){

    it('should be able to place an event in the queue', function(done){
      intelligence.authenticate(config.username, config.password, function(err, token){
        var eventCount = intelligence.getEventCount();
        token.event('Phoenix.Identity.Application.Opened');
        expect(eventCount).toBeLessThan(intelligence.getEventCount());
        done();
      });
    });

    it('should be able to send events', function(done){
      intelligence.authenticate(config.username, config.password, function(err, token){
        var eventCount = intelligence.getEventCount();
        token.event('Phoenix.Identity.Application.Opened');
        token.event('Phoenix.Identity.User.Authenticated');
        token.event('Phoenix.Identity.User.Authenticated', function(event, count){
          expect(count).toBeGreaterThan(0);

          token.now('Phoenix.Identity.Application.Opened', function(event, count, flushed){
              // Either everything was flushed, or we were unable to flush
              // because the queue was already in the process of flushing
              expect(count === 0 || flushed === 0).toBe(true);
              done();
          });
        });
      });
    });

    it('should be able to raise events when authenticated as an application', function(done){
      intelligence.authenticate(function(err, token){
        var eventCount = intelligence.getEventCount();
        token.event('Phoenix.Identity.Application.Opened.Test');
        token.event('Phoenix.Identity.Application.Opened.Test');

        token.event('Phoenix.Identity.Application.Opened.Test', function(event, count){
          expect(eventCount).toBeLessThan(count);

          token.now('Phoenix.Identity.Application.Opened.Test', function(event, count, flushed){
            // Either everything was flushed, or we were unable to flush
            // because the queue was already in the process of flushing
            expect(count === 0 || flushed === 0).toBe(true);
            done();
          });
        });
      });
    });

  });


  describe('when valid', function(){

    var sut = null;
    var gettingSut = false;

    beforeEach(function(done){

      var timeout = function(done, delay){
        if (!sut) {
          setTimeout(function(){
            timeout(done, delay);
          }, delay);
        }
        else {
          done();
        }
      };

      if (!gettingSut) {
        gettingSut = true;
        if (!sut) {
          intelligence.authenticate(config.username, config.password, function(err, token){
            sut = token || err;
            done();
          });
        }
      }
      timeout(done, 100);
    });

    it('should have an expires date later than now', function(){
      expect(sut.expires.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should have a token type', function(){
      expect(sut.token_type).toBeDefined();
    });

    it('should increase its expiry time when refreshed', function(done){
      var current = sut.expires.getTime();
      sut.refresh(function(err, token){
        expect(current).toBeLessThan(sut.expires.getTime());
        expect(err).toBeNull();
        expect(token).toBe(sut);

        // And we should be able to refresh multiple times
        sut.refresh(function(err, token){
          expect(err).toBeNull();
          done();
        });
      });
    });

    it('should be able to validate', function(done){
      var current = sut.expires.getTime();
      sut.validate(function(err, token){
        expect(err).toBeNull();
        expect(current).toBeLessThan(sut.expires.getTime());
        expect(current).toBeLessThan(token.expires.getTime());
        expect(sut.expires.getTime()).toBe(token.expires.getTime());
        expect(token).not.toBe(sut);
        done();
      });
    });

    it('should allow expiring of the token', function(done){
      intelligence.authenticate(config.username, config.password, true, function(err, token){
        if (token)
        {
          expect(localStorage.getItem(defaultConfig.localStorage.accessTokenKey).accessToken).not.toBeNull();

          token.expire(function(err){

            if (!err) {
              // Check to make sure the local storage has also been cleared out
              expect(localStorage.getItem(defaultConfig.localStorage.accessTokenKey.accessToken)).toBeNull();
              expect(token.token_type).toBeNull();
              expect(token.expires.getTime() <= new Date().getTime());
              done();
            }
          });
        }
      });
    });

    it('should fire an event when refreshed', function(done){
      intelligence.authenticate(config.username, config.password, function(err, token){
        if (token)
        {
          var eventId = intelligence.on('refreshed', function(data){
            intelligence.removeListener('refreshed', eventId);
            expect(data.accessToken).toBeDefined();
            expect(typeof data.accessToken.validate).toBe('function');
            done();
          });
          token.refresh();
        }
      });
    });

    it('should fire an event when validated', function(done){
      var eventId = intelligence.on('validated', function(data){
        intelligence.removeListener('validated', eventId);
        expect(data.accessToken).toBeDefined();
        expect(typeof data.accessToken.validate).toBe('function');
        done();
      });

      sut.validate();
    });

    it('should fire an event when expired', function(done){
      intelligence.authenticate(config.username, config.password, function(err, token){
        if (token)
        {
          expect(localStorage.getItem(defaultConfig.localStorage.accessTokenKey).accessToken).not.toBeNull();
          var eventId = intelligence.on('expired', function(data){
            intelligence.removeListener('expired', eventId);
            done();
          });
          token.expire();
        }
      });
    });

    it ('will retrieve a list of valid providers after authentication', function(done){
      intelligence.authenticate(config.username, config.password, function(err, token){

        intelligence.on('updated-providers', function(data){
          expect(data.providers).toBeDefined();
          expect(data.providers.length).toBe(1);

          // For the time being there will be 1 provider
          var provider = data.providers[0];
          expect(provider.id).toBe(300);
          expect(provider.name).toBe('Intelligence');
          done();
      });

      });
    });

    it ('will retrieve a list of valid companies after authentication', function(done){
      intelligence.authenticate(config.username, config.password, function(err, token){

        intelligence.on('updated-companies', function(data){
          expect(data.companies).toBeDefined();
          expect(data.companies.length >= 1).toBe(true);
          expect(data.companies.length).toBe(token.getCompanies().length);
          done();
      });

      });
    });

    it ('will retrieve a list of valid projects after authentication', function(done){
      intelligence.authenticate(config.username, config.password, function(err, token){

        intelligence.on('updated-projects', function(data){
          expect(data.projects).toBeDefined();
          expect(data.projects.length >= 1).toBe(true);
          expect(data.projects.length).toBe(token.getProjects().length);
          done();
      });

      });
    });

    it ('will retrieve the user information after authentication', function(done){
      intelligence.authenticate(config.username, config.password, function(err, token){

        intelligence.on('updated-user', function(data){
          expect(data.user).toBeDefined();
          expect(data.user.username).toBe(config.username);

          done();
      });

      });
    });


  });
});