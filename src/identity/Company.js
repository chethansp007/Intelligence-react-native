/*jshint node: true */
'use strict';

/**
 * A Company is a second tier entity within Intelligence.  Companies must have
 * a [Provider]{@link module:intelligence/identity.Provider}
 *
 * A Company can not be created directly but must be retrieved through the
 * [AccessToken]{@link module:intelligence/identity.AccessToken}.  The Companies can
 * be retrieved either through the [getCompanies]{@link module:intelligence/identity.AccessToken.getCompanies}
 * method or through the [updated companies]{@link event:updated-companies} event.
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
 * intelligence.on('updated-companies', function(data){
 *   var companies = data.companies;
 *   // Do something with the company
 *  });
 *
 * @constructor module:intelligence/identity.Company
 * @param  {Object} template   The company information as send through by intelligence
 */
module.exports = function(template){
  return {
    /**
     * The identity of this company within intelligence
     * @type {Number}
     * @memberof module:intelligence/identity.Company
     */
    id : template.Id,

    /**
     * The identity of the provider this company is
     * under
     * @type {Number}
     * @memberof module:intelligence/identity.Company
     */
    providerId : template.ProviderId,
    /**
     * The displayable name of this company
     * @type {String}
     * @memberof module:intelligence/identity.Company
     */
    name : template.Name,
    /**
     * The displayable reference of this company
     * @type {String}
     * @memberof module:intelligence/identity.Company
     */
    reference : template.Reference,
    /**
     * Determining if this is an active company or not
     * @type {Boolean}
     * @memberof module:intelligence/identity.Company
     */
    isActive: template.IsActive,
    /**
     * The date which this company was created
     * @type {Date}
     * @memberof module:intelligence/identity.Company
     */
    dateCreated: new Date(template.DateCreated),
    /**
     * The date which this company was last updated
     * @type {Date}
     * @memberof module:intelligence/identity.Company
     */
    dateUpdated: new Date(template.DateUpdated),
    /**
     * An array of objects that have been stored with the
     * company.  MetaDataParameters have been deprecated and are
     * included only for backwards compatibility
     * @type {Array}
     * @memberof module:intelligence/identity.Company
     */
    metaData: template.MetaData || template.MetaDataParameters || []
  };
};
