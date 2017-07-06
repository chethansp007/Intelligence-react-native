/*jshint node: true */
'use strict';

/**
 * A Provider is a top level entity within Intelligence.  Providers can contain
 * multiple [Companies]{@link module:intelligence/identity.Company}.
 *
 * A Provider can not be created directly but must be retrieved through the
 * [AccessToken]{@link module:intelligence/identity.AccessToken}.  The Providers can
 * be retrieved either through the [getProviders]{@link module:intelligence/identity.AccessToken.getProviders}
 * method or through the [updated providers]{@link event:updated-providers} event.
 *
 * @example
 * var myIntelligence = new Intelligence({
 *   clientSecret : '<my super secret>',
 *   clientId : '<my api key>'});
 *
 * // Attempt to retrieve using the token stored in localStorage
 *
 * MyIntelligence.authenticate('username@email.com', 'password', function(err, token){
 *
 * // Access through the event
 * intelligence.on('updated-providers', function(data){
 *   var provider = data.providers[0];
 *   // Do something with the provider
 *  });
 *
 * @constructor module:intelligence/identity.Provider
 * @param  {Object} template   The provider information as send through by intelligence
 */
module.exports = function(template){
  return {
    /**
     * The identity of this provider within intelligence
     * @type {Number}
     * @memberof module:intelligence/identity.Provider
     */
    id : template.Id,
    /**
     * The displayable name of this provider
     * @type {String}
     * @memberof module:intelligence/identity.Provider
     */
    name : template.Name,
    /**
     * Determining if this is an active provider or not
     * @type {Boolean}
     * @memberof module:intelligence/identity.Provider
     */
    isActive: template.IsActive,
    /**
     * The date which this provider was created
     * @type {Date}
     * @memberof module:intelligence/identity.Provider
     */
    dateCreated: new Date(template.DateCreated),
    /**
     * The date which this provider was last updated
     * @type {Date}
     * @memberof module:intelligence/identity.Provider
     */
    dateUpdated: new Date(template.DateUpdated)
  };
};
