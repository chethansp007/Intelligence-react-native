'use strict';

describe('Companies', function(){

  var intelligence = new Intelligence(require('../core/intelligence.spec.config.js')),
      defaultConfig = require('../core/intelligence.config').defaultConfig,
      Company = require('../identity/Company');

  describe('when created', function(){
    it( 'should correctly parse the input parameters', function() {
      var sut = new Company({
        Id : -1,
        ProviderId : -1,
        Name : 'test',
        Reference : 'reference',
        IsActive : true,
        DateCreated : '2016-02-19T00:50:10.587Z',
        DateUpdated : '2016-02-19T00:50:10.587Z',
        MetaData : [{}]
      });

      expect(sut.id).toBe(-1);
      expect(sut.name).toBe('test');
      expect(sut.reference).toBe('reference');
      expect(sut.isActive).toBe(true);
      expect(sut.dateCreated instanceof Date).toBe(true);
      expect(sut.dateUpdated instanceof Date).toBe(true);
      expect(sut.metaData.length).toBe(1);
    });
  });

});

