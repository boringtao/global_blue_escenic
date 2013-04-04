$.extend({
	decodeEntities : function(value) {
		return $('<div/>').html(value).text();
	}
});

String.prototype.endsWith = function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWith = function(str) {
	return this.indexOf(str) == 0;
};

// On page scripts can store URLs in here before document ready
GB.urls = {};

GB.sliderChangeListeners = [];

GB.utils = GB.utils || {};

GB.utils.disableLinks = function(elRef) {
	var ref = elRef || '';
	$('a' + elRef).click(function(e) {
		e.preventDefault();
		return false;
	})
}

GB.utils.setInfoBtns = function() {
	$(".moreInfoIcon").mouseover(
			function(e) {
				$(this).mousemove(
						function(e) {
							$(this).siblings(".infoBox").stop(true, true).css(
									"left", e.pageX + 20);
							$(this).siblings(".infoBox").stop(true, true)
									.css(
											"top",
											e.pageY
													- (55 - ($(".infoBox")
															.height() / 2)));
						});
				$(this).siblings(".infoBox").fadeIn();
			});

	$(".moreInfoIcon").mouseout(function() {
		$(this).siblings(".infoBox").fadeOut();
	});
}

GB.languageSelector = function() {
	$('.languageSelector').hover(function() {
		$(this).children('div').toggleClass('hover');
	});
};

GB.userMenu = function() {
	var webApp = "";
	if ($.cookie('userLoggedIn') != null) {
		userCookie = $.cookie('userLoggedIn').split(',')[2];
		webApp = $.cookie('userLoggedIn').split(',')[3];
	} else {
		userCookie = "";
	}
	var userData = userCookie.split('_');
	if (userData[0] == 'true' && webApp == GB.vars.webapp
			&& GB.vars.loginStatus) {
		// Logged in
		$('.userMenu li.login, .userMenu li.register').remove();
		var welcomeText = $('.userMenu li.welcome a').html();
		$('.userMenu li.welcome a').append(
				' ' + userData[1].split('+').join(' '));
		$('.userMenu li.welcome a').attr('title', welcomeText + ' ' + userData[1].split('+').join(' '));
	} else {
		// Logged out
		$('.userMenu li.welcome, .userMenu li.editProfile, .userMenu li.logout')
				.remove();
	}
};

/** ***new function for drop-down ******* */
GB.navigationDropdown = function(classname, index) {

	var divLocator = '#navigation .' + classname;
	var liLocator = '#navigation .menu>ul>li:eq(' + index + ')';

	if (!$(divLocator).length)
		return;

	$(divLocator).remove().appendTo(liLocator);
};

GB.trailersWithOverlay = function() {
	$('.trailersWithOverlay').each(function() {
		var $this = $(this);
		$this.addClass('trailersWithOverlayJS');
		$this.find('.trailer').each(function() {
			var titleH = $(this).children('h5').remove();
			if (titleH.size() == 0) {
				titleH = $(this).find('.article h3').remove();
			}
			var href = $(this).find('a').attr('href');
			$(this).find('p.summary').wrap('<div class="overlay"></div>');
			$(this).find('.overlay').prepend(titleH);
			$(this).find('p.summary').hide();
			$(this).prepend('<a href="' + href + '" class="blocker"></a>');
		});
		$this.find('.trailer').hover(function() {
			$(this).find('p.summary').slideDown('fast');
		}, function() {
			$(this).find('p.summary').slideUp('fast');
		});
	});
};

GB.shoppingSearch = function() {
	var forms = $('.shoppingLocatorForm form');
	if ($(forms).length == 0)
		return;

	var $searchString = $('input[name="searchStringShoppingTmp"]', forms);

	$($searchString).each(
			function(index, obj) {
				if ($(this).attr('autocomplete') == 'on') {
					var w = $(this).outerWidth()
							- parseInt($(this).css('border-left-width')
									.replace('px', ''))
							- parseInt($(this).css('border-right-width')
									.replace('px', ''));
					$(this).autocomplete(GB.urls.brandsAutocomplete, {
						maxItemsToShow : 10,
						width : w
					});
				}
			});

	var searchStringDisplay = '';
	$('.shoppingLocatorForm form')
			.submit(
					function(event) {
						var form = $(this).closest('form')[0];

						var product;
						if ($(form).find('select[name="productSelect"]', form).length == 0) {
							product = $.trim($(form).find(
									'input[name="productSelect"]', form).val());
						} else {
							product = $
									.trim($(form).find(
											'select[name="productSelect"]',
											form).val());
						}

						var $this = $(this), articleType = 'GlobalBlueBrandListing', brand = $
								.trim($this
										.find(
												'input[name="searchStringShoppingTmp"]')
										.val()), city = $.trim($this.find(
								'select[name="citySelect"]').val()), area = $
								.trim($this.find('select[name="areaSelect"]')
										.val()), citySelectDisplay = $
								.trim($this
										.find(
												'select[name="citySelect"] option:selected')
										.text()), productSelectDisplay = $
								.trim($this
										.find(
												'select[name="productSelect"] option:selected')
										.text());

						if (brand + city + area + product == '') {
							event.preventDefault();
							return;
						}

						$this.find('input[name="articleType"]').remove();

						if (brand != '' && city + area == '') {
							articleType = 'GlobalBlueBrandWrapper';
						}

						if (brand != '') {
							if (GB.shouldModifyProductValue()) {
								product = '';
								productSelectDisplay = '';
							}
							citySelectDisplay = ', ' + citySelectDisplay;
							if (area != '')
								area = ' ' + area;
						}

						if (city != '') {
							city = 'section: (' + city + ')';
							if (area != '')
								area = ' ' + area;
						}
						if (city == '') {
							citySelectDisplay = '';
						}

						if (product != '') {
							product = 'section: (' + product + ')';
							if (city != '')
								productSelectDisplay = ', '
										+ productSelectDisplay;
						}

						if (product == '') {
							productSelectDisplay = '';
						}

						var values = [];
						$([ brand, city, area, product ]).each(
								function(i, value) {
									if (value != '')
										values.push(value);
								});

						$('.shoppingLocatorForm input[name="searchString"]')
								.val(values.join(' '));
						$this
								.append('<input type="hidden" name="articleTypes" value="'
										+ articleType + '">');
						$this
								.append('<input type="hidden" name="searchStringDisplay" value="'
										+ brand
										+ citySelectDisplay
										+ area
										+ productSelectDisplay + '">');
					});

	$('select[name="citySelect"]').change(
			function() {

				var form = $(this).closest('form')[0];

				if ($(this).val() != '') {
					var cityId = $(this).val();
					$('select[name="areaSelect"]', form).attr('disabled',
							'true').find('option[value!=""]').remove();
					$.ajax({
						url : GB.urls.areas,
						dataType : 'json',
						data : {
							citySectionId : cityId
						},
						success : function(data) {
							$.populateArea(data, form);
						}
					});
				} else {
					$('select[name="areaSelect"]', form).attr('disabled',
							'true').find('option[value!=""]').remove();
				}
			});

	$.urlParam = function(name) {
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)')
				.exec(window.location.href);
		return (results == null) ? null : (results[1] || null);
	}

	$.populateArea = function(data, form) {
		var optionsHtml = [];
		for ( var i = 0; i < data.length; i++) {
			optionsHtml.push('<option value="' + data[i] + '">' + data[i]
					+ '</option>');
		}
		if (form != null) {
			$('select[name="areaSelect"]', form).removeAttr('disabled').append(
					optionsHtml.join(''));
		} else {
			$('select[name="areaSelect"]').removeAttr('disabled').append(
					optionsHtml.join(''));
		}
	}

	$.selectArea = function() {
		var selectedArea = $.urlParam('areaSelect');
		if (selectedArea != null) {
			selectedArea = decodeURIComponent(selectedArea.replace(/\+/g, " "));
			selectedArea = 'option[value="' + selectedArea + '"]';
			$('select[name="areaSelect"]').find(selectedArea).attr('selected',
					true);
		}
	}

	$('select[name="citySelect"]').ready(function() {
		if ($('select[name="citySelect"]').val() != '') {
			var cityId = $('select[name="citySelect"]').val();
			$.ajax({
				url : GB.urls.areas,
				dataType : 'json',
				data : {
					citySectionId : cityId
				},
				success : function(data) {
					$.populateArea(data, null);
					$.selectArea();
				}
			});

		} else {
		}
	});
};

GB.shouldModifyProductValue = function() {
	return true;
}

GB.featuredItinerarySearch = function() {
	// Area auto population for Featured Itinerary Areas
	$('#featuredItineraryForm select[name="citySelect"]')
			.change(
					function() {
						if ($(this).val() != '') {
							var cityId = $(this).val();
							$(
									'#featuredItineraryForm select[name="areaSelect"]')
									.attr('disabled', 'true').find(
											'option[value!=""]').remove();
							$
									.ajax({
										url : GB.urls.areas,
										dataType : 'json',
										data : {
											citySectionId : cityId
										},
										success : function(data) {
											var optionsHtml = [];
											for ( var i = 0; i < data.length; i++) {
												optionsHtml
														.push('<option value="'
																+ data[i]
																+ '">'
																+ data[i]
																+ '</option>');
											}
											$(
													'#featuredItineraryForm select[name="areaSelect"]')
													.removeAttr('disabled')
													.append(
															optionsHtml
																	.join(''));
										}
									});
						} else {
							$(
									'#featuredItineraryForm select[name="areaSelect"]')
									.attr('disabled', 'true').find(
											'option[value!=""]').remove();
						}
					});
}

GB.shoppingSearchPlaceholders = function() {
	$('.shoppingLocatorForm input.input').each(
			function() {

				var placeholder = $(this).siblings(
						'label[for|="' + $(this).attr('name') + '"]').text();
				if (placeholder != '') {
					$(this).val(placeholder).addClass('blurred').data(
							'placeholder', placeholder);
				}

				$(this).focus(function() {
					if ($(this).val() == $(this).data('placeholder'))
						$(this).val('');
					$(this).removeClass('blurred');
				}).blur(
						function() {
							if ($.trim($(this).val()) == '') {
								$(this).val($(this).data('placeholder'))
										.addClass('blurred');
							}
						});
			});

	function clearPlaceholders() {
		$('.shoppingLocatorForm input.input').each(function() {
			if ($(this).val() == $(this).data('placeholder'))
				$(this).val('');
		});
	}

	$('form').submit(clearPlaceholders);
	$(window).unload(clearPlaceholders);
	addActionOnWindowUnload(clearPlaceholders);
};

GB.brandsList = function() {
	var $brandsList = $('.brandsList');
	if (!$brandsList.length)
		return;

	$brandsList.addClass('brandsListJS').prepend('<ul class="nav"></ul>');

	for ( var i = 0; i <= 26; i++) {
		var id = (i == 26) ? '123' : String.fromCharCode(65 + i);
		if ($('#brands' + id).length) {
			$brandsList.children('ul.nav').append(
					'<li><a href="#brands' + id + '">' + id + '</a></li>');
		} else {
			$brandsList.children('ul.nav').append(
					'<li><span>' + id + '</span></li>');
		}
	}

	$('.brandsList ul.nav a').click(
			function(event) {
				event.preventDefault();
				var id = $(this).attr('href').split('#')[1];
				$('#' + id).css('display', 'block').siblings(':not(.nav)').css(
						'display', 'none');
				$(this).parent().addClass('current').siblings('.current')
						.removeClass('current');
			}).eq(0).click();
};

GB.createMap = function(mapId, markers, getHtml) {
	if (!GBrowserIsCompatible())
		return;

	if (getHtml == null) {
		getHtml = generatetHtml;
	}

	var defaultIcon = new GIcon(G_DEFAULT_ICON);
	defaultIcon.image = GB.urls.skin + 'images/map-marker-unspecified.png';
	defaultIcon.shadow = GB.urls.skin + 'images/map-marker-shadow.png';
	defaultIcon.transparent = GB.urls.skin
			+ 'images/map-marker-transparent.png';
	defaultIcon.iconSize = new GSize(20, 22);
	defaultIcon.iconAnchor = new GPoint(12, 34);
	defaultIcon.shadowSize = new GSize(41, 34);
	defaultIcon.infoWindowAnchor = new GPoint(13, 0);
	defaultIcon.imageMap = [ 16, 0, 18, 1, 20, 2, 21, 3, 21, 4, 22, 5, 23, 6,
			23, 7, 23, 8, 24, 9, 24, 10, 24, 11, 24, 12, 24, 13, 24, 14, 23,
			15, 23, 16, 23, 17, 22, 18, 21, 19, 21, 20, 20, 21, 19, 22, 19, 23,
			18, 24, 18, 25, 17, 26, 16, 27, 16, 28, 15, 29, 14, 30, 14, 31, 13,
			32, 11, 32, 10, 31, 9, 30, 9, 29, 8, 28, 7, 27, 7, 26, 6, 25, 5,
			24, 5, 23, 4, 22, 3, 21, 3, 20, 2, 19, 2, 18, 1, 17, 1, 16, 0, 15,
			0, 14, 0, 13, 0, 12, 0, 11, 0, 10, 0, 9, 0, 8, 1, 7, 1, 6, 2, 5, 2,
			4, 3, 3, 4, 2, 5, 1, 7, 0 ];

	var bounds = new GLatLngBounds(), icons = {}, map = new GMap2(document
			.getElementById(mapId));

	$.each(markers, function(i, value) {
		var point = new GLatLng(value.lat, value.lng);

		bounds.extend(point);

		var type = ($.trim(value.type) !== '') ? value.type : 'unspecified';
		// alert(type);
		if (icons[type]) {
			var icon = icons[type];
		} else {
			var icon = new GIcon(defaultIcon, GB.urls.skin
					+ 'images/map-marker-' + type + '.png');
			icons[type] = icon;
		}
		var html = getHtml(value, i);

		var marker = new GMarker(point, {
			icon : icon
		});
		GEvent.addListener(marker, 'click', function() {
			if (html != '')
				marker.openInfoWindowHtml('<div class="infoWindow">' + html
						+ '</div>', {
					maxWidth : 220
				});
		});

		map.addOverlay(marker);
	});

	map.setCenter(bounds.getCenter(), Math.min(15, map
			.getBoundsZoomLevel(bounds) - 1));
	map.addControl(new GSmallZoomControl3D());

	$(document).unload(function() {
		GUnload();
	});
};

addImportToItineraryLink = function(markerValue, i) {
	var html = '', leadtext = $.trim($.decodeEntities(markerValue.leadtext)), type = $
			.trim(markerValue.type), title = $.trim($
			.decodeEntities(markerValue.title));

	// if (type == 'global_refund_store' || type == 'non_gr_shop') {
	if (markerValue.url !== window.location.href
			&& type == 'global_refund_store') {
		title = '<a href="' + markerValue.url + '">' + title + '</a>';
	}
	html += '<p class="title">' + title + '</p>';
	if (leadtext != '')
		html += '<p class="leadtext">' + leadtext + '</p>';

	html += '<p class="iternerary"><a onclick="addBrandListingToItinerary('
			+ markerValue.id + ',\'' + userValue + '\');">' + ADD_TO_ITINERARY
			+ '<a></p>';
	html = '<div class="' + type + '">' + html + '</div>';
	// }
	return html;
};

function generatetHtml(markerValue, i) {
	var html = '', leadtext = $.trim($.decodeEntities(markerValue.leadtext)), title = $
			.trim($.decodeEntities(markerValue.title));

	if (markerValue.url !== window.location.href) {
		title = '<a href="' + markerValue.url + '">' + title + '</a>';
	}
	html += '<p class="title">' + title + '</p>';
	if (leadtext != '')
		html += '<p class="leadtext">' + leadtext + '</p>';

	return html;
}

GB.pageTools = function() {
	if ($('.gbPageTools').length == 0)
		return;
	GB.pageToolsFontSizes();
	GB.pageToolsClippings();
};

GB.pageToolsFontSizes = function() {
	var fontSizes = {
		s : 75,
		m : 100,
		l : 125
	};

	function setFontSize(size) {
		if (size == null)
			return;
		$('.storyContent .body').css('font-size', fontSizes[size] + '%');
		$('.gbPageTools .textSize .' + size).addClass('current').siblings()
				.removeClass('current');
		$.cookie('fontSize', size);
	}

	$('.gbPageTools .textSize a').click(function(event) {
		event.preventDefault();
		setFontSize($(this)[0].className.split(' ')[0]);
	});

	setFontSize($.cookie('fontSize'));
};

GB.pageToolsClippings = function() {
	var html = '';
	var userCookie;

	html += GB.vars.shoppingListBubbleMessageForUnauthirizedUser;
	html = '<div class="clippingsBubble"><div class="clippingsBubbleWrapper">'
			+ html + '</div></div>';

	$('.gbPageTools .clipthis').prepend(html).hover(function() {
		var $self = $(this);
		if ($self.data('timeout') !== undefined) {
			window.clearTimeout($self.data('timeout'));
		}
		$self.addClass('hover');
		$('#at15s').css('display', 'none');
	}, function() {
		var $self = $(this);
		var timeout = window.setTimeout(function() {
			$self.removeClass('hover').removeData('timeout');
		}, 500);
		$self.data('timeout', timeout);
	});

	$('.gbPageTools .addthis_button').mouseenter(function() {
		$('.gbPageTools .clipthis').removeClass('hover');
	});

	// $('.gbPageTools .clipthis a').removeAttr("href");
	// Test
	// $.cookie('clippings', '1');
};
/*
 * GB.pageToolsClippings = function () { //$(".clippingsBubble").hide(); if
 * ($('.gbPageTools .clipthis').length == 0) return;
 * 
 * var html = ''; var userCookie; if ($.cookie('userLoggedIn') != null)
 * userCookie = $.cookie('userLoggedIn').split(',')[2]; else userCookie = "";
 * var userData = userCookie.split('_');
 * 
 * if (userData[0] == 'true') { // Logged in var clippedArticles =
 * ($.cookie('clippings') || '').split(encodeURIComponent(',')); if
 * ($.inArray(GB.articleId, clippedArticles) >= 0) { // Article already clipped
 * html += '<h2>Clipped</h2><p>You’ve already clipped this page.<br /><a
 * href="' + GB.urls.clippings + '">View your Shopping List</a>.</p>';
 * $('.gbPageTools .clipthis a').replaceWith('<span
 * class="clipthis_button">Clipped</span>'); } else { html += '<h2>Shopping
 * list</h2><p>Save this page to your account for printing, sharing or future
 * reference.<br /><a href="' + GB.urls.clippings + '">View your Shopping List</a>.</p>'; } }
 * else { html += '<h2>Shopping list</h2><p>Save this page to your account
 * for printing, sharing or future reference.<br /><a
 * class="shoppingListLogin" href="' + GB.urls.login + '">Log in</a> or <a
 * href="' + GB.urls.register + '">register</a> to get started.</p>'; }
 * 
 * html = '<div class="clippingsBubble"><div class="clippingsBubbleWrapper">' +
 * html + '</div></div>';
 * 
 * $('.gbPageTools .clipthis') .prepend(html) .hover( function () { var $self =
 * $(this); if ($self.data('timeout') !== undefined) {
 * window.clearTimeout($self.data('timeout')); } $self.addClass('hover');
 * $('#at15s').css('display', 'none'); }, function () { var $self = $(this); var
 * timeout = window.setTimeout(function () {
 * $self.removeClass('hover').removeData('timeout'); }, 500);
 * $self.data('timeout', timeout); } );
 * 
 * $('.gbPageTools .addthis_button').mouseenter(function () { $('.gbPageTools
 * .clipthis').removeClass('hover'); });
 *  // Test // $.cookie('clippings', '1'); };
 */

GB.clippingsForm = function() {
	var formRef = "";
	if ($('.clippingsForm').length > 0) {
		formRef = 'clippingsForm';
	} else if ($('.commentsForm').length > 0) {
		formRef = 'commentsForm';
	} else if ($('.ratingsForm').length > 0) {
		formRef = 'ratingsForm';
	} else if ($('.ratingsForm').length > 0) {
		formRef = 'ratingsForm';
	} else {
		return;
	}

	// Filter
	var $currentFilterOption = $(formRef + ' .filter option:selected');
	var allSelected = false;
	$('.' + formRef + ' .filter').find('input[type="submit"]').css('display',
			'none').end().find('select').change(function(event) {
		$('.filter form#' + formRef).submit();
	});

	// Select all
	$('#clippingSelectAll').click(
			function() {
				/*
				 * if (!allSelected) { $('.clippings
				 * input[type="checkbox"]').attr('checked', 'checked');
				 * $('.clippings li').addClass('checked'); } else {
				 * $('.clippings li').removeClass('checked'); $('.clippings
				 * input[type="checkbox"]').removeAttr('checked'); }
				 */

				if (!allSelected) {
					$('.' + formRef + ' input[type="checkbox"]').attr(
							'checked', 'checked');
					$('.' + formRef + ' li').addClass('checked');
				} else {
					$('.' + formRef + ' li').removeClass('checked');
					$('.' + formRef + ' input[type="checkbox"]').removeAttr(
							'checked');
				}
				checkAllChecked();
			});

	$('#clippingSort').click(function() {
		if ($(this).hasClass('sorted')) {
			$(this).removeClass('sorted');
			sortList('.' + formRef + ' ul li', '.sortByField', true);
		} else {
			$(this).addClass('sorted');
			sortList('.' + formRef + ' ul li', '.sortByField', false);
		}
	});

	$('.' + formRef + ' input[type="checkbox"]').change(function() {
		if (this.checked) {
			$(this).parents('li').addClass('checked');
		} else {
			$(this).parents('li').removeClass('checked');
		}
		checkAllChecked();
	});

	function checkAllChecked() {
		allSelected = true;
		$('.' + formRef + ' input[type="checkbox"]').each(function() {
			if (!$(this).attr('checked')) {
				allSelected = false;
			}
		});
		allSelected ? $('#clippingSelectAll').text(GB.vars.unselectAll) : $(
				'#clippingSelectAll').text(GB.vars.selectAll);
	}

	function sortList(elementSelector, valueSelector, ascending) {
		var sign = ascending ? -1 : 1;
		var elIndex = $(elementSelector).not("ul li li");
		var targetIndex = new Array();
		for ( var x = 0; x < elIndex.length; x++) {
			elIndex[x].sortKey = $(elIndex[x]).find(valueSelector).text();
			targetIndex[x] = $(elIndex[x]).parent();

		}
		elIndex.sort(function(a, b) {
			var keyA = a.sortKey;
			var keyB = b.sortKey;
			return sign * ((keyA < keyB) - (keyA > keyB));
		})

		$(elementSelector).each(function(index) {
			if (targetIndex[index] != undefined) {
				targetIndex[index].append(elIndex[index]);
			}
		});
	}

	$('.printBtn')
			.click(
					function() {
						if ($('.' + formRef + ' input:checked').length > 0) {
							var shownItem = $('.qBlock:visible')
							$('.qBlock').show();
							$('#header .logo img').hide();
							$('head')
									.append(
											'<style class="filterPrintCss" media="print">#right, .intro, .filter, .buttons, li, input.checkbox, #top .x940 {display:none;}  li.checked, .ratingDetail li {display:block;}</style>');
							// $('#header .logo a').append('<img
							// src="/skins/global-blue/images/GB_Logo_Master_whiteBG.jpg"
							// style="display:block;" />')
							$(
									'<img/>',
									{
										id : 'printLogo',
										src : '/skins/global-blue/images/GB_Logo_Master_whiteBG.jpg',
										load : function() {
											window.print();
											$('.' + formRef + ' .qBlock')
													.hide();
											shownItem.show();
											$('head .filterPrintCss').remove();
											$('#printLogo').remove();
											$('#header .logo img').show();
										}
									}).appendTo('#header .logo a');
							// window.print();

						} else {
							window.print();
						}
					});

	$('.deleteBtn').click(
			function() {
				if ($('#clippingsDataForm input:checked').length > 0) {
					GB.clippingsDataFormDeleteRedirect = function() {
						$('#clippingsDataForm form').submit();
					}
					GB.fancyModal('', "<p>"
							+ $('#clippingsDataForm input:checked').length
							+ " items have been deleted</p>", [ 'close' ],
							GB.clippingsDataFormDeleteRedirect);
				} else {
					GB.fancyModal('',
							"<p>You haven't selected any items to delete.</p>",
							[ 'close' ], '');
				}
			});
};

GB.unloadHandler = function(formId) {
	var form = $('#' + formId);
	var isSubmit = false;
	form.submit(function() {
		isSubmit = true;
		if (!($.browser.msie && $.browser.version == "6.0")) {
			window.onbeforeunload = false;
		}

	});
	form.delegate('input', 'keyup', function() {
		form.find('input:not(:hidden,:checkbox,:submit)').each(function() {
			if ($(this).val() !== '') {
				window.onbeforeunload = function() {
					if (isSubmit) {
						return;
					}
					return 'Are you sure that you want to leave?';
				};
				return false;
			} else {
				window.onbeforeunload = false;
			}
		});
	});
};

GB.fancyModal = function(headline, markup, buttonsArray, onCloseCallback) {
	var i, buttonsHtml = "", options = {}, modalHtml = "", buttonsObj = {
		'confirm' : {
			'value' : 'confirm',
			'id' : 'confirm-btn'
		},
		'cancel' : {
			'value' : 'cancel',
			'id' : 'cancel-btn'
		},
		'continue' : {
			'value' : 'continue',
			'id' : 'continue-btn'
		},
		'close' : {
			'value' : 'close',
			'id' : 'close-btn'
		}
	};

	for (i in buttonsArray) {
		if (buttonsObj[buttonsArray[i]]) {
			buttonsHtml += '<input class="modalButton" type="button" id="'
					+ buttonsObj[buttonsArray[i]].id + '" value="'
					+ buttonsObj[buttonsArray[i]].value + '" />'
		}
	}

	modalHtml = '<div class="modalContainer"><div class="modalLogo"><div class="modalHeadline"><h2>'
			+ headline
			+ '</h2></div></div><div class="message">'
			+ markup
			+ '</div>' + buttonsHtml + '</div>';

	if (!onCloseCallback) {
		onCloseCallback = function() {
		};
	}

	$.fancybox({
		content : $(modalHtml),
		onClosed : onCloseCallback
	});

	$('#continue-btn, #close-btn').live('click', function() {
		$.fancybox.close();
	});
};

GB.fancyModalWithButtonText = function(headline, markup, buttonsArray,
		onCloseCallback, buttonTextArray) {
	var i, buttonsHtml = "", options = {}, modalHtml = "", buttonsObj = {
		'confirm' : {
			'value' : 'confirm',
			'id' : 'confirm-btn'
		},
		'cancel' : {
			'value' : 'cancel',
			'id' : 'cancel-btn'
		},
		'continue' : {
			'value' : 'continue',
			'id' : 'continue-btn'
		},
		'close' : {
			'value' : 'close',
			'id' : 'close-btn'
		}
	};

	for (i in buttonsArray) {
		if (buttonsObj[buttonsArray[i]]) {
			buttonsHtml += '<input class="modalButton" type="button" id="'
					+ buttonsObj[buttonsArray[i]].id + '" value="'
					+ buttonTextArray[i] + '" />'
		}
	}

	modalHtml = '<div class="modalContainer"><div class="modalLogo"><div class="modalHeadline"><h2>'
			+ headline
			+ '</h2></div></div><div class="message">'
			+ markup
			+ '</div>'
			+ '<div class="modalButtonContainer">'
			+ buttonsHtml
			+ '</div>' + '</div>';

	if (!onCloseCallback) {
		onCloseCallback = function() {
		};
	}

	$.fancybox({
		content : $(modalHtml),
		onClosed : onCloseCallback
	});

	$('#continue-btn, #close-btn').live('click', function() {
		$.fancybox.close();
	});
};

GB.modal = function(message, buttonsArray, onCloseCallback, popupId) {
	var i, buttonsHtml = "", options = {}, modalHtml = "", buttonsObj = {
		'confirm' : {
			'value' : 'confirm',
			'id' : 'confirm-btn'
		},
		'cancel' : {
			'value' : 'cancel',
			'id' : 'cancel-btn'
		},
		'continue' : {
			'value' : 'continue',
			'id' : 'continue-btn'
		},
		'close' : {
			'value' : 'close',
			'id' : 'close-btn'
		}
	};

	for (i in buttonsArray) {
		if (buttonsObj[buttonsArray[i]]) {
			buttonsHtml += '<input class="button" type="button" id="'
					+ buttonsObj[buttonsArray[i]].id + '" value="'
					+ buttonsObj[buttonsArray[i]].value + '" />'
		}
	}

	options.containerId = popupId || 'custom-popup';
	options.overlayId = 'blue-overlay';
	options.overlayClose = true;
	options.onShow = function(dialog) {
		$(dialog.container).css('height', 'auto');
	};

	if (typeof onCloseCallback === 'function') {
		options.onClose = function() {
			onCloseCallback();
		};
	}

	modalHtml = '<div class="gb-logo"></div><div class="message">' + message
			+ '</div>';

	if (buttonsHtml !== "") {
		modalHtml += '<div class="buttons">' + buttonsHtml + '</div>';
	}

	$.modal(modalHtml, options);

	// button actions
	$('#continue-btn, #close-btn').live('click', function() {
		$.modal.close();
	});
};

GB.loginBox = function() {
	function openLogin() {
		var loginHtml = $('div.widget.profileActions.login').html();
		GB.fancyModal(GB.vars.login, loginHtml);
		/*
		 * $('div.widget.profileActions.login').modal({ containerId:
		 * 'login-popup', overlayId: 'blue-overlay', overlayClose: true, onShow:
		 * function(dialog) { $(dialog.container).css('height','auto'); } });
		 */
	}
	if (/p=login/.test(window.location.search)) {
		openLogin();
	}
	if (/login.do/.test(window.location.href)) {
		openLogin();
	}
	if (/p=expired/.test(window.location.search)) {
		openLogin();
		$('.session-expired-message').show();
	}
	$(
			'#header div.profileMenu li.first a, #main div.itenaryMsg p.first a, div.widget.profileActions h4 a.login, .shoppingListLogin, .clippingsForm a.login, a[name=importListingLogin]')
			.click(function() {
				openLogin();
				return false;
			});
	/*
	 * $('#main div.itenaryMsg p.first a').click(function () { openLogin();
	 * return false; }); $('div.widget.profileActions h4
	 * a.login').click(function () { openLogin(); return false; });
	 * $('.shoppingListLogin').click(function () { openLogin(); return false;
	 * }); $('.clippingsForm a.login').click(function () { openLogin(); return
	 * false; });
	 */
	$('#header div.profileMenu li:nth-child(2) a').click(function() {
		$('#editProfileForm').submit();
		return true;
	});

	/*
	 * $('div.widget.profileActions.login div.links li.first a').click(function () {
	 * $.ajax({ url: '/profile/resetPassword/', success: function(data) {
	 * $.modal.close(); setTimeout(function () {
	 * GB.modal($(data).find('.profileActions.resetPassword').html());
	 * GB.restetPassValidation(); }, 500); } }); return false; });
	 * $('#passwordForm .button').live('click', function () { $.ajax({ url:
	 * $('.resetPassword').attr('action'), data:
	 * $('.resetPassword').serialize(), success: function(data) {
	 * $.modal.close(); setTimeout(function () { GB.modal("<p>" +
	 * $(data).find('p.message').html() + "</p>", ['continue']); }, 1000); }
	 * }); return false; });
	 */
	if (/p=resetPassword/.test(window.location.search)) {
		$.ajax({
			url : GB.vars.resetPasswordURL,
			success : function(data) {
				$.modal.close();
				setTimeout(function() {
					GB.modal($(data).find('.profileActions.resetPassword')
							.html());
					GB.restetPassValidation();
				}, 500);
			}
		});
	}
	$('div.widget.profileActions.login div.links li.first a').click(
			function() {
				$.ajax({
					url : GB.vars.resetPasswordURL,
					success : function(data) {
						$.modal.close();
						setTimeout(function() {
							GB.modal($(data).find(
									'.profileActions.resetPassword').html());
							GB.restetPassValidation();
						}, 500);
					}
				});
				return false;
			});

	function openResetPassword() {
		var resetPassErrorHtml = $(document).find('.profileActions .error')
				.html();
		if (resetPassErrorHtml != undefined || resetPassErrorHtml != null) {
			return;
		}

		// $(document).find('.profileActions.resetPassword').css("display","none");
		var resetPassFormhtml = $(document).find(
				'.profileActions.resetPassword').html();
		GB.fancyModal(GB.vars.resetPassword, resetPassFormhtml, [ 'continue' ],
				redirectHome);
		GB.restetPassValidation();
	}

	if (/resetPassword.do/.test(window.location.href)) {
		openResetPassword();
	}
	if (/p=call_session_expiry/.test(window.location.search)) {
		$.ajax({
			url : GB.vars.logOffURL,
			context : document.body,
			async : false,
			success : function() {
				document.location.href = redirectUrl;
			},
			error : function(jqXHR, textStatus, errorThrown) {
				document.location.href = redirectUrl;
			}
		});
	}
};

GB.regFormSlide = function(triggerSel, targetSel) {
	var targetEl = $(targetSel), triggerEl = $(triggerSel);

	targetEl.hide();
	triggerEl.addClass('up');

	$(triggerSel).click(function() {
		if (targetEl.is(":hidden")) {
			targetEl.slideDown(500);
			triggerEl.addClass('down').removeClass('up');
		} else {
			targetEl.slideUp(500);
			triggerEl.addClass('up').removeClass('down');
		}
	});
};

GB.setFullName = function(form) {
	if (form['field(FULLNAME)'] != null && form['field(FIRSTNAME)'] != null
			&& form['field(SURNAME)'] != null) {
		form['field(FULLNAME)'].value = form['field(SURNAME)'].value + ' '
				+ form['field(FIRSTNAME)'].value;
	}
};

GB.validator = function(formSelector) {
	var i, validations = [], formObj = $(formSelector), regexpObj = {
		email : /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/,
		notempty : /.+/,
		notnumempty : /\D+/
	}, runValidators = function(validatorsArray) {
		var formElem, formElem2, status = true, fieldsToCompare, paramString, method, displayError = function() {
			var errorMarkup = '<div class="error"><p>'
					+ validatorsArray[i].errorMessage + '</p></div>';
			if (formElem.parent().parent().hasClass('checkbox')) {
				if (formElem.parent().parent().find('dd')) {
					formElem.parent().parent().find('dd').append(errorMarkup);
				} else {
					formElem.parent().parent().append(errorMarkup);
				}

			} else {
				formElem.after(errorMarkup);
			}
			status = false;
		};

		$('.error').remove();

		for ( var i = 0; i < validatorsArray.length; i++) {
			method = validatorsArray[i].validateMethod;
			if (method === 'compare') {
				fieldsToCompare = validatorsArray[i].formFieldName.split(' ');
				formElem = formObj.find('[name="' + fieldsToCompare[0] + '"]');
				formElem2 = formObj.find('[name="' + fieldsToCompare[1] + '"]');
				if (formElem.val() !== formElem2.val()) {
					displayError();
				}
			} else {
				formElem = formObj.find('[name="'
						+ validatorsArray[i].formFieldName + '"]');
				if (method === 'checked') {
					if (!formElem.is(':checked')) {
						displayError();
					}
				} else if (method === 'date') {					
					if (formElem.val().length != 0) {						
						var rxDatePattern = /^(\d{1,2})(\/)(\d{1,2})(\/)(\d{4})$/;

						if (rxDatePattern.test(formElem.val()) == false) {
							displayError();
						} else {						
							var dt = new Date();
							var today = new Date(dt.getFullYear(), dt
									.getMonth(), dt.getDate());
							var dobArray = formElem.val().split("/");
							if (dobArray[1] > 12 || dobArray[1] < 1) {								
								displayError();
							} else if ((dobArray[1] == 1 || dobArray[1] == 3
									|| dobArray[1] == 5 || dobArray[1] == 7
									|| dobArray[1] == 8 || dobArray[1] == 10 || dobArray[1] == 12)
									&& (dobArray[0] < 1 || dobArray[0] > 31)) {
								displayError();
							} else if ((dobArray[1] == 4 || dobArray[1] == 6
									|| dobArray[1] == 9 || dobArray[1] == 11)
									&& (dobArray[0] < 1 || dobArray[0] > 30)) {
								displayError();
							} else if (dobArray[1] == 2 && dobArray[2] % 4 == 0
									&& (dobArray[0] < 1 || dobArray[0] > 29)) {
								displayError();
							} else if (dobArray[1] == 2 && dobArray[2] % 4 != 0
									&& (dobArray[0] < 1 || dobArray[0] > 28)) {
								displayError();
							} else {
								var dob = new Date(dobArray[2],
										dobArray[1] - 1, dobArray[0]);
								if (dob >= today) {
									displayError();
								}

							}

						}
					}

				} else if (/^not-/.test(method)) {
					paramString = method.slice(4);
					if (formElem.val() === paramString) {
						displayError();
					}
				} else if (/^min-/.test(method)) {
					paramString = method.slice(4);
					if (formElem.val().length < +paramString) {
						displayError();
					}
				} else {
					if (regexpObj[method].test($.trim(formElem.val())) === false) {
						displayError();
					}
				}
			}
		}
		return status;
	};

	formObj.find('input[type="submit"]').click(function() {
		return runValidators(validations);
	});

	return {
		addValidation : function(formFieldName, validationMethod, message) {
			validations.push({
				formFieldName : formFieldName,
				validateMethod : validationMethod,
				errorMessage : message
			});
		},
		validate : function() {
			return runValidators(validations);
		},
		getValidations : function() {
			return validations;
		}
	}
};

GB.changePass = function(url) {
	function modal(responseHtml) {
		$.modal('<div id="pchange">'
				+ $(responseHtml).find('#main .x635 .column-1').html()
				+ '</div>', {
			containerId : 'change-pass-popup',
			overlayId : 'blue-overlay',
			overlayClose : true,
			onShow : function(dialog) {
				$(dialog.container).css('height', 'auto');
			}
		});
		GB.changePassValidation();
	}

	// we do not need this anymore. delete this after testing all modal
	/*
	 * $('.change-pass').click(function () { $.ajax({ url: url, success:
	 * function (data) { modal(data); } }); return false; });
	 */
	$('#change-pass-popup #changePasswordForm').live(
			'submit',
			function() {
				$.ajax({
					url : $('#changePasswordForm').attr('action'),
					data : $('#changePasswordForm').serialize(),
					success : function(data) {
						$.modal.close();
						setTimeout(function() {
							if ($(data).find('p.success').html() !== null) {
								GB.modal("<p>"
										+ $(data).find('p.success').html()
										+ "</p>", [ 'close' ]);
							} else {
								modal(data);
							}
						}, 500);
					}
				});
				return false;
			});
};

GB.changeProfilePictureAjax = function(url, errorMsg) {
	$.ajax({
		url : url,
		success : function(data) {
			var modalHtml = '<div id="avatarChange"> ';
			if (errorMsg) {
				modalHtml += '<p class="error">' + errorMsg + '</p>'
			}
			modalHtml += $(data).find('#main .uploadProfilePicture').html()
					+ ' </div>';
			GB.fancyModal('', modalHtml, '', '');
			var deleteCheckobx = $('[name="field(deletePicture)"]');
			$(deleteCheckobx).click(function() {
				if (deleteCheckobx.is(':checked')) {
					$('#picture').attr("disabled", "disabled");
				} else {
					$('#picture').removeAttr('disabled');
				}
			});
		}
	});
};

GB.changeProfilePicture = function(url) {
	$('.edit-profile-image').click(function() {
		GB.changeProfilePictureAjax(url);
		return false;
	});
};

GB.regFormLinks = function(pubName) {
	var lang;

	switch (pubName) {
	case 'globalblue':
		lang = 'english';
		break;
	case 'globalbluezh':
		lang = 'chinese';
		break;
	case 'globalblueru':
		lang = 'russian';
		break;
	default:
		lang = 'english';
	}

	$('a.priv')
			.click(
					function() {
						window
								.open('/template/custom/' + lang
										+ '/privacyPolicyCookies.htm',
										'privacyPolicy',
										'width=540, height=360, resizable, scrollbars, toolbar=no, menubar=no');
						return false;
					});
	$('a.tc')
			.click(
					function() {
						window
								.open(
										'/template/custom/'
												+ lang
												+ '/registrationTermsandConditions.htm',
										'privacyPolicy',
										'width=540, height=360, resizable, scrollbars, toolbar=no, menubar=no');
						return false;
					});
};

$(document).ready(function() {
	GB.languageSelector();
	GB.trailersWithOverlay();
	GB.shoppingSearchPlaceholders();
	GB.shoppingSearch();
	GB.featuredItinerarySearch();
	GB.brandsList();
	GB.pageTools();
	GB.clippingsForm();
	GB.loginBox();
	GB.preventPageTools();
});
GB.preventPageTools = function() {
	$(".addthis_button_print,.addthis_button_email,.addthis_button").click(function(evt) {
		evt.preventDefault();
		return false;
	});	
};

var RatingsWidget = (function() {
	var ratingSubject = {};
	var commentSet = false;
	var currURL = "";
	var articleID = "";
	var homeSectionID = "";

	function fetchData(url, type, func, d) {
		$.ajax({
			url : url,
			dataType : type,
			data : d || null,
			async : false,
			success : func,
			error : function(jqXHR, textStatus, errorThrown) {
			}
		});
	}
	;

	var Rating = function(ratingsSet, UIEnabled) {

		this.itemArr = new Array();
		var _this = this;
		var ellArr = document.getElementById(ratingsSet)
				.getElementsByClassName('ratingIcon'), currentRating;

		var RatingBlock = function(e, i, UIEnabled) {
			var idx = i;
			this.isSet = false, this.el = e;

			// to add attachEvent for IE - http://help.dottoro.com/ljahxbsx.php
			if (UIEnabled) {
				if (this.el.addEventListener) {
					this.el.addEventListener('click', rate);
					this.el.addEventListener('mouseover', mouseOver);
					this.el.addEventListener('mouseout', mouseOut);
				} else if (this.el.attachEvent) {
					this.el.attachEvent('onclick', mouseOver);
					this.el.attachEvent('onmouseover', mouseOver);
					this.el.attachEvent('onmouseout', mouseOver);
				}
			}

			function mouseOver() {
				if (typeof currentRating !== 'undefined') {
					if (idx < currentRating) {
						for ( var i = (idx + 1); i <= 4; i++) {
							_this.itemArr[i].mouseOut(true);
						}
					} else {
						for ( var i = currentRating; i <= idx; i++) {
							_this.itemArr[i].mouseOver();
						}
					}
				}
				if (typeof currentRating == 'undefined') {
					for ( var i = 0; i <= idx; i++) {
						_this.itemArr[i].mouseOver();
					}
				}
			}

			function mouseOut() {
				if (typeof currentRating !== 'undefined') {
					if (idx < currentRating) {
						for ( var i = 0; i <= (currentRating - 1); i++) {
							_this.itemArr[i].mouseOver();
						}
					} else {
						for ( var i = currentRating; i <= idx; i++) {
							_this.itemArr[i].mouseOut(true);
						}
					}
				}
				if (typeof currentRating == 'undefined') {
					for ( var i = 0; i <= idx; i++) {
						_this.itemArr[i].mouseOut();
					}
				}
			}

			function rate() {
				currentRating = idx + 1;
				for ( var i = 0; i <= idx; i++) {
					_this.itemArr[i].rate();
				}
				_this.itemArr[currentRating - 1].updateFormField(currentRating);
			}

			this.setRating = function() {
				rate();
			};
			this.disable = function() {
				this.el.removeEventListener('click', rate);
				this.el.removeEventListener('mouseover', mouseOver);
				this.el.removeEventListener('mouseout', mouseOut);
			}

		}

		RatingBlock.prototype.mouseOver = function() {
			this.el.style.backgroundImage = 'url(/skins/global-blue/images/ratings/rating-select.png)';
		}

		RatingBlock.prototype.mouseOut = function(flag) {
			if (!this.isSet || flag) {
				this.el.style.backgroundImage = 'url(/skins/global-blue/images/ratings/rating-blank.png)';
			}
		}

		RatingBlock.prototype.rate = function() {
			this.el.style.backgroundImage = 'url(/skins/global-blue/images/ratings/rating-select.png)';
			this.isSet = true;
		}

		RatingBlock.prototype.resetIcon = function() {
			this.el.style.backgroundImage = 'url(/skins/global-blue/images/ratings/rating-blank.png)';
		}

		RatingBlock.prototype.updateFormField = function(updateRatingTo) {
			var idToSendVal = this.el.parentNode.id.replace('Set', '');
			document.getElementById(idToSendVal).getElementsByClassName(
					'ratingData')[0].value = updateRatingTo;
		}

		for (i = 0; i < ellArr.length; i++) {
			_this.itemArr.push(new RatingBlock(ellArr[i], i, UIEnabled));
		}

		return {
			setRating : function(r) {
				_this.itemArr[r].setRating();
			},
			getData : function(key) {
				return $('.ratingsContainer li.' + key + ' #' + key).attr(
						"value");
			},
			disable : function() {
				for ( var i in _this.itemArr) {
					_this.itemArr[i].disable();
				}
			}
		}
	}

	function commentBoxDefaults(el) {
		var defaultTxt = el[0].value;
		el[0].onfocus = function() {
			this.setAttribute("class", "selected");
			if (this.value == defaultTxt) {
				commentSet = true;
				this.value = "";
			}

		};
		el[0].onblur = function() {
			if (this.value == "") {
				this.setAttribute("class", "");
				this.value = defaultTxt;
				commentSet = false;
			}
		};
	}

	function setPage(submitEnabled) {
		var submitEnabled = false;
		if (submitEnabled) {

		}
	}

	function disableUI() {
		$('.ratingsComments').css('display', 'none');
		for ( var i in ratingSubject) {
			ratingSubject[i].disable();
		}
	}

	function submitStarRating() {

		var comment = "";
		var submitEnabled = true;
		if (commentSet) {
			comment = $('.ratingsContainer .ratingsComments textarea').val();
		}
		var index = 0;
		var postData = {};
		for ( var key in ratingSubject) {
			index++;
			postData['rating_' + index] = key;
			postData[key] = ratingSubject[key].getData(key);
			if (postData[key] == null || postData[key] == "")
				submitEnabled = false;
		}
		postData.ratingComments = comment;
		postData.articleId = articleID;
		postData.ratingHomesectionId = homeSectionID;

		if (submitEnabled) {
			fetchData(currURL + "service/ratings/ratings/", "POST", function(
					data) {
				disableUI();
				GB.modal("<p>Thank you for your feedback.</p>", [ 'close' ],
						null, 'custom-popup');
				$('.ratingsErrorTxt').text('');
				init(articleID, currURL, true);
			}, postData);
		} else {
			$('.ratingsErrorTxt').text(
					'*make sure you have rated each article criteria');
		}
	}

	function runConfig(d, reset) {
		var data = JSON.parse(d);
		if (data) {
			var UIEnabled = data.SUBMIT_ENABLED;
			if (!reset) {
				if (UIEnabled == true) {
					$('.ratingsComments').css('display', 'block');
					$('#ratingSubmit').css('display', 'block');
					$('.ratingInfoTxt').css('display', 'none');
				} else {
					$('.ratingInfoTxt').css('display', 'block');
					$('#ratingSubmit').css('display', 'none');
					$('.ratingsComments').css('display', 'none');
				}
				var categories = document
						.getElementsByClassName('ratingsContainer')[0]
						.getElementsByTagName('li');

				for ( var i = 0; i < categories.length; i++) {
					var catIndex = categories[i]
							.getElementsByClassName('ratingName')[0].value;
					ratingSubject[catIndex] = new Rating('rating_set_'
							+ (i + 1), UIEnabled);
				}

				var commentBox = document
						.getElementsByClassName('ratingsContainer')[0]
						.getElementsByTagName("textarea");

				if (commentBox.length > 0) {
					commentBoxDefaults(commentBox);
				}

				$('#ratingSubmit').click(function() {
					submitStarRating();
				});
			}

			for ( var i in data.CONTENT) {
				var key = data.CONTENT[i].RATING_KEY;
				var targetEl = $('.ratingsContainer ul li.' + key);
				var ratingVal = (data.CONTENT[i].RATING_VALUE - 1);

				if (targetEl.length > 0) {
					ratingSubject[key].setRating(ratingVal);
				}
			}

		}
	}
	function init(ID, url, homeID, reset) {
		currURL = url;
		articleID = ID;
		homeSectionID = homeID;
		if (reset) {
			$('.ratingsContainer .ratingIcon').css('background-image',
					'url(/skins/global-blue/images/ratings/rating-blank.png)');
		}
		fetchData(url + "service/ratings/displayRatings/?articleId="
				+ articleID + "&ratingHomesectionId=" + homeSectionID, "GET",
				function(data) {
					runConfig(data, reset)
				});
	}

	return {
		init : init
	}

})();

$(document)
		.ready(
				function() {
					$('.article-gallery .close-link').click(function() {
						window.close();
						return false;
					});
					$(".article-gallery .navimages")
							.live(
									"click",
									function() {
										var mpuHeight = "250";
										var mpuWidth = "300";
										$("#mpuAd").html("");

										$("#mpuAd")
												.append(
														"<iframe src='/add.html' scrolling='no' marginwidth='0' margineheight='0' height='"
																+ mpuHeight
																+ "' width='"
																+ mpuWidth
																+ "' frameBorder='0' style='overflow:hidden;'></iframe>");
									});

					GB.utils.disableLinks('.gbNoLink');

					GB.utils.setInfoBtns();
				});

function addActionOnWindowUnload(eventHandler) {
	if (window.addEventListener) {
		window.addEventListener("beforeunload", eventHandler, false);
	} else if (window.attachEvent) {
		window.attachEvent("onbeforeunload", eventHandler);
	}

}
