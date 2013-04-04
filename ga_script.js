/**
 * The following variables are set on the JSP as well from section properties.
 * But you can override them here also.
 * 
 * GBA.globalAccount = 'UA-12433-1'; 
 * GBA.globalDomain = 'none'; // 'none' makes it possible to test on arbitrary servers 
 * GBA.localAccount = 'UA-12433-2';
 * GBA.localDomain = 'none'; // 'none' makes it possible to test on arbitrary servers 
 * GBA.internalDomains = ['firstclarity.com', 'firstclarity.cn.com'];
 * GBA.excludeDomains = ['addthis.com'];
 */

var defaultDelayTime = 200;

_gaq.push(
		[ '_setAccount', GBA.globalAccount ],
		[ '_setDomainName', GBA.globalDomain ],
		[ '_setAllowLinker', true ],
		[ '_trackPageview' ],
		[ 'b._setAccount', GBA.localAccount ],
		[ 'b._setDomainName', GBA.localDomain ]);

if (GBA.articleTypeName != null) {
	// If this is an article page, we push the article info as well.
	_gaq.push([ 'b._setCustomVar', '1', GBA.articleTypeName, GBA.articleTitleSanitized, '3' ]);
}

_gaq.push([ 'b._trackPageview' ]);

// Standard Google Analytics setup code
(function() {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(ga, s);
})();


$(document).ready(function() {
	// Traverse all anchor elements and take proper action
	$('a').each(function(index) {
		var aURL = $(this).attr('href');
		var urlObj = getURL(aURL);

		if (urlObj.protocol == 'mailto:') {
			$(this).click(function() {
				emailSentTracking(aURL.substring('mailto:'.length))
				return waitForGAReqToFinish(evt, aURL, defaultDelayTime);
			});
		} else if (urlObj.protocol == 'http:' && !isExcludedURL(urlObj)) {
			if (isOutboundURL(urlObj)) {
				$(this).click(function(evt) {
					outboundURLTracking(aURL);
					return waitForGAReqToFinish(evt, aURL, defaultDelayTime);
				});
			} else if (isInternalCrossPublicationURL(urlObj)) {
				$(this).click(function(evt) {
					internalCrossPublicationTracking(evt, aURL);
				});
			}
		}
	});
	
	// Setup "Add to shopping list" tracking
	$('.clipthis_userloggedin a').click(function (evt) {
		addToShoppingListTracking();
		return waitForGAReqToFinish(evt, $(this).attr('href'), defaultDelayTime);
	});
	
	// Gallery tracking
	GB.sliderChangeListeners.push(function(params) {
		if (params.clicked && params.previous != params.current) {
			// This was a user interaction. Track it.
			galleryTracking(params.current);
		} 
    });
	
	// Interactive map tracking
	$('#zoomIn, #zoomOut').click(function(evt) {
		interactiveMapZoomEventTracking(evt.target.id);
	});
	
	$('#MapDropDown').change(function() {
		var selected = $(this).val();
		interactiveMapDestinationChangeTracking(selected);
	});
});

function waitForGAReqToFinish(evt, aURL, delayTime) {
	// This is what Google even recommends. I am not sure how this works with "Open in New Tab" kind of functionality.
	setTimeout(function() {
            /* While using code snippet document.location=... IE browsers (<9 versions) do not send 'referer' header. 
             * To make sure that all browsers send 'referer' header following code snippet needed
             */
              var referLink = document.createElement('a');
              referLink.href = aURL;
              document.body.appendChild(referLink);
              referLink.click();
	}, delayTime);
	evt.preventDefault();
	return false;
}

function isOutboundURL(urlObj) {
	var isOutboundURL = true;
	$.each(GBA.internalDomains, function(index, value) {
		if (urlObj.hostname.endsWith(value)) {
			isOutboundURL = false; // This is an internal URL.
		}
	});	
	return isOutboundURL;
}
function isExcludedURL(urlObj) {
	var isExcludedURL = false;
	$.each(GBA.excludeDomains, function(index, value) {
		if (urlObj.hostname.endsWith(value)) {
			isExcludedURL = true; // This is an excluded URL.
		}
	});	
	return isExcludedURL;
}

function isInternalCrossPublicationURL(urlObj) {
	return !urlObj.href.startsWith(GBA.currentPubURL);
}

function outboundURLTracking(aURL) {
	_gaq.push(
			[ '_trackPageview', '/outbound/' + aURL ], 
			[ 'b._trackPageview', '/outbound/' + aURL ]);
}

function internalCrossPublicationTracking(evt, aURL) {
	_gaq.push([ '_link', aURL ]);
	evt.preventDefault();
}

function emailSentTracking(emailAddress) {
	_gaq.push(
			[ '_trackPageview', '/mailto/' + emailAddress ], 
			[ 'b._trackPageview', '/mailto/' + emailAddress ]);
}

function addToShoppingListTracking() {
	_gaq.push(
			['_trackPageview', '/clippings/' + GBA.articleURL ], 
			['b._trackPageview', '/clippings/' + GBA.articleURL ]);
}

function galleryTracking(slideNumber) {
	if (slideNumber < 10) {
		// Append a 0 before single digits.
		slideNumber = "0" + slideNumber;
	}
	
	var impressionString = document.location.href + '/gallery/imagenumber' + slideNumber;
	_gaq.push(
			['_trackPageview', impressionString ], 
			['b._trackPageview', impressionString ]);
}

var interactiveMapEventCategory = "InteractiveMap";
var interactiveMapDestinationChangeActionName = "DestinationChange";
var destinationBubbleClickActionName = "DestinationClicked";

function interactiveMapZoomEventTracking(zoomType) {
	_gaq.push(
			['_trackEvent', interactiveMapEventCategory, zoomType], 
			['b._trackEvent', interactiveMapEventCategory, zoomType]);
}

function interactiveMapDestinationChangeTracking(country) {
	var impressionString = document.location.href + '/map/country/' + country;
	_gaq.push(
			['_trackPageview', impressionString ], 
			['b._trackPageview', impressionString ]);
	_gaq.push(
			['_trackEvent', interactiveMapEventCategory, interactiveMapDestinationChangeActionName, country],
			['b._trackEvent',  interactiveMapEventCategory, interactiveMapDestinationChangeActionName, country]);
}

function trackAndGoToDestination(evt, country, url) {
	_gaq.push(
			['_trackEvent', interactiveMapEventCategory, destinationBubbleClickActionName, country],
			['b._trackEvent', interactiveMapEventCategory, destinationBubbleClickActionName, country]);
	
	// For some reason, this takes a bit longer than the others.
	waitForGAReqToFinish(evt, url, 2 * defaultDelayTime);
}

// FIXME: Is this enough?? Don't we need to send out the user-id or name or something??
function loggedinUserTracking() {
	_gaq.push(
			[ '_setCustomVar', 2, 'User Type', 'Registered', 2 ], 
			[ 'b._setCustomVar', 2, 'User Type', 'Registered', 2 ]);
}

// Utility function get the URL. This generates the URL with full hostname. So, all URL checking is accurate now.
var l = document.createElement("area");
function getURL(href) {
	l.href = href;
	return l;
}

/** BEGIN Setup Social Sharing related analytics code **/
var addthis_config = {
}

var jiathis_config = {
	boldNum : 0,
	siteNum : 13,
	showClose : false,
	data_track_clickback : true,
	evt : {
		"share" : "trackJiaThis"
	},
	sm : "douban,xianguo,hi,baidu,qzone,zhuaxia,linkedin,sina,qq,kaixin001,fanfou,yahoo,t163"
}

// Code for social services
$(document).ready(function () {
	trackAddThis();
	trackVkontakte();
	trackTQQ();
	trackWeibo();
});

function trackJiaThis(evt) {
	_gaq.push(
			[ '_trackSocial', 'JiaThis', evt.data.service ], 
			[ 'b._trackSocial', 'JiaThis', evt.data.service ]);
}

function trackAddThis() {
	if (!window.addthis) {
		return;
	}
	addthis.addEventListener('addthis.menu.share', function(evt) {
		if (evt.type == 'addthis.menu.share') {
			_gaq.push(
					[ '_trackSocial', 'AddThis', evt.data.service ], 
					[ 'b._trackSocial', 'AddThis', evt.data.service ]);
	    }
	});
}

function trackVkontakte() {
	$('.vk_share a').click(function() {
		_gaq.push(
				[ '_trackSocial', 'VKontakte', 'Share' ], 
				[ 'b._trackSocial', 'VKontakte', 'Share' ]);
	});
}

function trackTQQ() {
	$('.t_qq_share img').click(function () {
		_gaq.push(
				[ '_trackSocial', 't.qq.com', 'Share' ], 
				[ 'b._trackSocial', 't.qq.com', 'Share' ]);
	});
}

function trackWeibo() {
	// FIXME: Because of the iframe, we can't hook up into the click event.
}

/** END Social sharing analytics code **/

GBA.loggedInUserId = function() {
	if ($.cookie('userLoggedIn') != null) {
		return $.cookie('userLoggedIn').split(',')[0].split('=')[1];
	} else {
		return null;
	}
}
