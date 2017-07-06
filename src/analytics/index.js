/*jshint node: true */
'use strict';

/**
 * Analytics encompasses funtionality related to generating and retrieving events.
 *
 * The module takes care of caching and sending events to the server as required.
 *
 * There are two types of events, real-time, and analytical.  The difference
 * being analytical events when they occur may not be send to the server immediately
 * but rather stored and sent and a convenient time.  This is in order to reduce
 * hits to the server, extend battery life on any devices that this sdk is
 * executing on, and reduce network activity as much as possible.
 *
 * On the other hand real-time events are sent as soon as they occur.  The thinking
 * is that real-time events will be triggering actions to occur in real time at the
 * api layer.
 *
 * If a real-time event is triggered and there are analytical events in the queue
 * then they will all be sent at the same time.
 *
 * As a default, page load and unload trigger events.  Page load is a pseudo event
 * as we do have to wait until Intelligence is loaded and ready.
 *
 * No events will be sent to the server until an access token is aquired.
 *
 * Geolocation, if required will be appended to events once it is determined
 *
 * @module intelligence/analytics
 * @param  {Object} config the configuration options
 * @param  {Object } intelligence the intelligence instance being used
 * @return {Object}        the analytics module
 */
module.exports = function(config, intelligence){

  var idConfig = config.analytics,
      apiHelper = (require('../utilities/apiHelper'))(config, 'analytics'),
      httpHelper = require('../utilities/httpHelper'),
      globalMethods = require('../utilities/commonMethods'),
      _ = require('lodash'),
       uniqueId = require('react-native-unique-id'),
       Fingerprint = undefined;


  var events = [],
      analytics = {},
      eventData = null,
      flushing = false,
      interval = 0,
      fingerprint = null;


      if (globalMethods.isReactNative()){
          
        uniqueId((error, id) => {

              if (null == error){
                      fingerprint = id;
                }
          });
      }
      // else{
       
      // Fingerprint = (typeof window !== 'undefined') ? require('fingerprintjs2') :
      
      // function(){
      //   return {
      //     get : function(callback) {
      //       callback('nodeinstance', []);
      //     }
      //   };
      // };

      // new Fingerprint().get(function(result, components){
      //    fingerprint = result;
      //    });

      // }

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
    httpHelper[method](path.match(/^https?:\/\//) ? path : (helper || apiHelper).getModuleUrl(path), params, function(err, res){
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
   * Generates the metadata only one time as there is no point in doing it for
   * every call.  The static metadata remains the same.
   * @return {Object} The static metadata
   */
  var getEventData = function(){
    if (eventData === null) {
      eventData = {
        ProjectId : config.eventProjectId ? config.eventProjectId.toString() : config.projectId.toString(),
        EventValue : 1,
        TargetId : config.eventApplicationId ? config.eventApplicationId.toString() : config.applicationId.toString(),
        PhoenixIdentity_ApplicationId: config.eventApplicationId ? config.eventApplicationId.toString() : config.applicationId.toString(),
        Metadata : {}
      };

      // if running from node
      if (process) {
        eventData.Metadata.appCodeName = 'node';
        eventData.Metadata.appName = process.title;
        eventData.Metadata.appVersion = process.version;
        eventData.Metadata.platform = process.arch;
        eventData.Metadata.userAgent = process.platform;
      }

      // Use the standard navigator properties
      if (typeof navigator !== 'undefined') {
        eventData.Metadata.appCodeName = navigator.appCodeName;
        eventData.Metadata.appName = navigator.appName;
        eventData.Metadata.appVersion = navigator.appVersion;
        eventData.Metadata.language = navigator.language;
        eventData.Metadata.platform = navigator.platform;
        eventData.Metadata.product = navigator.product;
        eventData.Metadata.userAgent = navigator.userAgent;
      }

      if (typeof window !== 'undefined') {
        eventData.Metadata.outerHeight = window.outerHeight;
        eventData.Metadata.outerWidth = window.outerWidth;
         eventData.Metadata.screenX = window.screenX;
         eventData.Metadata.screenY = window.screenY;
      }

      if (typeof screen !== 'undefined') {
        // Used to determine who is using what screen sizes
        eventData.Metadata.width = screen.width;
        eventData.Metadata.height = screen.height;
      }

      if (typeof document !== 'undefined') {
        eventData.Metadata.referrer = document.referrer;
      }

      // Add the fingerprint if it exists
      if (fingerprint) {
        eventData.Metadata.DeviceId = fingerprint;
      }

      // Trigger GeoLocation for the First time
      if (typeof navigator !== 'undefined' && navigator.geolocation && idConfig.useGeolocation) {
        var timeout = null;
        var retrieveLocation = function(){

          navigator.geolocation.getCurrentPosition(
            // Success
            function(position)
            {
              // If this is called then we were successful in retrieving geolocation,
              // this means the user has granted permission so we can keep updating.
              // If we were not successful then we would fall back to IP Address on
              // the server side
              eventData.Metadata.latitude = position.coords.latitude;
              eventData.Metadata.longitude = position.coords.longitude;
              eventData.Metadata.geoAccuracy = position.coords.accuracy;

              eventData.Geolocation = {
                Latitude : position.coords.latitude,
                Longitude : position.coords.longitude
              };

              // We will update the geolocation at the specified interval
              timeout = window.setTimeout(function(){
                timeout = null;
                retrieveLocation();
              }, idConfig.locationRefreshInterval);
            },
            // Failure
            function(err){
              // Determine the type of error to see how we should deal with it
              if (err && err.code) {
                if (err.code === 1) {
                  // The user explicitly denied permission, don't try again.
                  /**
                   * Occurs when the user denies access to location infomration
                   * @event geolocation-permission-denied
                   */
                  intelligence.emit('geolocation-permission-denied', {});

                } else if (err.code === 2 || err.code ===3) {
                  // Geolocation timed out or position is currently unavailable.  Okay to try again
                  // We will update the geolocation at the specified interval
                  timeout = window.setTimeout(function(){
                    timeout = null;
                    retrieveLocation();
                  }, idConfig.locationRefreshInterval);
                }
              }
            },
            // Options
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximuAge: 0
          });
        };
        retrieveLocation();
      }

      eventData.ApplicationVersion = intelligence.version;
      eventData.DeviceType = eventData.Metadata.appVersion;
      eventData.OperatingSystemVersion = eventData.Metadata.platform;
    }

    return eventData;
  };

  // If the user changes we will update the event capture
  intelligence.on('updated-user', function(data){
    if (eventData === null) {
      getEventData();
    }
    eventData.PhoenixIdentity_UserId = data.user.id.toString();
  });

  var updateIP = function(){
    // Retrieve IP Address where possible
    httpHelper.get('https://api.ipify.org?format=json', null, function(err, data){
      if (!err) {
        try {
          eventData.IpAddress = JSON.parse(data.body.response).ip;
          if (window && window.setTimeout) {
            // Update periodically in case we are on the move
            window.setTimeout(updateIP, idConfig.ipRefreshInterval);
          }
        }
        catch (err) {
        }
      }
    });
  };

  /**
   * Private method to actually create the event as required.  All events
   * are created in the queue, if realTime is true then all the events in the
   * queue will be sent on to the server.  Both options are fire and forget.
   *
   * Metadata will also be augmented with information extracted from the browser
   * for each event fired
   *
   * @ignore
   *
   * @param  {String} name            The name of the event that is being fired
   * @param  {Object} meta          The metadata to include in the event
   * @param  {boolean} realTime     If true then all events in the queue are
   *                                  immediately sent to the server
   * @param  {eventQueueCallback} [callback] Called when the event is added to the queue
   */
  var createEvent = function(name, meta, realTime, tokenType, accessToken, callback, date){

    // Create the event
    // event is following the naming conventions of Intelligence, hence the uppercase properties
    var event = {
      EventDate : date ? date.toISOString() : new Date().toISOString(),
      EventType : name,
      accessToken : accessToken,
      tokenType : tokenType,
      Metadata : {
        href: typeof location !== 'undefined' ?  location.href : ''
      }
    };

    // Populate with defaults
    _.merge(event, {Metadata : meta}, getEventData());

    events.push(event);

    // if realtime, send all the events
    if (realTime) {
      this.flush(callback);
    }
    else {
      if (callback) {
        callback(event, events.length);
      }
    }

    return event;
  };

  /**
   * Creates an analytical event and places it in the queue until the timer
   * expires and sends event to the API
   *
   * @function event
   *
   * @param  {String}   tokenType   The type of token we are using
   * @param  {String}   accessToken The access token for this user
   * @param  {String} name            The name of the event that is being fired
   * @param  {Object} [meta]            The metadata to include in the event
   * @param  {eventQueueCallback} [callback] Called when the event is added to the queue
   */
  analytics.event = function(tokenType, accessToken, name, meta, callback, date){
    return createEvent.call(this, name, meta || {}, false, tokenType, accessToken, callback, date);
  };

  /**
   * Creates a real time event, places it in the queue and forces all of the
   * events on the queue to be sent.  This also waits until events have been sent
   * before returning
   *
   * @function now
   *
   * @param  {String}   tokenType   The type of token we are using
   * @param  {String}   accessToken The access token for this user
   * @param  {String} name            The name of the event that is being fired
   * @param  {eventQueueCallback} [callback] Called when the event is added to the queue
   */
  analytics.now = function(tokenType, accessToken, name, meta, callback, date){
    var event = createEvent.call(this, name, meta || {}, true, tokenType, accessToken, callback, date);
    return event;
  };

  /**
   * Gets the number of events that are currently sitting in the queue waiting
   * to be sent to the server.
   *
   * @function getEventCount
   *
   * @return {Number} The number of events
   */
  analytics.getEventCount = function(){
    return events.length;
  };

  /**
   * Sends the events in the queue to the server
   *
   * @function flush
   *
   * @return {Number} The number of events sent
   */
  analytics.flush = function(callback){
    var processed = 0;
	if (!callback) {
          callback = function (res) { };
	}

    if (events.length && !flushing) {
      flushing = true;
      var tempEvents = events.splice(0, Math.min(idConfig.eventMaxProcessed, events.length));

      var retryFunction = events.length > 0 ? function () {
        analytics.flush(callback);
      } : function(){
        callback(events, events.length, processed);
      };

      var accessToken = tempEvents.length > 0 ? tempEvents[0].accessToken : null;
      var tokenType = tempEvents.length > 0 ? tempEvents[0].tokenType : null;
      for (var i in tempEvents) {
        delete tempEvents[i].accessToken;
        delete tempEvents[i].tokenType;
      }

      call('post', 'projects/' + config.projectId + '/events', tempEvents,
        function(res){
          callback(events, events.length, processed);
          flushing = false;
        },
        function(res){
          retryFunction();
          flushing = false;
        }, {
          Authorization : tokenType + ' ' + accessToken,
          Accept : 'application/json'
        });

      processed = tempEvents.length;
    } else {
        callback();
	}

    if (!interval) {
      // We are already processing, so we can try again in
      if (typeof window !== 'undefined' && window.setTimeout) {
        interval = window.setInterval(function(){
          analytics.flush();
        }, idConfig.eventFlushInterval);
      } else {
        interval = setInterval(function(){
          analytics.flush();
        }, idConfig.eventFlushInterval);
      }
    }
    return processed;
  };

  /**
   * Helper function to ensure the analytics module has been initialised
   * This should not be called directly by a developer, it is called by the
   * Intelligence init function
   */
  analytics.init = function(){
    updateIP();
    analytics.flush();
  };

  return analytics;
};