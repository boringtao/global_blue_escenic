/**
 * Utilities Object
 * @Author luke.dyson@flyinganvil.co.uk
 */
var utils={ARRAYS:{indexOf:function(){if(Array.prototype.indexOf){return function(e,t,n){return e.indexOf(t,n)}}else{return function(e,t,n){var r=e.length;n=n||0;n+=n<0?r:0;for(;n<r;++n){if(e[n]===t){return n}}return-1}}}()},URL:{searchObjectify:function(){var e=window.location.search;if(typeof e==="string"&&e!==""){var t={};e=e.slice(1).split("&");var n,r=e.length;for(n=0;n<r;n++){var i=e[n].split("=");t[i[0]]=i[1]}return t}else{return null}}()}}