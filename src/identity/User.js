/*jshint node: true */
'use strict';

/**
 * A User object contains all of the information representing the actual user
 *
 * A User can not be created directly but must be retrieved through the
 * [AccessToken]{@link module:intelligence/identity.AccessToken}.  The User can
 * be retrieved either through the [getUser]{@link module:intelligence/identity.AccessToken.getUser}
 * method or through the [updated user]{@link event:updated-user} event.
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
 * intelligence.on('updated-user', function(data){
 *   var provider = data.user;
 *   // Do something with the user
 *  });
 *
 * @constructor module:intelligence/identity.User
 * @param  {Object} template   The user information as send through by intelligence
 */
module.exports = function(template){
    return {
        /**
         * The identity of this user within intelligence
         * @type {Number}
         * @memberof module:intelligence/identity.User
         */
        id : template.Id,
        /**
         * The identity of the company this user belongs to within intelligence
         * @type {Number}
         * @memberof module:intelligence/identity.User
         */
        companyId : template.CompanyId,
        /**
         * The username of the user
         * @type {String}
         * @memberof module:intelligence/identity.User
         */
        username : template.Username,
        /**
         * The first name of the user
         * @type {String}
         * @memberof module:intelligence/identity.User
         */
        firstName : template.FirstName,
        /**
         * The last name of the user
         * @type {String}
         * @memberof module:intelligence/identity.User
         */
        lastName : template.LastName,
        /**
         * The full displayable name of the user
         * @type {String}
         * @memberof module:intelligence/identity.User
         */
        fullName : template.FirstName + ' ' + template.LastName,
        /**
         * Determining if this is an active user or not
         * @type {Boolean}
         * @memberof module:intelligence/identity.User
         */
        isActive: template.IsActive,
        /**
         * The date which this user was created
         * @type {Date}
         * @memberof module:intelligence/identity.User
         */
        dateCreated: new Date(template.DateCreated),
        /**
         * The date which this user was last updated
         * @type {Date}
         * @memberof module:intelligence/identity.User
         */
        dateUpdated: new Date(template.DateUpdated),

        /**
         * An array of objects that have been stored with the
         * user.  MetaDataParameters have been deprecated and are
         * included only for backwards compatibility
         * @type {Array}
         * @memberof module:intelligence/identity.User
         */
        metaData: template.MetaData || template.MetaDataParameters || []
    };
};
