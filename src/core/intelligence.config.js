/*jshint node: true */
'use strict';

/**
* Default configuration options for the SDK
* @module intelligence/config
*
* @example
* {
*   clientId : '<myClientId>',
*   clientSecret : '<myClientSecret>',
*   projectId : '<myProjectId'>,
*   applicationId : '<myApplicationId>',
*   moduleEndpoint: 'https://uat.{module}.phoenixplatform.com/',
*   apiEndpoint: 'https://api.uat.phoenixplatform.com/{module}/',
*   localStorage : {
*     accessTokenKey : 'personalised-access-token'
*   }.
*   identity : {
*     md5Hash : false
*   },
*   analytics : {
*     useGeolocation : false
*   }
* }
*
* @property {String} clientId       REQUIRED the client ID to use when authenticating
* @property {String} clientSecret   REQUIRED the client Secret to use when authenticating
* @property {Integer} projectId   REQUIRED the projectId to authenticate against
* @property {Integer} applicationId REQUIRED the application id to authenticate against
* @property {Integer} eventProjectId OPTIONAL the projectId to send events to, if not provided projectId is used
* @property {Integer} eventApplicationId OPTIONAL the applicationId to send events to, if not provided applicationId is used
* @property {String} moduleEndpoint OPTIONAL the URL of the Intelligence API module endpoints
* @property {String} apiEndpoint OPTIONAL the URL of the default API endpoints
* @property {String} localStorage.accessTokenKey OPTIONAL the name of the local storage key to use when storing info
* @property {Boolean} identity.md5Hash OPTIONAL if true MD5 hash the password before sending to the API
* @property {Boolean} analytics.useGeolocation OPTIONAL if true request location from browser for events
*/
module.exports = {
   // do not update manually, this is updated during the build process
  version : '0.0.29',

  defaultConfig: (function(){return {

    /**
     * The client identifier as given during project setup
     * @type {String}
     */
    clientId : null,
    /**
     * The client secret as given during project setup
     * @type {String}
     */
    clientSecret: null,

    /**
     * The identifier of the provider that the SDK is communicating with
     * @type {Number}
     */
    providerId : 300,
    /**
     * The endpoint to hit for each call made by the SDK
     * @type {String}
     */
    moduleEndpoint: 'https://{module}.phoenixplatform.com.sg/',
    /**
     * The v1 Endpoint for any calls that are direct to Intelligence
     * @type {String}
     */
    apiEndpoint: 'https://api.phoenixplatform.com/{module}/',

    /**
     * Local storage options
     * @type {Object}
     */
    localStorage : {
      /**
       * The key to use to store the access token
       * @type {String}
       */
      accessTokenKey : 'intelligence-access-token',
    },

    /**
     * Identity module configuration
     * @type {Object}
     */
    identity : {

      /**
       * The name of the API module to use when parsing the endpoint
       * @type {String}
       */
      module : 'identity',

      /**
       * The module to use for the v1 intelligence endpoints, if not existing then {@link module}
       * will be used
       * @type {String}
       */
      intelligenceModule : 'identity',
      /**
       * The API Version to use when creating the endpoint URLs
       * @type {String}
       */
      apiVersion : 'v2',

      /**
       * The version to use for the v1 intelligence endpoints, if not existing then {@link apiVersion}
       * will be used
       * @type {String}
       */
      intelligenceApiVersion : 'v1',
      /**
       * True to hash passwords before they are sent across the wire
       * @type {Boolean}
       */
      md5Hash : true,

      /**
       * URL configuration for this module
       * @type {Object}
       */
      urls : {
        token : {
          path : 'token'
        },
        validate : {
          path : 'validate'
        }
      }
    },

    /**
     * Authentication module configuration
     */
    authentication : {
      module : 'authentication',
      apiVersion : 'v2'
    },

    /**
     * Analytics module configuration
     * @type {Object}
     */
    analytics : {
      /**
       * The name of the API module to use when parsing the endpoint
       * @type {String}
       */
      module : 'analytics',
      /**
       * The API Version to use when creating the endpoint URLs
       * @type {String}
       */
      apiVersion : 'v2',
      /**
       * Should geolocation be sent with each event?  The browser will request
       * access and permission from the user if this is true
       * @type {Boolean}
       */
      useGeolocation : false,
      /**
       * Interval to update the location
       * @type {Number}
       */
      locationRefreshInterval : 60000,
      /**
       * After how many milliseconds should we be attempting to update the detected IP address
       * @type {Number}
       */
      ipRefreshInterval : 60000,

      /**
       * The number of milliseconds before pushing any events in the queue to the server
       * @type {Number}
       */
      eventFlushInterval : 5000,

      /**
       * The maximum number of events to send at one time
       * @type {Number}
       */
      eventMaxProcessed : 50
    }
  };}())
};