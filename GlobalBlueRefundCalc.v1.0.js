/**
 * The Global Blue Tax Refund Calculator
 * @author <a href="mailto:luke.dyson@flyinganvil.co.uk">Luke Dyson</a>
 */

/**
 * Creates a new calculator, and has several configuration options:
 *
 *  + No configuration: Will create a small calculator
 *  + DOM Configuration: Using the DOM to configure the calculator, eg:
 *      <div id="calcInjectionPoint" lang="en" size="large"></div>
 *    Uses the default ID for creation, and also sets the language and size properties using the 'lang' and 'class' attributes
 *    'lang' can be any of the language codes as per http://www.w3.org/TR/html401/sgml/dtd.html#LanguageCode
 *    'class' can be 'largeCalc', or 'smallCalc'
 *  + Constructor configuration: Using the constructor by passing a configuration object, as described below.
 *
 * Example as follows:
 *
 * <div id="CALC_DOM_ID" size="UNIT_SIZE" lang="UNIT_LANG">
 *	<script>
 *		new GlobalBlueRefundCalc({
 *			injectionPoint: 'CALC_DOM_ID', // The DOM ID of the injection point (see <div...> above)
 *			remoteAccess: true, // Defined if this unit is not hosted and required third-party access to JSON
 *			facebook: false, // For full page calcs, used to skin the unit using facebook styling
 *			jurisdiction: 'JURISDICTION_CODE', // Used for Express and Contextual units, used to define the jurisdiction required for calculation (eg, 'ARG' for Argentina)
 *			refundAmount: AMOUNT_OF_REFUND, // Used for contextual units, required to calculate a refund
 *			urls: {
 *				en: {
 *					fullCalc: 'EN_PAGE_CALC_URL', // English URL for the full page calculator
 *					terms: 'EN_TERMS_URL' // English URL for the terms and conditions
 *				},
 *				zh: {
 *					fullCalc: 'ZH_PAGE_CALC_URL', // Chinese URL for the full page calculator
 *					terms: 'EN_TERMS_URL' // Chinese URL for the terms and conditions
 *				},
 *				ru: {
 *					fullCalc: 'RU_PAGE_CALC_URL', // Russian URL for the full page calculator
 *					terms: 'EN_TERMS_URL' // Russian URL for the terms and conditions
 *				}
 *			},
 *			socialSettings: {
 *				url: 'SITE_URL', // URL for use when user shares on social media sites
 *				imgUrl: 'SITE_IMG_URL' // URL for the image if the social media site supports thumbnailing
 *			}
 *		});
 *	</script>
 * </div>
 * 
 * @class Represents a calculator
 * @param {Object} [config]							Optional parameter containing configuration for this calculator
 * @param {String} [config.size]					Optional config to define the size. Either 'large' or 'small'
 *   @default 'mpu'
 * @param {String} [config.language]				Optional config to define the language to use.
 *	 @default 'en'
 * @param {String|Object} [config.injectionPoint]	Optional config to define the DOM Object or DOM ID to use
 *   @default 'calcInjectionPoint'
 * 
 */
function GlobalBlueRefundCalc(config) {
	
	// Developer mode
	this.developerMode = false;
	
	// Unit test mode
	this.unitTestMode = (config.unitTestMode ? config.unitTestMode : false);
	
	/**
	 * Used to define the injection point, either by ID or DOM object
	 *
	 * If an injectionPoint is not found, this will prevent this class from loading
	 *
	 * @type {Object}
	 * @default DOM Object with ID 'calcInjectionPoint'
	 */
	this.injectionPoint = (function(config){
		var domObject = null;
		
		// Check configuration, otherwise attempt to use default
		if (typeof config !== 'undefined' && (typeof config.injectionPoint !== 'undefined' && config.injectionPoint !== null)) {
			domObject = config.injectionPoint === 'object' ? config.injectionPoint : document.getElementById(config.injectionPoint);
		} else {
			domObject = document.getElementById('calcInjectionPoint');
		}
		
		// If an appropriate object is found, continue, otherwise issue an error.
		if (domObject !== null) {
			return domObject;
		} else {
			utils.ERROR.log('ERROR: Injection Point is not defined');
			return null;
		}
	}(config));
	
	// If the injection point is not defined, may as well halt everything now.
	if (this.injectionPoint === null) {
		utils.ERROR.log('Now halting execution');
		return false;
	}
	
	/**
	 * Used to define whether the calculator being rendered is the large form or small form version.
	 *
	 * Size can either be 'large' or 'small'
	 *
	 * @type {String}
	 * @default 'small'
	 */
	this.size = (typeof config !== 'undefined' && typeof config.size === 'string' ? config.size.toLowerCase() : 'mpu-int');
	
	/**
	 * Statically defined list of allowed languages
	 *
	 * @type {Array}
	 */
	this.acceptedLanguages = ["en", "ru", "zh"];
	
	/**
	 * Language used for internationalisation, can be configured either by:
	 *  + Config: The configuration object should contain a language string.
	 *  + DOM: The injection point area will have a lang attribute
	 *  + URL: via search string in the form 'lang=<LANGUAGE>'
	 * ** NOTE ** This configuration is calculated in the order defined. If all are defined, the Config object will take precedence, etc.
	 *
	 * @type {String}
	 * @default 'en'
	 */
	this.languageConfig = (function(config, me){
		if (me.injectionPoint) {
			if (typeof config !== 'undefined' && typeof config.language === 'string' && utils.ARRAYS.indexOf(me.acceptedLanguages, config.language) > -1) {
				return config.language;
			} else if (me.injectionPoint && me.injectionPoint.lang !== '' && utils.ARRAYS.indexOf(me.acceptedLanguages, me.injectionPoint.lang) > -1) {
				return me.injectionPoint.lang;
			} else if (utils.URL.searchObjectify && typeof utils.URL.searchObjectify.lang !== 'undefined' && utils.ARRAYS.indexOf(me.acceptedLanguages, utils.URL.searchObjectify.lang) > -1) {
				return utils.URL.searchObjectify.lang;
			} 
			return 'en';
		}
		return null;
	}(config, this));
	
	/**
	 * Persistence for language i18n objects
	 *
	 * @type {Object}
	 * @default null
	 */
	this.language = null;
	
	// TODO: Make this configurable
	this.urls = (function(urls, social, language){
		urls = typeof urls !== 'undefined' ? (typeof urls[language] !== 'undefined' ? urls[language] : urls) : {};
		
		social = typeof social !== 'undefined' ? social : {};
		
		var mainSite = 'http://www.global-blue.com/';
		
		var appSite = config.unitTestMode ? '' : 'http://tools.globalblue.com/refundCalc/';// 'http://192.168.1.64:8999/refundCalc/';
		
		var urlsObj = {
			mainSite: mainSite,
			
			fullCalc: (typeof urls.fullCalc !== 'undefined' && urls.fullCalc.substr(0, 1) === '/' ? mainSite : '') + (urls.fullCalc ? urls.fullCalc : 'customer-services/tax-free-shopping/refund-calculator/'),
			terms: (typeof urls.terms !== 'undefined' && urls.terms.substr(0, 7) !== 'http://' ? mainSite : '') + (urls.terms ? urls.terms : 'customer-services/refund-calculator-disclaimer/'),
			
			css: appSite + 'css/',
			img: appSite + 'img/' + (utils.COMMON.browserInfo.hasRetinaSupport() ? 'r/' : ''),
			json: appSite + 'json/',
			
			social: {
				url: (typeof social.url !== 'undefined' && social.url.substr(0, 1) === '/' ? mainSite : '') + (social.url ? social.url : '#social'),
				imgUrl: (social.imgUrl ? social.imgUrl : 'http://www.global-blue.com/config/article114788.ece/BINARY/global_blue_new_logo.png')
			}
		};
		return urlsObj;
	}(config.urls, config.socialSettings, this.languageConfig));
	
	/**
	 * Caching object to store loaded data
	 *
	 * @type {Object}
	 */
	this.jurisdictions = null;
	
	/**
	 * Used for pages where a user selected jurisdiction is not required
	 */
	this.configJurisdiction = (typeof config.jurisdiction !== 'undefined' ? config.jurisdiction : (utils.URL.searchObjectify && typeof utils.URL.searchObjectify.jurisdiction !== 'undefined' ? utils.URL.searchObjectify.jurisdiction : null));
	
	/**
	 * Used to apply facebook skin (for full page calculator only)
	 *
	 * @type {Boolean}
	 * @default false
	 */
	this.configFacebookSkin = (typeof config.facebook !== 'undefined' ? config.facebook : false);
	
	/**
	 * Used for DOM components within the calculator
	 */
	// TODO: refactor?
	this.template = '';
	this.refundCalc = null;
	this.notificationArea = null;
	this.refundStackTableTemplate = null;
	this.refundStackTable = null;
	this.refundStackTableTotalTemplate = null;
	this.refundStackTableTotal = null;
	this.refundForm = null;
	this.refundAmount = null;
	this.jurisdictions = null;
	this.refundInput = null;
	this.refresh = null;
	this.social = null;
	this.mpuRefundCount = 0;
	this.currencySymbol = '';
	this.cssRef = null;
	
	/**
	 * Object containing social links for all i18n configurations
	 *
	 * @type {Object}
	 */
	this.socialShareLinks = {
		facebook: 'https://www.facebook.com/dialog/feed?app_id=219781968163385&link=' + encodeURIComponent(this.urls.social.url) + '&picture=' + encodeURIComponent(this.urls.social.imgUrl) + '&name=%%TITLE%%&description=%%DESCRIPTION%%&redirect_uri=http%3A%2F%2Fwww.globalblue.com%2F',
		twitter: 'http://twitter.com/share?url=' + this.urls.social.url + '&text=%%DESCRIPTION%%',
		vkontakte: 'http://vkontakte.ru/share.php?url=' + this.urls.social.url + '&title=%%TITLE%%&description=%%DESCRIPTION%%&image=' + this.urls.social.imgUrl,
		weibo: 'http://service.weibo.com/share/share.php?url=' + this.urls.social.url + '&title=%%DESCRIPTION%%&pic=' + this.urls.social.imgUrl + '&language=zh_cn',
		qq: 'http://v.t.qq.com/share/share.php?title=%%DESCRIPTION%%&url=' + this.urls.social.url
	};
	this.iconUrl = this.urls.img + 'icons' + (utils.COMMON.browserInfo.hasRetinaSupport() ? '.png' : '.gif');
	
	/**
	 * An array used to store stacked refunds
	 *
	 * @type {Array}
	 */
	this.refundStack = [];
	
	/**
	 * Persistent store for the sum of refund(s)
	 *
	 * @type {Number}
	 * @default 0
	 */
	this.refundSum = 0;
	this.amountSum = 0;
	
	/**
	 * Currency symbols persistence
	 *
	 * @type {Object}
	 * @default null
	 */
	this.currencySymbols = null;
	
	/**
	 * Used to configure the input amount to calculate a refund for
	 */
	this.configRefundAmount = (config.refundAmount ? config.refundAmount : null);
	
	/**
	 * Used to decide whether this class needs cross domain access to data
	 */
	this.remoteAccess = (config.remoteAccess ? config.remoteAccess : false);
	
	/**
	 * Initialisation method which sets up this instance
	 */
	this.initialise = function() {
		var me = this;
		
		// Only initialise if an injectionPoint has been defined.
		if (me.injectionPoint) {
			// If this object hasn't been constructed with a size, or configured using the URL, check the size attribute
			if (me.injectionPoint.getAttribute('size')) {
				// CSS config: either 'largeCalc' in the class attribute
				me.size = me.injectionPoint.getAttribute('size');
			} else if (utils.URL.searchObjectify !== null && typeof utils.URL.searchObjectify.size !== 'undefined')  {
				// URL config: use 'size=<SIZE>' in the URL Search string, where size is 'large' or 'small'
				me.size = utils.URL.searchObjectify.size;
			}
		
			var buildCalculator = false;
		
			// Page size
			if (me.size === 'page') {
				me.cssRef = utils.COMMON.loadCSS(me.urls.css + 'page.css');
				
				me.refundStackTableTemplate = '<table class="stack" style="display:none;"><tbody></tbody></table>';
				me.refundStackTableTotalTemplate = '<table class="total"><tbody><tr><td class="symbol"></td><td class="amount">0.00</td><td class="total tblue">%%TOTALREFUND%%</td><td class="symbol tblue"></td><td class="refund tblue">0.00</td><td class="remove"></td></tr></tbody></table>';

				me.template = '<div class="page" id="calc"><div class="form"><form name="refund"><fieldset><div class="jurisdictionSelect"><div class="desc"><h3>%%SELECTCOUNTRY%%</h3><p>%%SELECTCOUNTRYDESC%%</p></div><div class="select"><select name="jurisdictions"><option value="NONE">%%SELECTCOUNTRY%%</option></select></div></div><div class="notification" style="display:none;"><div class="message"><p></p><div class="close" tabindex="0"></div></div></div><div class="purchaseDesc"><h3>%%ENTERPURCHASES%%</h3><p>%%ENTERPURCHASESDESC%%</p></div><div class="input"><div><span class="symbol"></span><input type="text" name="refundInput" value="%%REFUNDAMOUNT%%" class="refundInput"></div></div><input type="submit" class="submitBtn" value="%%CALCULATEBUTTON%%" name="submitRefund" disabled><div class="refund"><div><p>%%TAXREFUND%%</p><span class="symbol"></span><span class="refundAmount">0.00</span></div><a href="#" class="appendRefund"><img src="' + me.iconUrl + '" width="26" tabindex="0" alt="%%APPENDREFUND%%" class="disabled"></a></div></fieldset></form></div>' + me.refundStackTableTemplate + me.refundStackTableTotalTemplate + '</div>';

				me.i18n();
				
			// Express	
			} else if (me.size === 'express') {
				me.cssRef = utils.COMMON.loadCSS(me.urls.css + 'express.css');
				
				me.template = '<div class="express" id="calc"><div class="form"><p>%%HOWMUCHSAVE%%</p><form name="refund"><fieldset><div class="select"><select name="jurisdictions"><option value="NONE">%%SELECTCOUNTRY%%</option></select></div><div class="input"><span class="symbol"></span><input type="text" name="refundInput" value="%%REFUNDAMOUNT%%"></div><input type="submit" class="submitBtn" value="%%CALCULATEBUTTON%%" name="submitRefund" disabled></fieldset></form></div><div class="notification" style="display:none"><div class="modal"></div><div class="message">' + (utils.COMMON.isIE && utils.COMMON.browserInfo.name === 'MSIE' ? '<img src="' + me.urls.img + 't.gif">' : '') + '<p></p><div class="close" tabindex="0"></div></div></div><div class="refund" style="display:none"><div class="amount">' + (utils.COMMON.isIE && utils.COMMON.browserInfo.name === 'MSIE' ? '<img src="' + me.urls.img + 't.gif">' : '') + '<p>%%YOURREFUND%% <em><span class="symbol"></span><span class="refundAmount"></span></em></p></div><div class="tools"><a href="#" class="refresh">%%REFRESHCALCULATOR%%</a><a href="' + me.urls.fullCalc + '" class="more">%%FULLREFUNDCALCULATORLINK%%</a></div></div></div><div class="cl"></div>';
				
				me.i18n();
				
			// Contextual
			} else if (me.size.indexOf('contextual') > -1) {
				me.cssRef = utils.COMMON.loadCSS(me.urls.css + 'contextual.css');
				
				me.template = '<div class="context ' + (me.size.indexOf('lrg') > -1  ? 'contextLrg' : 'contextSml') + '" id="calc"><div class="form"><p>' + (me.size.indexOf('lrg') > -1  ? ((me.languageConfig !== 'zh' ? '%%PRICEIN%% ' : '') + '<span class="country"></span>' + (me.languageConfig === 'zh' ? ' %%PRICEIN%%' : '')) : '%%PRICE%%') + '</p><form name="refund"><fieldset><div class="select"><select name="jurisdictions"><option value="NONE"></option></select></div><div class="input"><span class="symbol"></span><input type="text" name="refundInput" class="refundInput" value="' + (me.configRefundAmount !== null ? me.configRefundAmount : '') + '" disabled="disabled"></div><input type="submit" class="submitBtn" name="submitRefund"></fieldset></form></div><div class="refund"><p><em><span class="symbol"></span><span class="refundAmount"></span></em>' + (me.size.indexOf('lrg') > -1  ? '%%GBTAXFREEPRICE%%' : '%%GBPRICE%%') + '</p></div>' + (me.size.indexOf('lrg') > -1  ? '<div class="tools"><a href="' + me.urls.fullCalc + '" class="more">%%FULLREFUNDCALCULATORLINK%%</a></div>' : '' ) + '</div><div class="cl"></div>';
				
				me.i18n();

			// MPU
			} else if (me.size.indexOf('mpu') > -1) {
				me.cssRef = utils.COMMON.loadCSS(me.urls.css + 'mpu.css');
			
				if (me.size === 'mpu-ext') {
					me.template = '<div class="mpu ext" id="calc"><div class="top"><h3>%%MPUEXTTITLE%%</h3></div>';

				// default to MPU Internal
				} else if (me.size === 'mpu-int') {
					me.template = '<div class="mpu int" id="calc"><div class="top"><h3>%%MPUINTTITLE%%</h3></div>';
				}
				
				me.template += '<div class="form"><form name="refund"><fieldset><div class="select"><select name="jurisdictions"><option value="NONE">%%SELECTCOUNTRY%%</option></select></div><div class="input"><span class="symbol"></span><input type="text" name="refundInput" value="%%REFUNDAMOUNT%%"></div><input type="submit" class="submitBtn" value="%%CALCULATEBUTTON%%" name="submitRefund" disabled></fieldset></form></div><div class="notification" style="display:none;"><div class="modal"></div><div class="message"><p></p><div class="close" tabindex="0"></div></div></div><div class="refund" style="display:none;"><p>%%YOURREFUND%% <em><span class="symbol"></span><span class="refundAmount"></span></em><br/><a href="' + me.urls.fullCalc + '" target="_NEW" style="display:none;">%%GOTOFULLCALC%%</a></p></div><div class="footer"><p><a href="' + me.urls.fullCalc + '" target="_NEW" >%%FULLREFUNDCALCULATORLINK%%</a></p><p><a href="' + me.urls.terms + '" target="_NEW">%%TERMSANDCONDITIONSLINK%%</a></p><div class="tools"><a href="' + me.urls.fullCalc + '" target="_NEW" class="fullCalc" title="%%FULLREFUNDCALCULATORLINK%%"><img src="' + me.iconUrl + '" width="26"></a><a href="#" class="refresh" title="%%REFRESHCALCULATOR%%"><img src="' + me.iconUrl + '" width="26"></a><a href="#" class="facebook social" title="%%SHAREFACEBOOK%%"><img src="' + me.iconUrl + '" width="26"></a><a href="#" class="twitter social" title="%%SHARETWITTER%%"><img src="' + me.iconUrl + '" width="26"></a><a href="#" class="vkontakte social" title="%%SHAREVKONTAKTE%%"><img src="' + me.iconUrl + '" width="26"></a><a href="#" class="qq social" title="%%SHAREQQ%%"><img src="' + me.iconUrl + '" width="26"></a><a href="#" class="weibo social" title="%%SHAREWEIBO%%"><img src="' + me.iconUrl + '" width="26"></a></div></div></div>';
				
				me.i18n();
			} 

		}
		
	};
	
	/**
	 * Method tasked with injecting the required template into the DOM, and setting up persistence for DOM Objects into this instances properties 
	 */
	this.injectTemplate = function() {
		var me = this;
		
		if (me.injectionPoint && me.template !== '') {
		
			me.injectionPoint.innerHTML = me.template;
		
			me.refundCalc = utils.XPATH.eval(".//*[@id='calc']", me.injectionPoint);
		
			me.refundCalc.className += ' ' + me.languageConfig;
	
			me.formContainer = utils.XPATH.eval(".//div[@class='form']", me.injectionPoint);
			me.refundForm = utils.XPATH.eval(".//form[@name='refund']", me.formContainer);
			me.refundAmount = utils.XPATH.eval(".//div[contains(@class, 'refund')]", me.injectionPoint);
			
			me.showFullCalc = utils.XPATH.eval(".//a", me.refundAmount);
		
			me.selectJurisdictions = utils.XPATH.eval(".//select[@name='jurisdictions']", me.formContainer);
			me.refundInput = utils.XPATH.eval(".//input[@name='refundInput']", me.formContainer);

			me.refundInput.onfocus = function() {
				if (this.value === me.language.text.REFUNDAMOUNT) {
					if (me.size.indexOf('mpu') > -1) {
						this.style.paddingLeft = '35px';
						this.style.width = '135px';
					}
					this.value = '';
				}
			}
			me.refundInput.onblur = function() {
				if (this.value === '') {
					if (me.size.indexOf('mpu') > -1) {
						this.style.paddingLeft = '';
						this.style.width = '';
					}
					this.value = me.language.text.REFUNDAMOUNT;
				}
			}
			
			me.submitRefund = utils.XPATH.eval(".//input[@name='submitRefund']", me.formContainer);

			if (me.size.indexOf('mpu') > -1 || me.size === 'express' || me.size.indexOf('contextual-lrg') > -1) {
				me.tools = utils.XPATH.eval(".//div[@class='tools']", me.injectionPoint);
		
				me.socialTools = utils.XPATH.eval(".//a[contains(@class, 'social')]", me.tools, true); // returns array or DOM objects
		
				me.showSocialNetworks();
		
				me.refreshButton = utils.XPATH.eval(".//a[@class='refresh']", me.tools);
				me.fullCalcButton = utils.XPATH.eval(".//a[@class='fullCalc']", me.tools);
			}

			if (me.size.indexOf('mpu') > -1) {
				me.refreshButton.style.display = 'none';
			}

			if (me.refreshButton !== null && typeof me.refreshButton !== 'undefined') {
				me.refreshButton.onclick = function(e) {
					me.resetForm(false, false);
					if (me.size.indexOf('mpu') > -1) {
						me.formContainer.style.display = '';
						me.refundAmount.style.display = 'none';
			
						me.refreshButton.style.display = 'none';
						me.fullCalcButton.style.display = '';
					} else if (me.size.indexOf('express') > -1) {
						me.formContainer.style.display = '';
						me.refundAmount.style.display = 'none';
					}
					me.refundInput.value = '';
			
					// resetting refund
					me.refundSum = 0;
			
					return false;
				}
			}
		
			me.currencySymbolAreas = utils.XPATH.eval(".//*[contains(@class,'symbol')]", me.injectionPoint, true); // returns array or DOM objects
		
			me.notificationArea = utils.XPATH.eval(".//*[@class='notification']", me.injectionPoint);
			
			me.countryNameArea = utils.XPATH.eval(".//*[@class='country']", me.injectionPoint);
			
			if (me.size.indexOf('page') > -1) {
				me.refundStackTable = utils.XPATH.eval(".//table[@class='stack']", me.injectionPoint);
				me.refundStackTableTotal = utils.XPATH.eval(".//table[@class='total']", me.injectionPoint);
				me.refundStackTotalAmount = utils.XPATH.eval(".//td[@class='amount']", me.refundStackTableTotal);
				me.refundStackTotalRefund = utils.XPATH.eval(".//td[contains(@class,'refund')]", me.refundStackTableTotal);
				me.appendRefundBtn = utils.XPATH.eval(".//a[@class='appendRefund']", me.injectionPoint);
			}
			
			me.refundAmountArea = utils.XPATH.eval(".//span[@class='refundAmount']", me.refundAmount);
			if (me.appendRefundBtn) {
				me.appendRefundBtn.onclick = function() {
					if (this.firstChild.className.indexOf('disabled') === -1) {
						me.createRefund({
							input: me.refundInput.value,
							refund: me.refundAmountArea.innerHTML,
							currencyCode: me.currencySymbol
						});
					
						me.resetForm();
					}
					return false;
				}
			}
		}
		
		if (me.refundCalc) {
			// Apply class for facebook skinning
			if (me.configFacebookSkin) {
				me.injectionPoint.className += ' facebook';
			}
			if (me.size === 'contextual-lrg') {
				me.countryNameArea.innerHTML = me.language.jurisdictions[me.configJurisdiction];
			}
			
			utils.COMMON.browserSupport(me);
			me.buildCalculator();
		}
	};
	
	/**
	 * Used to replace text placeholders in the defined template with the correct internationalised text
	 */
	this.i18n = function() {
		var me = this;
		
		// If the language property is null, download the language required to display the calculator
		// Default language ENG, Otherwise selected from the lang attribute on the injection point div
		// Also can be selected by URL search string if lang attribute is unavailable in the form ?lang=en
		if (me.language !== null) {
			var i;
			for (i in me.language.text) {
				if (me.language.text.hasOwnProperty(i)) {
					// Make sure all instances of a specific marker are localised
					me.template = me.template.replace(new RegExp('%%' + i + '%%', 'g'), me.language.text[i]);
				}
			}
			
			me.injectTemplate();
		} else {	
			utils.JSON.get({
				scope: me,
				url: me.urls.json + 'i18n/' + me.languageConfig + '.json',
			    callback: function(response) { 
					var me = this;
					me.language = response;
					me.i18n();
			    },
			    errorCallback: function(response) { 
					var me = this;
					// handle errors?
					//me.refundCalc.style.display = 'none';
			    }
			});
		}
	};
	
	/**
	 * Function to notify the user via stylised message
	 *
	 * @param {String}	message	The message to display to the user
	 */
	this.notify = function(message) {
		var me = this;
		
		var messageArea = utils.XPATH.eval(".//p", me.notificationArea);
		var closeButton = utils.XPATH.eval(".//div[@class='close']", me.notificationArea);
		
		messageArea.innerHTML = message;
		
		closeButton.onmousedown = closeButton.onkeydown = function() {
			me.notificationArea.style.display = 'none';
			if (utils.COMMON.isIE && utils.COMMON.browserInfo.version === 6.0) {
				me.formContainer.style.display = '';
			}
		};
		
		me.notificationArea.style.display = '';
		
		closeButton.focus();
		
		if (utils.COMMON.isIE && utils.COMMON.browserInfo.version === 6.0) {
			me.formContainer.style.display = 'none';
		}
	};
	
	/**
	 * Updates all of the currency symbol areas used around the unit
	 *
	 * @param {String}	[symbol]	The currency symbol required
	 */
	this.updateCurrencySymbols = function(symbol) {
		var me = this;
		
		me.currencySymbol = typeof symbol !== 'undefined' ? symbol : '';
		
		var i, ii = me.currencySymbolAreas.length;
		for(i = 0; i < ii; i++) {
			me.currencySymbolAreas[i].innerHTML = me.currencySymbol;
		}
	};
	
	/**
	 * Method to validate the user input to ensure only numbers are used
	 */
	this.validateInput = function() {
		var me = this;
		
		var selectedJurisdiction = me.selectJurisdictions.options[me.selectJurisdictions.selectedIndex].value;
		
		if (selectedJurisdiction !== 'NONE') {
		
			var input = me.refundInput.value;
		
			// Check if the minimum amount has been entered, if not, warn the user again
			var jurisdictionMinAmount = me.jurisdictions[selectedJurisdiction].minimumSalesAmount;	
		
			// Ensure the input is only numbers
			if (!/^[0-9.]+$/.test(input)) {
				me.notify(me.language.messages.invalidInput);

				me.resetForm(false, false);
			
				return false;
			} else if (jurisdictionMinAmount > input) {
				me.notify(me.minSalesWarning());

				me.resetForm(false, false);
			
				return false;
			} 
			
			if (me.size.indexOf('page') > -1){
				me.appendRefundBtn.firstChild.className = '';
			}
			
			return true;
		} else {
			me.notify(me.language.messages.invalidJurisdiction);

			me.resetForm(false, false);
		
			return false;
		}
	};
	
	/**
	 * Method to display the refund to the user
	 *
	 * @param {String}	refundText	The refund amount
	 */
	this.displayRefund = function(refundText) {
		var me = this;
		
		me.refundAmountArea.innerHTML = refundText.toFixed(2);
		
		if (me.size.indexOf('contextual') === -1 && me.size.indexOf('page') === -1) {
			me.formContainer.style.display = 'none';
			me.refundAmount.style.display = '';
		}
		
		if (me.size.indexOf('mpu') > -1) {
			me.mpuRefundCount++;
		
			if (me.mpuRefundCount < 3) {
				me.fullCalcButton.style.display = 'none';
				me.refreshButton.style.display = '';
			} else {
				me.showFullCalc.style.display = '';
				if (utils.COMMON.isIE && utils.COMMON.browserInfo.version < 8.0) {
					me.showFullCalc.parentNode.className = 'ieCentralise';
				}
			}
		}
	};
	
	/**
	 * Displays the correct social networks for the language configured
	 */
	this.showSocialNetworks = function() {
		var me = this;
		
		if (me.size.indexOf('mpu') > -1) {
			var socialNetworks = me.language.socialNetworks;		
			var i, ii = me.socialTools.length;
			for (i = 0; i < ii; i++) {
				var socialTool = me.socialTools[i];
				var socialNetwork = socialTool.className.substring(0, socialTool.className.indexOf(' '));
			
				if (utils.ARRAYS.indexOf(socialNetworks, socialNetwork) === -1) {
					socialTool.style.display = 'none';
				} else {
					me.socialShareFunction(socialTool, socialNetwork);
				}
			}
		}
	};
	
	/**
	 * Method to allow the users to share their experience with the appropriate social network of their choice
	 *
	 * @param {DOMObject}	socialTool	The social network DOM tool used by the user
	 * @param {String}	socialNetwork	The social network to send this share notification to
	 */
	this.socialShareFunction = function(socialTool, socialNetwork) {
		var me = this;
		
		socialTool.onclick = function() {
			var title = me.language.socialShareText.title;
			var description = me.language.socialShareText.descriptionBeforeCalc;
			var refund = me.refundCalculated();
			
			var socialShareLink = me.socialShareLinks[socialNetwork];
			
			if (refund !== null) {
				description = me.language.socialShareText.descriptionAfterCalc.replace('%%CURRENCYSYMBOL%%',refund.currencySymbol).replace('%%REFUNDAMOUNT%%', encodeURIComponent(refund.amount.toFixed(2)));
			}

			socialShareLink = socialShareLink.replace('%%TITLE%%', encodeURIComponent(title)).replace('%%DESCRIPTION%%', encodeURIComponent(description));
			
			var windowSize = socialNetwork === 'facebook' ? 'height=500,width=1000' : 'height=350,width=500';
			
			window.open(socialShareLink, 'GBShare', windowSize, true)
			return false;
		}
	};
	
	/**
	 * Method to create a simple object to build a refund amount for social share functions
	 */
	this.refundCalculated = function() {
		var me = this;
		
		if (me.refundSum > 0) {
			return {
				amount: me.refundSum,
				currencySymbol: me.currencySymbols[me.jurisdictions[me.selectJurisdictions[me.selectJurisdictions.selectedIndex].value].currencyCode]
			};
		}
		
		return null;
	};
	
	/**
	 * Method to inform the user of a minimum sales amount
	 */
	this.minSalesWarning = function() {
		var me = this;
		
		var jurisdictions = me.jurisdictions;
		
		var code = me.selectJurisdictions.options[me.selectJurisdictions.selectedIndex].value;
		
		var minSalesAmount = jurisdictions[code].minimumSalesAmount;
		
		return me.language.messages.minimumSalesWarning.replace('%%CURRENCY_SYMBOL%%',me.currencySymbols[jurisdictions[code].currencyCode]).replace('%%CURRENCY_MINIMUM%%',minSalesAmount);
	};
	
	/**
	 * Method of adding jurisdiction options to the jurisdictions list
	 */
	this.addJurisdictionOption = function(value, name) {
		var me = this;
		
		var option = document.createElement('option');
		option.value = value;
		option.appendChild(document.createTextNode(name));
		
		me.selectJurisdictions.appendChild(option);
		
		if (value === me.configJurisdiction) {
			option.selected = true;
			me.selectJurisdictions.onchange();
		}
	};
	
	/**
	 * Method to actually build the calculator with all of the required Jurisdictions defined in jurisdictions.json
	 * Persists the JSON as to not re-request it for this instance.
	 */
	this.buildCalculator = function() {
		var me = this;
		
		// Check cache; if the jurisdictions object is already loaded, display the form, otherwise grab the jurisdictions and reload this function
		if (me.jurisdictions !== null) {
			var jurisdictions = me.jurisdictions;
			var code = null;

			me.selectJurisdictions.onchange = function() {	
				code = this.options[this.selectedIndex].value;
			
				me.resetForm(true, false);
			
				if (code !== 'NONE') {
					me.submitRefund.disabled = false;
				
					me.updateCurrencySymbols(me.currencySymbols[me.jurisdictions[code].currencyCode]);
				} else {
					me.resetForm(true, true);
					me.submitRefund.disabled = true;
				}
			};
			
			// Set all the selection options from all available jurisdictions
			for (i in jurisdictions) {
				if (jurisdictions.hasOwnProperty(i)) {
					me.addJurisdictionOption(i, me.language.jurisdictions[i]);
				}
			}
			
			//if (me.size !== 'page') {
				if (me.size.indexOf('contextual') === -1) {
					me.submitRefund.onclick = function(e) {
						utils.EVT.handle(e);
						me.submitForm(code);
					};
				
					me.refundForm.onsubmit = function(e) {
						utils.EVT.handle(e);
						me.submitForm(code);
					};
				}
			//}
			
			if (me.size.indexOf('contextual') > -1) {
				me.submitForm(me.configJurisdiction);
			}
			
		} else {
			utils.JSON.get({
				scope: me,
				url: me.urls.json + 'jurisdictions.json',
			    callback: function(response) {
					var me = this;
					me.jurisdictions = response.jurisdictions;
					me.currencySymbols = response.currencySymbols;
					me.buildCalculator();
			    },
			    errorCallback: function(response) { 
					var me = this;
					// handle errors?
			    }
			});
		}
	};
	
	/**
	 * Method to grab the jurisdiction based on what the user has selected
	 */
	this.countryFormFunction = function(code) {
		var me = this;
		
		if (code !== null) {	
			me.getJurisdiction(code);
		}
	};
	
	/**
	 * Method to validate the user input and select the country for the user
	 */
	this.submitForm = function(code) {
		var me = this;
		
		if (me.validateInput()) {
			me.countryFormFunction(code);
		}
	};
	
	/**
	 * Function to reset the calculator refund and input fields 
	 *
	 * @param {Boolean} clearTotal	Used to decide whether the totals should be reset
	 */
	this.resetForm = function(clearTotal, resetSelector) {
		var me = this;
		if (me.size.indexOf('contextual') === -1) {		
			if (me.size === 'page' && (clearTotal || typeof clearTotal === 'undefined')) {
				me.refundAmountArea.innerHTML = '0.00';
				me.appendRefundBtn.firstChild.className = 'disabled';
			
				// If there are any stacked refunds, reset the stack
				if (me.refundStack.length > 0 && clearTotal) {
					me.resetRefundStack();
				}
			}
			me.refundInput.value = me.language.text.REFUNDAMOUNT;
			if (resetSelector) {
				me.selectJurisdictions.selectedIndex = 0;
				me.updateCurrencySymbols();
			} 
		}
	};
	
	/**
	 * Method to quickly and efficiently remove all stacked refunds
	 */
	this.resetRefundStack = function() {
		var me = this;
		
		// reset stack
		me.refundStack = [];
		
		// Create new refund stack table from template
		var tmp = document.createElement('div');
		tmp.innerHTML = me.refundStackTableTemplate;
		tmp = tmp.firstChild;
		
		// remove existing refund stack table
		me.refundStackTable.parentNode.removeChild(me.refundStackTable);
		
		// append new refund stack table
		me.refundStackTableTotal.parentNode.insertBefore(tmp, me.refundStackTableTotal)
		
		// Ensure the new table is persisted
		me.refundStackTable = utils.XPATH.eval(".//table[@class='stack']", me.injectionPoint);
		
		// reset totals
		me.amountSum = me.refundSum = 0;
		me.refundStackTotalAmount.innerHTML = me.refundStackTotalRefund.innerHTML = '0.00';
	};
	
	/**
	 * Method to grab the refund rules for the selected Jurisdiction.
	 * Embedded persistance as to not re-request already collected refund rules
	 *
	 * @param {String} code 	The Jurisdiction code
	 */
	this.getJurisdiction = function(code) {
		var me = this;
		
		// Check cache; if the data for this jurisdiction does not exist, grab it then reload this function
		if (typeof me.jurisdictions[code].data === 'object') { // Checking for object type safer than checking for undefined
			
			// Calculate saving when user submits the form		
			var input = me.refundInput.value;
			
			me.calculateSaving(parseFloat(input), code);

		} else {
			utils.JSON.get({
				scope: me,
				url: me.urls.json + code + '.json',
			    callback: function(response) {
					var me = this;
					me.jurisdictions[code].data = response;
					me.getJurisdiction(code);
				},
				errorCallback: function(response) {
					var me = this;
					// handle error?
				}
			});
		}
	};
	
	/**
	 * Method to calculate the users saving based on their input and the selected jurisdiction 
	 *
	 * @param {Number} input 			The users input to calculate the saving from
	 * @param {String} jurisdictionCode	The jurisdiction code identifier to retrieve the refund data
	 */
	this.calculateSaving = function(input, jurisdictionCode) {
		var me = this;
		
		var refund = 0;
		
		var jurisdictions = me.jurisdictions;
		var refundObj = jurisdictions[jurisdictionCode].data;
		
		var curSaving = null, prevSaving = null, refundRule = null, refund = null;
		var refundRules = refundObj.refundRules;
		var rounding = refundObj.rounding; // rounding rule only uzed for percentages
	
	
		// TODO: this isnt selecting the correct refund rule for some reason
		var i, ii = refundRules.length;
		for (i = 0; i < ii; i++) {
			prevSaving = curSaving;
			curSaving = refundRules[i];
			if(prevSaving !== null) {
				if (prevSaving.amount <= input && input <= curSaving.amount) {
					break;
				}
			}
		}
		
		// If input is larger than the last refund rule encountered, its likely all refund rules have been tested; therefore use the last tested rule, otherwise use the previous tested rule.
		if (input < curSaving.amount) {
			refundRule = prevSaving;
		} else {
			refundRule = curSaving
		}
		
		if (typeof refundRule.percent !== 'object') {
			refund = refundRule.refund;
		} else {
			var base = refundRule.percent.base; // either 'gross' (total amount), 'net' (amount before vat), 'vat' (the vat only); to which the percentage within the percent object is calculated from
			var calcRate = refundRule.percent.rate;
			
			if (base === 'gross') {
				refund = (input / 100) * calcRate;
			} else if (base === 'net') {
				refund = (((input / (100 + refundObj.rate)) * 100) / 100) * calcRate;
			} else if (base === 'vat') {
				refund = (((input / (100 + refundObj.rate)) * refundObj.rate) / 100) * calcRate;
			}
			
			if (refundRule.percent.round === 'true') {
				if (refundObj.rounding === 'half_up' || refundObj.rounding === 'up') { // round up to nearest half / whole number
					refund = Math.ceil(refund) + (refundObj.rounding === 'up' ? 0 : ((refund % 1) > 0.5 ? 0 : -0.5));
				} else if (refundObj.rounding === 'half_down' || refundObj.rounding === 'down') {
					refund = Math.floor(refund) + (refundObj.rounding === 'down' ? 0 : ((refund % 1) < 0.5 ? 0 : 0.5));
				}
			}
			
			if (typeof refundRule.percent.reduction === 'number') {
				refund = refund - refundRule.percent.reduction;
			}
		}
		// TODO: Need to do this due to share functions and the usage of me.refundSum when on page calculator; is there a better way?
		if (me.size !== 'page') {
			me.refundSum = refund;
		}
		me.displayRefund(refund);
	};
	
	/**
	 * Method of calculating the total saving when using the stacked saving function (used on full page calculator)
	 *
	 * @param {Number}	refund	The refund calculated
	 * @param {Boolean}	add	Boolean to decide whether this is an addition or subtraction
	 */
	this.calculateStackedSaving = function(refund, add) {
		var me = this;
		if (add) {
			me.refundSum = me.refundSum + refund.refund;
			me.amountSum = me.amountSum + refund.input;
		} else {
			me.refundSum = me.refundSum - refund.refund;
			me.amountSum = me.amountSum - refund.input;
		}
		
		me.refundStackTotalAmount.innerHTML = me.amountSum.toFixed(2);
		me.refundStackTotalRefund.innerHTML = me.refundSum.toFixed(2);
	};
	
	/**
	 * Method for creating a refund from a page calculator
	 *
	 * @param {Object}	refundObject	The refund calcuted, containing
	 *   @config {Number}	input	The amount input by the user
	 *   @config {Number}	refund	The refund calculated from the input
	 *   @config {String}	currencyCode	The currency symbol used for this refund
	 */
	this.createRefund = function(refundObject) {
		var me = this;
		
		me.calculateStackedSaving(new CalcStackRefund(refundObject, me), true);
		
		// Only unhide the refund stack table on the first refund
		if (me.refundStack.length === 1) {
			me.refundStackTable.style.display = '';
		}
		
		me.resetForm(false, false);
	};
	
	// Initialise this instance
	this.initialise();
};


// Unobtrusive loading function
/*window.onload = function() {
	window.calc = new globalBlueRefundCalc()
	calc.initialise();
};
*/