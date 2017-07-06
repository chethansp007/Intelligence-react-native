/*jshint node: true */
'use strict';

/**
 * A Project is a third tier entity within Intelligence.  Projects must have
 * a [Company]{@link module:intelligence/identity.Company}
 *
 * A Project can not be created directly but must be retrieved through the
 * [AccessToken]{@link module:intelligence/identity.AccessToken}.  The Projects can
 * be retrieved either through the [getProjects]{@link module:intelligence/identity.AccessToken.getProjects}
 * method or through the [updated projects]{@link event:updated-projects} event.
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
 * intelligence.on('updated-projects', function(data){
 *   var projects = data.projects;
 *   // Do something with the project
 *  });
 *
 * @constructor module:intelligence/identity.Project
 * @param  {Object} template   The project information as send through by intelligence
 */
module.exports = function(template){
  return {
    /**
     * The identity of this project within intelligence
     * @type {Number}
     * @memberof module:intelligence/identity.Project
     */
    id : template.Id,

    /**
     * The identity of the company this project is
     * under
     * @type {Number}
     * @memberof module:intelligence/identity.Project
     */
    companyId : template.CompanyId,
    /**
     * The displayable name of this project
     * @type {String}
     * @memberof module:intelligence/identity.Project
     */
    name : template.Name,
    /**
     * The displayable reference of this project
     * @type {String}
     * @memberof module:intelligence/identity.Project
     */
    reference : template.Reference,
    /**
     * Determining if this is an active project or not
     * @type {Boolean}
     * @memberof module:intelligence/identity.Project
     */
    isActive: template.IsActive,
    /**
     * The date which this project was created
     * @type {Date}
     * @memberof module:intelligence/identity.Project
     */
    dateCreated: new Date(template.DateCreated),
    /**
     * The date which this project was last updated
     * @type {Date}
     * @memberof module:intelligence/identity.Project
     */
    dateUpdated: new Date(template.DateUpdated),
    /**
     * An array of objects that have been stored with the
     * project.  MetaDataParameters have been deprecated and are
     * included only for backwards compatibility
     * @type {Array}
     * @memberof module:intelligence/identity.Project
     */
    metaData: template.MetaData || template.MetaDataParameters || []
  };
};
