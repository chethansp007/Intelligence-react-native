/*jshint node: true */

'use strict';

/**
 * This is the constructor for the global Intelligence Object.
 * If being included as a script in a browser, Intelligence is
 * available in the global namespace.
 *
 * If being included through require statements then the Function
 * returned is the constructor for the Intelligence namespace.
 *
 * See [intelligence/core]{@link module:intelligence/core} for details of what methods are
 * available from the Intelligence instance created.
 *
 * See [intelligence/config]{@link module:intelligence/config} for the configuration options that are available
 *
 * @constructor Intelligence
 *
 * @example
 * // Creating a new Intelligence Instance
 * var myIntelligence = new Intelligence({
 *        clientId : '<myClientId>',
 *        clientSecret : '<myClientSecret>',
 *        projectId : <myProjectId>,
 *        applicationId : <myApplicationId>
 *        });
 *
 *
 * // Retrieving an AccessToken by retrieving a session from the Local Storage
 * myIntelligence.validate(function(err, token){
 *   if (!err) {
 *     // token is now a valid token
 *     // Do something with token
 *   }
 *   else {
 *     // There was a proplem retrieving the token, most likely session expired
 *   }
 * };
 *
 * // Retrieving an AccessToken by authenticating a user
 * myIntelligence.authenticate('myuser', 'mypassword', function(err, token){
 *   if (!err) {
 *     // We have a valid token, authentication has been successful
 *     // Do something with the token
 *   }
 *   else {
 *     // We were unable to authenticate, most likely bad credentials or
 *     // account locked
 *   }
 * });
 *
 * // Place some custom events in the event cache
 * myIntelligence.event('custom.event.1');
 *
 * // Events with custom metadata
 * myIntelligence.event('custom.event.1', {key : 'value', key1 : 'value1'});
 *
 * // Force events to send to the api immediately
 * myIntelligence.now('custom.event.1', {key : 'value', key1 : 'value1'});
 *
 */
var Intelligence = require('./core');

// Make sure it is available in the browser
if (typeof window !== 'undefined') {
  window.Intelligence = Intelligence;
}

// Make sure it is available to NodeJS
if (typeof module !== 'undefined') {
  module.exports = Intelligence;
}

