/*jshint node: true */
'use strict';

module.exports = (function(){
  var xhr = require('nets'),
      _ = require('lodash'),
      xhrInternals = require('xhr'),
      isFake = (window ? window.XMLHttpRequest : {}).toString().match('Fake');

  var call = function(method, uri, body, callback, headers){

      // As nets and the xhr library specifically store the XMLHttpRequest in an internal variable,
      // this makes it impossible to set up server mocks for http request.  To get around that
      // we have included xhr directly and are updating the XMLHttpRequest with each call.
      // This allows us to use frameworks such as sinon to test properly
      xhrInternals.XMLHttpRequest = window ? window.XMLHttpRequest || {} : {};

      headers = _.assign({
        'Content-Type' : 'application/json'
      }, headers || {});

      var request = xhr({
        method : method,
        body: body ? this.jsonToQuery(body) : null,
        uri: uri,
        headers: headers,
        encoding : !isFake ? null : {}
      }, function (err, res, body) {
        if (err) {
          console.error('An error occurred calling ' + uri);
          console.error(JSON.stringify(err));
          callback(err);
        }
        else
        {
          callback(err, {
            statusCode: res.statusCode,
            method: res.method,
            success: res.statusCode >= 200 && res.statusCode < 300,
            headers: res.headers,
            url: res.url,
            body: res.headers['content-type'].match(/^application\/json;/) ?
              JSON.parse(body) : {
                response : body
              }
          });
        }
      });
  };

  return {
    /**
     * Converts a json object to a query string.  This function does not
     * work recursively
     * @param  {Object} obj The object to convert to an encoded query string
     * @return {String}     The query string
     */
    jsonToQuery : function(obj) {
      if (Object.prototype.toString.call( obj ) !== '[object Array]') {
        var props = [];
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            props.push(encodeURIComponent(prop) + '=' + encodeURIComponent(obj[prop]));
          }
        }
        return props.join('&');
      }
      else
      {
        return JSON.stringify(obj);
      }
    },

    /**
     * Makes a post request to the desired URL
     * @param  {String}   uri      Full URI to post to
     * @param  {Object}   body     Object to post, the object is converted to a query string
     * @param  {Function} callback The callback function once a response is received
     */
    post : function(uri, body, callback, headers){
      call.call(this, 'post', uri, body, callback, headers);
    },
    /**
     * Makes a delete request to the desired URL
     * @param  {String}   uri      Full URI to sent the request to
     * @param  {Object}   body     Object to send, the object is converted to a query string
     * @param  {Function} callback The callback function once a response is received
     */
    del : function(uri, body, callback, headers){
      call.call(this, 'del', uri, body, callback, headers);
    },
    /**
     * Makes a get request to the desired URL
     * @param  {String}   uri      Full URI to sent the request to
     * @param  {Object}   body     Object to send, the object is converted to a query string
     * @param  {Function} callback The callback function once a response is received
     */
    get : function(uri, body, callback, headers){
      call.call(this, 'get', uri, body, callback, headers);
    }


  };

})();
