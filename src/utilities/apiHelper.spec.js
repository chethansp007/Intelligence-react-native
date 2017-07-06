'use strict';

describe('apiHelper', function(){

  describe('cleanUrl', function(){
    var config = {
      moduleEndpoint : 'https://{module}.test.module.com',
      apiEndpoint : 'https://api.phoenixplatform.com/{module}',
      test : {
        module : 'testModule',
        apiVersion : 'version'
      }
    };

    it( 'should replace {module} in the endpoint', function() {
      var sut = require('./apiHelper.js')(config, 'test');

      expect(sut.getModuleUrl('')).toEqual('https://testModule.test.module.com/version/');
      expect(sut.getModuleUrl('url')).toEqual('https://testModule.test.module.com/version/url');
      expect(sut.getModuleUrl('/url')).toEqual('https://testModule.test.module.com/version/url');

      expect(sut.getAPIUrl('')).toEqual('https://api.phoenixplatform.com/testModule/version/');
      expect(sut.getAPIUrl('url')).toEqual('https://api.phoenixplatform.com/testModule/version/url');
      expect(sut.getAPIUrl('/url')).toEqual('https://api.phoenixplatform.com/testModule/version/url');


    });

    it( 'should replace {module} in the endpoint when the module is not in the config', function() {
      var sut = require('./apiHelper.js')({
        moduleEndpoint : 'https://{module}.test.module.com',
        apiEndpoint : 'https://api.phoenixplatform.com/{module}'
      }, 'testing');

      expect(sut.getModuleUrl('')).toEqual('https://testing.test.module.com/v2/');
      expect(sut.getModuleUrl('url')).toEqual('https://testing.test.module.com/v2/url');
      expect(sut.getModuleUrl('/url')).toEqual('https://testing.test.module.com/v2/url');

      expect(sut.getAPIUrl('')).toEqual('https://api.phoenixplatform.com/testing/v1/');
      expect(sut.getAPIUrl('url')).toEqual('https://api.phoenixplatform.com/testing/v1/url');
      expect(sut.getAPIUrl('/url')).toEqual('https://api.phoenixplatform.com/testing/v1/url');
    });

  });
});