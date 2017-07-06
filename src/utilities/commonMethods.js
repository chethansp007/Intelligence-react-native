
'use strict';

module.exports = (function(){

	return {

	isReactNative :function(){
    
   	 var flag = false;

    if (window !== 'undefined'){
       flag =  ("ReactNative" === window.navigator.product) ? true : false;
    } 
    
    return flag;   
    }
	}
})();