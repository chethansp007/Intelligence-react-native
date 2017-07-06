/*jshint node: true */
'use strict';

/**
 * The functions encompassing identification of the user and device to ensure
 * interactions with the APIs are properly associated to the user
 * @module intelligence/identity
 * @param  {Object} config the configuration options
 * @param  {Object} annalytics the analytics engine
 * @param  {Object} intelligence the intelligence instance being used
 * @return {Object}        the identity module
 */

import { AsyncStorage } from 'react-native'

module.exports = function(config, analytics, intelligence){

  var idConfig = config.identity,
      resolving = false,
      authApiHelper = (require('../utilities/apiHelper'))(config, 'authentication'),
      identityApiHelper = (require('../utilities/apiHelper'))(config, 'identity'),
      httpHelper = require('../utilities/httpHelper'),
      AccessToken = require('./AccessToken'),
      Project = require('./Project'),
      Company = require('./Company'),
      Provider = require('./Provider'),
      globalMethods = require('../utilities/commonMethods'),
      User = require('./User');

  var identity = {};

  function setResolving(isResolving, token) {
    if (resolving !== isResolving) {
      resolving = isResolving;

      // We are attempting to resolve the account
      if (isResolving) {
        /**
         * Occurs when an attempt to authenticate or validate the
         * user has started
         * @event resolving
         */
        intelligence.emit('resolving');
      } else {
        /**
         * Occurs when an attempt to authenticate or validate the
         * user has completed
         * @event resolved
         * @type {Object}
         * @property {Object} token undefined if the attempt failed, [AccessToken](module:intelligence/identity.AccessToken) if successful
         */
        intelligence.emit('resolved', {
          token : token
        });
      }
    }
  }

  /**
   * Helper function to call XHR requests
   * @private
   * @param  {String} method  the method to use for the call
   * @param  {String} path    the path to make the call to
   * @param  {Object} params  the parameters to pass
   * @param  {Function} failure the function to call if we fail
   * @param  {Function} success the function to call if we succeed
   * @param  {Object} helper the API Helper to be using for this query, defaults to authApiHelper
   */
  var call = function(method, path, params, failure, success, headers, helper){
    httpHelper[method](path.match(/^https?:\/\//) ? path : (helper || authApiHelper).getModuleUrl(path), params, function(err, res){
      if (!err) {
        if (res.success) {
          success(res);
        }
        else {
          failure(res);
        }
      }
      else {
        failure(err);
      }
    },
    headers);
  };

  /**
   * Authenticates the user.  Once the user is authenticated callback will
   * be called.  Callback should take the form:
   * function(err, AccessToken);
   *
   * If authenticatin is unsuccessful then err will be not null
   * If authentication is successful then err will be null and AccessToken
   * will contain a token object.
   *
   * @function authenticate
   *
   * @param  {String}   username The user name to authenticate with
   * @param  {String}   password The password to authenticate with
   * @param  {boolean}  [rememberMe = false] if true the sdk will store a cookie to remember the user
   * @param  {Function} callback The function to call after attempting
   *
   * @fires authenticated
   *
   */
  identity.authenticate = function(username, password, rememberMe, callback){

    var isClient = false;

    // Attempting to authenticate as a client
    if (!username || typeof username === 'function') {
      callback = username;
      username = null;
      password = null;
      rememberMe = false;
      isClient = true;
    }

    // Ensure the parameters are aligned correctly
    if (typeof rememberMe === 'function') {
      callback = rememberMe;
      rememberMe = false;
    }

    if (!isClient) {
      setResolving(true);
    }

    call('post', idConfig.urls.token.path, password ? {
        grant_type : 'password',
        client_id : config.clientId,
        client_secret : config.clientSecret,
        username : username,
         
        // If we are using the md5 hash, hash the password
        password : idConfig.md5Hash ? require('md5')(password).toUpperCase() : password,
        remember_me : rememberMe
      } : {
          grant_type : 'client_credentials',
          client_id : config.clientId,
          client_secret : config.clientSecret
        },
        function(res){
          if (!isClient) {
            // Authentication has failed
            intelligence.now('Phoenix.Identity.User.AuthenticationFailed');
          }
          if (callback) {
            callback(res.body);
          }
          if (!isClient) {
            setResolving(false);
          }
        },
        function(res){

          // We have successfully authenticated
          var token = new AccessToken(res.body, identity, analytics, intelligence, !!password);

          if (!isClient) {
            token.event('Phoenix.Identity.User.Authenticated');

            var str = rememberMe ? ( JSON.stringify({
                accessToken : res.body.access_token,
                tokenType : res.body.token_type,
                expiry : token.expires,
                created : token.created
              })) : " ";
            
            setItemToStorage(config.localStorage.accessTokenKey,str,() => {
            }); 
          }

          if (callback) {
            callback(null, token);
          }
          if (!isClient) {
            setResolving(false, token);

            /**
             * Occurs when the user has been properly authenticated
             * @event authenticated
             * @type {object}
             * @property {Object} accessToken the [AccessToken]{@link module:intelligence/identity.AccessToken} for the user authenticated
             */
            intelligence.emit('authenticated', {
              accessToken : token
            });
          }
        },
         //headers        
          (idConfig.md5Hash) ? { "X-Auth-Intelligence" : "V2" } : { }
      );
  };

  /**
   * Refreshes the users authentication token to extend the expiry date.
   * Once the token is refreshed callback will be called.
   * Callback should take the form:
   * function(err, token)
   *
   * If refresh is unsuccessfull then err will not be null, otherwise err
   * will be null.  Token will be non null only if successful and will be a
   * reference to the same AccessToken that refresh was called from
   *
   * @function refresh
   *
   * @param  {String}   refreshToken The valid refresh token for this user
   * @param  {Function} callback     The callback to call when completed
   */
  identity.refresh = function(refreshToken, callback){

    call('post', idConfig.urls.token.path, {
        grant_type : 'refresh_token',
        client_id : config.clientId,
        client_secret : config.clientSecret,
        refresh_token : refreshToken
      },
      function(res){
        if (callback) {
          callback(res.body);
        }
      },
      function(res){
        if (callback) {
          callback(null, res.body);
        }
      });
  };


  var getItemFromStorage = function(key,callback) {

    if (globalMethods.isReactNative()){
         AsyncStorage.getItem(key, (err, result) => {

          var token = null;

          if (null == err){
                 token = JSON.parse(result);
            }
          
          callback(err,token);                
        });


    }
   //  else{
   //          var localStore = require('browser-storage'),
   //     token = JSON.parse(localStore.getItem(config.localStorage.accessTokenKey));
   //     callback(err,result);
      
   // }
 }

  var setItemToStorage = function(key,value,callback) {


    if (globalMethods.isReactNative()){
        AsyncStorage.setItem(key, value,  (err,status) => {
              callback(err,status);
      });
    }
    // else{
    //       require('browser-storage').setItem(key,value);
    //       callback(err,status);
    // }
  }

  /**
   * Validates the token given.  This ensures that the token is still valid
   * and updates the expiry date to be in sync with the server.
   * Callback should take the form:
   * function(err, token)
   *
   * If the token is validated then err will be null and token will be a reference
   * to the AccessToken that called the validate method.  If the token is not validated
   * then accessToken will be null while err will contain the error
   *
   * If tokenType is a function then it is assumed that tokenType is the callback and
   * that the actual tokenType and accessToken parameters are taken from localstorage
   *
   * @function validate
   *
   * @param  {String}   tokenType   The type of token we are validating (usually Bearer)
   * @param  {String}   accessToken The access token for this user
   * @param  {Function} callback    The function to call after the server has responded
   */
  identity.validate = function(tokenType, accessToken, callback){

    var localToken = null;

    // If tokenType is a function then we should look to validate from the local storage
    if (typeof tokenType === 'function')
    {

    getItemFromStorage(config.localStorage.accessTokenKey,(err,result)=>{

    if(null == err){
            
             var token = result;
            
              callback = tokenType;

     if (token &&
        token.tokenType &&
        token.accessToken)
      {
        tokenType = token.tokenType;
        accessToken = token.accessToken;
      }
      else
      {
        if (callback) {
          // There was no token in local store (or we couldn't retrieve it)
          callback(new Error('No token found'), null);
          return;
        }
      }
      localToken = token;
    

    setResolving(true);

    call('get', idConfig.urls.validate.path, null,
      function(res){
        intelligence.now('Phoenix.Identity.Token.Expired', localToken);
        if (callback) {
          callback(res.body);
        }
        setResolving(false);
      },

      function(res){
        var token = new AccessToken(res.body, identity, analytics, intelligence, true);

        token.event('Phoenix.Identity.Application.Opened');

            var str = JSON.stringify({
            accessToken : res.body.access_token,
            tokenType : res.body.token_type,
            expiry : token.expires,
            created : token.created
                });
            
            setItemToStorage(config.localStorage.accessTokenKey,str,(err,status) => {
            }); 

        if (callback) {
          callback(null, token);
        }

        setResolving(false, token);

        /**
         * Occurs when the [AccessToken]{@link module:intelligence/identity.AccessToken} has been properly [validated]{@link module:intelligence/identity.AccessToken.validate}
         * @event validated
         * @type {Object}
         * @property {Object} accessToken the [AccessToken]{@link module:intelligence/identity.AccessToken} for the user authenticated
         */
        intelligence.emit('validated', {
          accessToken : token
        });

      }, {
        Authorization : tokenType + ' ' + accessToken,
        Accept : 'application/json'
      });
          }
       });   
     }
  };

  /**
   * Expires the current token.  This makes the token unusable and another
   * token must be retrieved in order to validate or authenticate the user
   *
   * @function expire
   *
   * @param  {string}   accessToken The access token that is being used
   * @param  {Function} callback    The function to call once the token has been
   *                                expired
   */
  identity.expire = function(accessToken, callback){
    // Make sure the tokens match.  This isn't really required as it shouldn't
    // be possible to call this function directly anyway.

    getItemFromStorage(config.localStorage.accessTokenKey,(error,result) => {

        if ( null == error){
          
          var  token =  result;

           if (token){

              token = JSON.parse(token);
            
                if (token) {
                  var err = (accessToken !== token.accessToken) ? new Error('invalid access token') : null;
                  
                  if (err === null) {
                        // if we are using cookies or not, okay to clear
                        setItemToStorage(config.localStorage.accessTokenKey,"");                            
             }
          }
        }

        if (callback) {
            callback(err);
        }
      }
    });
  };

  /**
   * Intelligence is currently a top level provider, this means that for the time being
   * provider 300 is the only provider that needs to be returned.
   *
   * @function retrieveProviders
   *
   * @param  {String}   tokenType   The type of token that is requesting the provider
   * @param  {String}   accessToken The access token that represents the user making the request
   * @param  {Function} callback    The function to call when the server has responded
   * @return {Object}               The details around the provider returned
   */
  identity.retrieveProviders = function(tokenType, accessToken, callback){
    call('get', 'providers/' + config.providerId, null, function(res){
      if (callback) {
        callback(res.body);
      }

    }, function(res){
      if (callback) {
        // Convert to proper Provider Objects
        var providers = [];
        if (res && res.body && res.body.Data && Object.prototype.toString.call(res.body.Data) === '[object Array]') {
          for (var i =0 ; i<res.body.Data.length; i++) {
            providers.push(new Provider(res.body.Data[i]));
          }
        }
        callback(null, providers);
      }
    }, {
        Authorization : tokenType + ' ' + accessToken,
        Accept : 'application/json'
      },
      identityApiHelper);
  };

  /**
   * Retrieves the user information for the authenticated user
   *
   * @function retrieveUserInfo
   *
   * @param  {String}   tokenType   The type of token that is requesting the user info
   * @param  {String}   accessToken The access token that represents the user making the request
   * @param  {Function} callback    The function to call when the server has responded
   * @return {Object}               The details around the user returned
   */
  identity.retrieveUserInfo = function(tokenType, accessToken, callback){
    call('get', 'providers/' + config.providerId + '/users/me', null, function(res){
      if (callback) {
        callback(res.body);
      }
    }, function(res){
      if (callback){
        callback(null, new User(res.body.Data[0]));
      }
    }, {
      Authorization : tokenType + ' ' + accessToken,
      Accept : 'application/json'
    },
    identityApiHelper);
  };

  /**
   * Retrieves the company information for companies accessible by the authenticated user
   *
   * @function retrieveCompanyInfo
   *
   * @param  {String}   tokenType   The type of token that is requesting the info
   * @param  {String}   accessToken The access token that represents the user making the request
   * @param  {Function} callback    The function to call when the server has responded
   * @return {Object}               The list of companies, empty list if none
   */
  identity.retrieveCompanyInfo = function(tokenType, accessToken, callback){
    call('get', 'providers/' + config.providerId + '/companies', null, function(res){
      if (callback) {
        callback(res.body);
      }
    }, function(res){
      if (callback){
        var companies = [];
        for (var i=0; i<res.body.Data.length; i++) {
          companies.push(new Company(res.body.Data[i]));
        }
        callback(null, companies);
      }
    }, {
      Authorization : tokenType + ' ' + accessToken,
      Accept : 'application/json'
    },
    identityApiHelper);
  };

  /**
   * Retrieves the project information for project accessible by the authenticated user
   *
   * @function retrieveProjectInfo
   *
   * @param  {String}   tokenType   The type of token that is requesting the info
   * @param  {String}   accessToken The access token that represents the user making the request
   * @param  {Function} callback    The function to call when the server has responded
   * @return {Object}               The list of projects, empty list if none
   */
  identity.retrieveProjectInfo = function(companyId, tokenType, accessToken, callback){
    call('get', 'companies/' + companyId + '/projects', null, function(res){
      if (callback) {
        callback(res.body);
      }
    }, function(res){
      if (callback){
        var projects = [];
        for (var i=0; i<res.body.Data.length; i++) {
          projects.push(new Project(res.body.Data[i]));
        }
        callback(null, projects);
      }
    }, {
      Authorization : tokenType + ' ' + accessToken,
      Accept : 'application/json'
    },
    identityApiHelper);
  };

  /**
   * Determines if intelligence is currently attempting to
   * resolve the user through either authenticate or validate
   *
   * @function isResolving
   *
   * @return {Boolean} true if attempting to resolve. False otherwise
   */
  identity.isResolving = function(){
    return resolving;
  };

  /**
   * Helper function to initialise the identity function.  This is called by
   * the intelligence init procedure and should not be called directly
   */
  identity.init = function(){

  };

  return identity;
};