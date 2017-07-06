/*jshint node: true */
'use strict';

var _ = require('lodash');

/**
 * Creates the Intelligence core object.  See [intelligence/config]{@link module:intelligence/config}
 * to see what is available in the configuration.
 * @constructor
 * @module intelligence/core
 * @param  {Object} config configuration
 * @return {Object}        intelligence SDK
 */
module.exports = function(config){

  var defaults = require('./intelligence.config'),
      globalMethods = require('../utilities/commonMethods'),
      clientToken = null,
      preInitEvents = [];

  // Ensure all of the default config parameters are set
  config = _.merge({}, defaults.defaultConfig, config);

  // We can not proceed if there is no client identifiers
  if (!config.clientSecret || !config.clientId) {
    throw new Error('A client secret and client id must be provided');
  }

  if (!config.projectId) {
    throw new Error('A projectId must be provided');
  }

  // based on http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  var generateUUID = function(){
    // Get the current time to try to ensure uniqueness
    // In a browser any properties on window are easily accessible.  Not addressing window ensures
    // this works in node as well

    var date = null;

    if (globalMethods.isReactNative()){
        date = Date.now();
    }
    else{
       date = Date.now() + (typeof window !== 'undefined' ? window.performance.now() : process.hrtime());
    }

    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(character){
      var random = (date + Math.random()*16)%16 | 0;
      date = Math.floor(date/16);
      return (character==='x' ? random : (random&0x3|0x8)).toString(16);
    });
    return uuid;
  };

  var events = {},
    intelligence = {
    /**
     * Gets the version number for this SDK using the format of [semantic versoning 2.0]{@link http://semver.org/}
     * @function
      */
    version : defaults.version,
    /**
     * Adds an observer to the event listener.  The handler function will
     * be called when the event occurs
     * @function on
     *
     * @param  {String} event   The name of the event
     * @param  {Function} handler The function to call when the event occurs
     * @return {String}         An identifier for this handler if it needs to be removed
     */
    on : function(event, handler){
      var handlerID = generateUUID();
      if (!events[event]) {
        // We are not doing this in a list because we want to make it easy to remove
        // specific handlers
        events[event] = {};
      }
      events[event][handlerID] = handler;
      return handlerID;
    },

    /**
     * Notifies all handlers that a specific event has occurred
     * @function emit
     *
     * @param  {String} event The event that has occurred
     * @param  {Object} data The data to send to each listener
     * @return {Number}       The number of handlers that will be notified
     */
    emit : function(event, data){
      if (events[event]){
        var handlers = [];
        for (var key in events[event]) {
          handlers.push(events[event][key]);
        }
        setTimeout(function(){
          for (var index in handlers) {
            try {
              handlers[index](data);
            }
            catch(e)
            {
              console.log(e);
            }
          }
        }, 0);
        return handlers.length;
      }
      return 0;
    },

    /**
     * Remove the listener specified
     * @function removeListener
     *
     * @param  {String} event The event that we want to remove the listener for
     * @param  {String} handlerID The handlerID as given by the on function
     * @return {Boolean}           true if a handler was removed as a result
     *                             of this call
     */
    removeListener : function(event, handlerID){
      if (events[event] && events[event][handlerID]){
        delete events[event][handlerID];
        return true;
      }
      return false;
    }
  };

  // Modules are protected and can only be accessed through the public interface
  var analytics = new (require('../analytics'))(config, intelligence),
      identity = new (require('../identity'))(config, analytics, intelligence);

  /**
   * See [intelligence/identity.authenticate]{@link module:intelligence/identity~authenticate}
   * @function authenticate
   */
  intelligence.authenticate = function() {return identity.authenticate.apply(identity, arguments);};

  /**
   * See [intelligence/identity.isResolving]{@link module:intelligence/identity~isResolving}
   * @function isResolving
   */
  intelligence.isResolving = function() {return identity.isResolving.apply(identity, arguments);};

  /**
   * See [intelligence/identity.validate]{@link module:intelligence/identity~validate}
   * @function validate
   */
  intelligence.validate = function() {return identity.validate.apply(identity, arguments);};

  /**
   * See [intelligence/analytics.event]{@link module:intelligence/analytics~event}
   * @function event
   */
  intelligence.event = function() {

    // If the client token has been created then fire
    // events on that, otherwise wait until creation
    if (clientToken) {
      return clientToken.event.apply(clientToken, arguments);
    }
    preInitEvents.push(arguments);
    return null;
  };

  /**
   * See [intelligence/analytics.now]{@link module:intelligence/analytics~now}
   * @function now
   */
  intelligence.now = function() {
    // If the client token has been created then fire
    // events on that, otherwise wait until creation
    if (clientToken) {
      return clientToken.now.apply(clientToken, arguments);
    }
    preInitEvents.push(arguments);
    return null;
  };

  /**
   * See [intelligence/analytics.getEventCount]{@link module:intelligence/analytics~getEventCount}
   * @function getEventCount
   */
  intelligence.getEventCount = function() {return analytics.getEventCount.apply(analytics, arguments);};

  /**
   * See [intelligence/analytics.flush]{@link module:intelligence/analytics~flush}
   * @function flushEvents
   */
  intelligence.flushEvents = function() {return analytics.flush.apply(analytics, arguments);};

  /**
   * Initialises the intelligence SDK, should not be called externally
   */
  var init = function(){
    // Get the client token authentication
    // Get the client auth token
    intelligence.authenticate(function(err, token){
      clientToken = token;
      /**
       * Occurs when the client application has authenticated
       * @event client_authenticated
       * @property {module:intelligence/identity.AccessToken} the client app token
       */
      intelligence.emit('client_authenticated', {
        token : token
      });
      // Send any events that were stored prior to authentication
      if (preInitEvents.length > 0) {
        for (var i=0; i<preInitEvents.length; i++) {
          intelligence.event.apply(this, preInitEvents[i]);
          preInitEvents = [];
        }
        intelligence.flushEvents();
      }
    });

    // Initialise the analytics module
    analytics.init();

    // Initialise the identity module
    identity.init();


    if (!globalMethods.isReactNative ()) {

    // Watch for unloading of a page
    if (window) {
      var _pageDate = new Date();
      window.onbeforeunload = function(){
        intelligence.now('Intelligence.Identity.Application.Unload', {
          duration_millis : (new Date()).getTime() - _pageDate.getTime(),
          href : document ? document.href : ''
        });
      };


      // Watch for location changes
      var _locationDate = new Date();
      
      var _currentLocation = {
              href : window.location.href,
              hash : window.location.hash
            };
      window.onhashchange = function(){

        var nextLocation = {
              href : window.location.href,
              hash : window.location.hash
            };
        intelligence.now('Intelligence.Identity.Application.Unload', {
          duration_millis : (new Date()).getTime() - _pageDate.getTime(),
          previous_href : _currentLocation.href,
          previous_hash : _currentLocation.hash,
          new_href : nextLocation.href,
          new_hash : nextLocation.hash
        });
        _currentLocation = nextLocation;
      };
    }
   } 
  };

  init();

  // Return the intelligence object.  This is the only public interaction
  // point for any end users.
  return intelligence;

};