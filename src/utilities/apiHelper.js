/*jshint node: true */
'use strict';

/**
 * Creates a function that expects a configuration object and a module name
 * One of the properties of the configuration object must match the module name
 *
 * The configuration object must have an endpoint and should look similar
 * to the following:
 *
 * endpoint: 'https://{module}.phoenixplatform.com.sg/',
 *   identity : {
 *     module : 'authentication',
 *     apiVersion : 'v2'
 *   }
 * }
 *
 * Where identity would be the module parameter passed in.
 *
 * module and apiVersion are required as part of the configuration
 */
module.exports = function(config, module){

  var moduleEndpoint = config.moduleEndpoint.replace('{module}', (config[module] ? config[module].module : module));
  var apiEndpoint = config.apiEndpoint.replace('{module}', (config[module] ? (config[module].intelligenceModule || config[module].module) : module));

  moduleEndpoint += ((moduleEndpoint[moduleEndpoint.length -1] !== '/') ? '/' : '') +
              (config[module] ? config[module].apiVersion : 'v2') + '/';

  apiEndpoint += ((apiEndpoint[apiEndpoint.length -1] !== '/') ? '/' : '') +
              (config[module] ? (config[module].intelligenceApiVersion || config[module].apiVersion) : 'v1') + '/';

  return {
    /**
     * Gets the URL required for the module specified when creating the helper.
     * The URL returned will always remove any redundant / characters
     * @param  {String} path  The path to get the url for
     * @return {String}     The full URL including protocol to the path specified
     */
    getModuleUrl : function(path) {
      return (moduleEndpoint + path).replace(/([^:])\/\/+/, '$1/');
    },
    /**
     * Gets the URL required for the intelligence API.  This is generally used for
     * v1 endpoints.
     * The URL returned will always remove any redundant / characters
     * @param  {String} path  The path to get the url for
     * @return {String}     The full URL including protocol to the path specified
     */
    getAPIUrl : function(path) {
      return (apiEndpoint + path).replace(/([^:])\/\/+/, '$1/');
    },

    isReactNative :function(){
    
    var flag = false;

    if (window !== 'undefined'){
       flag =  ("ReactNative" === window.navigator.product) ? true : false;
    } 
    
    return flag;
    
    }
  };
};
