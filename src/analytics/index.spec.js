'use strict';

describe('analytics', function(){

  describe('event', function(){

    it('should place an event in the queue when created', function(done){
      var sut = new Intelligence(require('../core/intelligence.spec.config.js'));
      sut.on('client_authenticated', function(token){
        expect(token).toBeDefined();

        // The token has been created so the events will be generated correctly
        var count = sut.getEventCount();

        var event = sut.event('a custom event', {});
        expect(sut.getEventCount()).toBeGreaterThan(count);
        done();
      });
    });

    it('should clear the queue when flushed', function(done){

      var sut = new Intelligence(require('../core/intelligence.spec.config.js'));
      sut.on('client_authenticated', function(token){
        expect(token).toBeDefined();

        // The token has been created so the events will be generated correctly
        var count = sut.getEventCount();

        var event = sut.event('a custom event', {});
        expect(sut.getEventCount()).toBeGreaterThan(count);

        sut.flushEvents();
        expect(sut.getEventCount()).toBe(0);

        done();
      });
    });


    it('should generate a fingerprint', function(done){
      var sut = new Intelligence(require('../core/intelligence.spec.config.js'));
      sut.on('client_authenticated', function(token){
        expect(token).toBeDefined();

        // The token has been created so the events will be generated correctly
        var count = sut.getEventCount();

        var event = sut.event('a fingerprint event', {});
        expect(sut.getEventCount()).toBeGreaterThan(count);

        expect(event.Metadata.DeviceId).toBeDefined();

        done();
      });
    });

    it('should generate a geolocation', function(done){
      var config = require('../core/intelligence.spec.config.js');
      config.analytics = {
        useGeolocation : true
      };

      var sut = new Intelligence(config);
      sut.on('client_authenticated', function(token){
        expect(token).toBeDefined();

        // The token has been created so the events will be generated correctly
        var count = sut.getEventCount();

        var event = sut.event('a geolocation event', {});

        expect(sut.getEventCount()).toBeGreaterThan(count);

        expect(event.Geolocation).toBeDefined();
        expect(event.Geolocation.Latitude).toBeDefined();
        expect(event.Geolocation.Longitude).toBeDefined();

        expect(event.Metadata.latitude).toBe(event.Geolocation.Latitude);
        expect(event.Metadata.longitude).toBe(event.Geolocation.Longitude);

        done();
      });

    });

  });
});