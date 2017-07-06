'use strict';

describe('Providers', function(){

  var intelligence = new Intelligence(require('../core/intelligence.spec.config.js')),
      defaultConfig = require('../core/intelligence.config').defaultConfig,
      Provider = require('../identity/Provider');

  describe('when created', function(){
    it( 'should not be creatable without the minimum of data', function() {
      var provider = new Provider({
        Id : -1,
        Name : 'test',
        DateCreated : '2016-02-19T00:50:10.587Z',
        DateUpdated : '2016-02-19T00:50:10.587Z',
      });

      expect(provider.id).toBe(-1);
      expect(provider.name).toBe('test');
      expect(provider.dateCreated instanceof Date).toBe(true);
      expect(provider.dateUpdated instanceof Date).toBe(true);
    });
  });

});