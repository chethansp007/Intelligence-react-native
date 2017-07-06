'use strict';

describe('User', function(){

  var intelligence = new Intelligence(require('../core/intelligence.spec.config.js')),
      defaultConfig = require('../core/intelligence.config').defaultConfig,
      User = require('../identity/User');

  describe('when created', function(){
    it( 'should not be creatable without the minimum of data', function() {
      var user = new User({
        Id : -1,
        Username : 'test username',
        FirstName : 'FirstName',
        CompanyId : -1,
        LastName : 'LastName',
        DateCreated : '2016-02-19T00:50:10.587Z',
        DateUpdated : '2016-02-19T00:50:10.587Z',
        MetaData : [{}]
      });

      expect(user.id).toBe(-1);
      expect(user.companyId).toBe(-1);
      expect(user.username).toBe('test username');
      expect(user.firstName).toBe('FirstName');
      expect(user.lastName).toBe('LastName');
      expect(user.fullName).toBe('FirstName LastName');
      expect(user.dateCreated instanceof Date).toBe(true);
      expect(user.dateUpdated instanceof Date).toBe(true);

      expect(user.metaData.length).toBe(1);
    });
  });

});