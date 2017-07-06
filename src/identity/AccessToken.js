/*jshint node: true */
'use strict';

/**
 * The AccessToken is used to grant access to the user for various
 * actions.
 * An access token can not be created directly but must be retrieved through the
 * {@link Intelligence} instance using either the #{link module:intelligence/core.validate}
 * or the #{link module:intelligence/core.authenticate} methods
 *
 * @example
 * var myIntelligence = new Intelligence({
 *   clientSecret : '<my super secret>',
 *   clientId : '<my api key>'});
 *
 * // Attempt to retrieve using the token stored in localStorage
 * myIntelligence.validate(function(err, token){
 *   if (!err)
 *   {
 *     // token is a valid access token
 *     // Do something with Token
 *   }
 *   else
 *   {
 *     // Token was not valid so authenticate
 *     myIntelligence.authenticate('username', 'password', function(err, token){
 *       if (!err)
 *       {
 *         // Token is now valid, do something with it
 *       }
 *       else
 *       {
 *         // Invalid token, probably authentication problem
 *         // Handle it
 *       }
 *     });
 *   }
 * });
 *
 * @constructor module:intelligence/identity.AccessToken
 * @param  {Object} config   Configuration received from the server
 * @param  {Object} identity The Identity module
 * @param  {Object} intelligence  The reference to the Intelligence Instance that created this Token
 * @return {Object}          The Access Token for the user

 */
module.exports = function(config, identity, analytics, intelligence, isUserToken){

  var access_token = null,
      refresh_token = null,
      user_token = !!isUserToken;

  /**
   * Gets the information relevant to the user account that is represented by this
   * AccessToken, this includes the Accessible Providers, Companies, Projects, and
   * User Information
   *
   */
  var retrieveUserInfo = function(){
    var self = this;

    // Get the providers
    identity.retrieveProviders(this.token_type, access_token, function(err, providers){
      if (!err) {
        self.providers = providers;
        /**
         * Occurs when the providers have been updated after the [AccessToken]{@link module:intelligence/identity.AccessToken} has been
         * [refreshed]{@link module:intelligence/identity.AccessToken.refresh} or [authenticated]{@link module:intelligence/identity~authenticate} successfully
         * and the server has responded to the request to provide the available providers
         * @event updated-providers
         * @property {Array} providers the list of [providers]{module:intelligence/identity.Provider} that are available to the user
         */
        intelligence.emit('updated-providers', {
          providers : providers
        });
      }
    });

    // Get the user information
    identity.retrieveUserInfo(this.token_type, access_token, function(err, userInfo){
      if (!err) {
        self.user = userInfo;

        /**
         * Occurs when the user information have been updated after the [AccessToken]{@link module:intelligence/identity.AccessToken} has been
         * [refreshed]{@link module:intelligence/identity.AccessToken.refresh} or [authenticated]{@link module:intelligence/identity~authenticate} successfully
         * and the server has responded to the request to provide the user information
         * @event updated-user
         * @property {module:intelligence/identity.User} user the user information
         */
        intelligence.emit('updated-user', {
          user : userInfo
        });
      }
    });

    // Get the companies
    identity.retrieveCompanyInfo(this.token_type, access_token, function(err, companies){
      if (!err) {
        self.companies = companies;

        var projectList = [];
        var count = 0;

        /**
         * Loop through all of the companies and get the list of projects
         * for each one
         * @param  {Object} err      The error, null if none
         * @param  {Array} projects  The list of projects retrieved
         */
        var fnRetrieved = function retrievedProjectList(err, projects){
          count++;

          if (!err && projects.length > 0) {
            projectList = projectList.concat(projects);
          }

          // We have completed the calls for all companies
          if (count >= companies.length) {
            self.projects = projectList;

            /**
             * Occurs when the project information has been updated after the [AccessToken]{@link module:intelligence/identity.AccessToken} has been
             * [refreshed]{@link module:intelligence/identity.AccessToken.refresh} or [authenticated]{@link module:intelligence/identity~authenticate} successfully
             * and the server has responded to the request to provide the project information
             * @event updated-projects
             * @property {Array} projects the list of [projects]{module:intelligence/identity.Project} that are available to the user
             **/
            intelligence.emit('updated-projects', {
              projects : self.projects
            });
          }
        };

        // For each Company we need to load the projects
        for (var i=0; i<companies.length; i++) {
          identity.retrieveProjectInfo(companies[i].id, self.token_type, access_token, fnRetrieved);
        }

        /**
         * Occurs when the company information has been updated after the [AccessToken]{@link module:intelligence/identity.AccessToken} has been
         * [refreshed]{@link module:intelligence/identity.AccessToken.refresh} or [authenticated]{@link module:intelligence/identity~authenticate} successfully
         * and the server has responded to the request to provide the company information
         * @event updated-companies
         * @property {Array} companies the list of [companies]{module:intelligence/identity.Company} that are available to the user
         */
        intelligence.emit('updated-companies', {
          companies : companies
        });
      }
    });
  };

  var updateToken = function(config){
    access_token  = config.access_token;
    refresh_token = config.refresh_token;

    // publicly accessible
    this.expires = new Date(new Date().getTime() + config.expires_in);
    // Make sure the tokenType has the first letter as uppercase
    this.token_type = config.token_type.charAt(0).toUpperCase() + config.token_type.slice(1);
    // Ensure we capture the created date for the token
    this.created = config.created || new Date();

    // Trigger updating of the user information
    if (user_token) {
      retrieveUserInfo.call(this);
    }
  };

  var token = {
    /**
     * Refreshes the users [Access Token]{@link module:intelligence/identity.AccessToken}.  One the token is refreshed callback
     * is called.  If there was an error then the first parameter will be
     * the error.  Refresh will update this object
     * @param  {Function} callback called when the server has returned
     *
     * @see module:intelligence/identity~refresh
     *
     * @function module:intelligence/identity.AccessToken.refresh
     * @instance
     *
     * @fires refreshed
     */
    refresh : function(callback){
      var self = this;
      identity.refresh(refresh_token, function(err, token){
        if (!err) {
          updateToken.call(self, token);

          /**
           * Occurs when the [AccessToken]{@link module:intelligence/identity.AccessToken} has been
           * [refreshed]{@link module:intelligence/identity.AccessToken.refresh}
           * @event refreshed
           * @type {Object}
           * @property {Object} accessToken the [AccessToken]{@link module:intelligence/identity.AccessToken} for the user authenticated
           */
          intelligence.emit('refreshed', {
            accessToken : self
          });
        }
        if (callback) {
          callback(err, self);
        }
      });
    },

    /**
     * Validates the current token.  If the token is invalid will call callback with
     * the appropriate error.  This will ensure the token is in sync with the server by
     * updating the expiry time based on the server data
     * @param  {Function} callback the callback function to call after the server responds
     *
     * @see module:intelligence/identity~validate
     *
     * @function module:intelligence/identity.AccessToken.validate
     * @instance
     *
     * @fires validated
     */
    validate : function(callback){
      var self = this;
      identity.validate(this.token_type, access_token, function(err, token){
        self.expires = token.expires;

        if (callback) {
          callback(err, token);
        }
      });
    },

    /**
     * Expires this token, clears any token information stored by this Token
     * @param  {Function} callback The function to call when the token is successfully expired
     *
     * @see module:intelligence/identity~expire
     *
     * @function module:intelligence/identity.AccessToken.expire
     * @instance
     *
     * @fires expired
     */
    expire : function(callback){
      var self = this;
      identity.expire(access_token, function(err, token){
        if (!err) {
          // Clear out the token as this is now invalid
          access_token = null;
          refresh_token = null;
          self.expires = new Date();
          self.token_type = null;

          /**
           * Occurs when the [AccessToken]{@link module:intelligence/identity.AccessToken} has been properly [expired]{@link module:intelligence/identity.AccessToken.expire}
           * @event expired
           * @type {Object}
           */
          intelligence.emit('expired', {
          });
        }
        if (callback) {
          callback(err, self);
        }
      });
    },

    /**
     * Creates an analytical event and places it in the queue until the timer
     * expires and sends event to the API
     *
     * @function module:intelligence/identity.AccessToken.event
     * @instance
     *
     * @param  {String} name            The name of the event that is being fired
     * @param  {Object} [metadata]            The metadata to include in the event
     * @param  {eventQueueCallback} [callback] Called when the event is added to the queue
     * @param  {date} date The date to give to the event
     */
    event : function(name, metadata, callback, date){
      if (typeof metadata === 'function') {
        callback = metadata;
        metadata = null;
      }
      return analytics.event(this.token_type, access_token, name, metadata, callback, date);
    },

    /**
     * Creates a real time event, places it in the queue and forces all of the
     * events on the queue to be sent
     *
     * @function module:intelligence/identity.AccessToken.now
     * @instance
     *
     * @param  {String} name            The name of the event that is being fired
     * @param  {Object} [metadata]            The metadata to include in the event
     * @param  {eventQueueCallback} [callback] Called when the event queue is cleared
     * @param  {date} date The date to give to the event
     */
    now : function(name, metadata, callback, date){
      if (typeof metadata === 'function') {
        callback = metadata;
        metadata = null;
      }
      return analytics.now(this.token_type, access_token, name, metadata, callback, date);
    },

    /**
     * Gets the number of events that are currently sitting in the queue waiting
     * to be sent to the server.
     *
     * @function module:intelligence/identity.AccessToken.getEventCount
     * @instance
     *
     * @return {Number} The number of events to be processed
     */
    getEventCount : function(){
      return analytics.getEventCount();
    },

    /**
     * Gets the list of providers that are valid for this token.  This list
     * will become available once the token is correctly authenticated or
     * refreshed.  Until the token has been authenticated this will return null.
     *
     * @function module:intelligence/identity.AccessToken.getProviders
     * @instance
     *
     * @return {Array} The list of providers that this user is part of
     *
     * @see module:intelligence/identity.Provider
     *
     * Also see the event {@link event:updated-providers}
     */
    getProviders : function(){
      return this.providers;
    },

    /**
     * Gets the user that has logged in.  If the user is not yet authenticated this
     * will return null or undefined.
     *
     * @function module:intelligence/identity.AccessToken.getUser
     * @instance
     *
     * @return {module:intelligence/identity.User} The User that has authenticated or null
     *
     * Also see the event {@link event:updated-user}
     */
    getUser : function(){
      return this.user;
    },
    /**
     * Gets the list of companies that are valid for this token.  This list
     * will become available once the token is correctly authenticated or
     * refreshed.  Until the token has been authenticated this will return null.
     *
     * @function module:intelligence/identity.AccessToken.getCompanies
     * @instance
     *
     * @return {Array} The list of companies that this user is part of
     *
     * @see module:intelligence/identity.Company
     *
     * Also see the event {@link event:updated-companies}
     */
    getCompanies : function() {
      return this.companies;
    },
    /**
     * Gets the list of projects that are valid for this token.  This list
     * will become available once the token is correctly authenticated or
     * refreshed.  Until the token has been authenticated this will return null.
     *
     * @function module:intelligence/identity.AccessToken.getProjects
     * @instance
     *
     * @return {Array} The list of projects that this user is part of
     *
     * @see module:intelligence/identity.Project
     *
     * Also see the event {@link event:updated-projects}
     */
    getProjects : function() {
      return this.projects;
    }
  };

  // Populate the token
  updateToken.call(token, config);

  // Register as a listener for specific events
  intelligence.on('geolocation-permission-denied', function(params){
    token.event('Intelligence.Geolocation.Permission.Denied');
  });

  return token;
};

/**
 * This callback contains information about the event queue state
 * @callback eventQueueCallback
 * @param {Object} event the event that was placed on the queue
 * @param {Number} count the number of items remaining on the queue
 * @param {Number} flushed the number of events flushed as a result of this call
 */
