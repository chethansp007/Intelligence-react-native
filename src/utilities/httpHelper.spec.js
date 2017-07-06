'use strict';

describe('httpHelper', function(){

  var sut = require('./httpHelper');

  describe('post', function(){
    it( 'should be able to post data', function(done) {
      sut.post('https://authentication.phoenixplatform.com.sg/v2/token', {},
        function(err, res){
          expect(res.body.error).toEqual('invalid_client');
          done();
        });
    });

    // Need to find a faster server, slows down the tests too much
    // it( 'will not error if it doesn\'t receive json', function(done) {
    //   sut.post('https://posttestserver.com/post.php', {},
    //     function(err, res){
    //       expect(res.body.response).toBeDefined();
    //       done();
    //     });
    // });
  });

  describe('queryString', function(){
    it('can convert json objects to query strings', function(){
      expect(sut.jsonToQuery({})).toEqual('');
      expect(sut.jsonToQuery({test:'test'})).toEqual('test=test');
      expect(sut.jsonToQuery({'test something':'test something'})).toEqual('test%20something=test%20something');
      expect(sut.jsonToQuery({test:'test', test1: 'test1'})).toEqual('test=test&test1=test1');
    });
  });

});