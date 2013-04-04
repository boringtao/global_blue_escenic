Raphael.fn.drawGrid = function (x, y, w, h, wv, hv, color) {
    color = color || "#000";
    var path = ["M", Math.round(x) + .5, Math.round(y) + .5, "L", Math.round(x + w) + .5, Math.round(y) + .5, Math.round(x + w) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y) + .5],
        rowHeight = h / hv,
        columnWidth = w / wv;
    for (var i = 1; i < hv; i++) {
        path = path.concat(["M", Math.round(x) + .5, Math.round(y + i * rowHeight) + .5, "H", Math.round(x + w) + .5]);
    }
    for (i = 1; i < wv; i++) {
        path = path.concat(["M", Math.round(x + i * columnWidth) + .5, Math.round(y) + .5, "V", Math.round(y + h) + .5]);
    }
    return this.path(path.join(",")).attr({stroke: color});
};

$(function () {
    $("#data").css({
        position: "absolute",
        left: "-9999em",
        top: "-9999em"
    });
});

window.onload = function () {
    function getAnchors(p1x, p1y, p2x, p2y, p3x, p3y) {
        var l1 = (p2x - p1x) / 2,
            l2 = (p3x - p2x) / 2,
            a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
            b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
        a = p1y < p2y ? Math.PI - a : a;
        b = p3y < p2y ? Math.PI - b : b;
        var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2,
            dx1 = l1 * Math.sin(alpha + a),
            dy1 = l1 * Math.cos(alpha + a),
            dx2 = l2 * Math.sin(alpha + b),
            dy2 = l2 * Math.cos(alpha + b);
        return {
            x1: p2x - dx1,
            y1: p2y + dy1,
            x2: p2x + dx2,
            y2: p2y + dy2
        };
    }

    // Grab the data
    var labels = [],
        data = [],
		hozData = [],
		urlKeys = [],
		urlPattern = 'http://www.global -blue.com/traveller-services/',
		taxFreePattern = 'tax-free-shopping/regulations-in-',
		countryList = {};

    // Grab the data

//function getAnchors() {
    $.ajax({
        type: "GET",
        url: "js/mapdata.xml",
        async: false,
        dataType: "xml",
        success: function(xml) {
			var l18n = (utils.URL.searchObjectify !== null && typeof utils.URL.searchObjectify['ServerVariable'] !== 'undefined') ? utils.URL.searchObjectify['ServerVariable'] : null;
            var countryList = {};
			
			var mapLocalisation = $(xml).find('Map > Localisation');
			$('.module h4').text($(mapLocalisation).find('MapTitle ' + (l18n !== null ? '> ' + l18n + ' ': '') + '> Name').text());
			$('#MapDropDown option:eq(0)').text($(mapLocalisation).find('CountrySelect ' + (l18n !== null ? '> ' + l18n + ' ': '') + '> Name').text());
			$('#countryKey').text($(mapLocalisation).find('DestinationsKey ' + (l18n !== null ? '> ' + l18n + ' ': '') + '> Name').text());
			
            $(xml).find('Map > MapLocations > Country').each(function(){
				var excludedCountries = {};
                var Name = $(this).find((l18n !== null ? l18n + ' ': '') + '> Name').text();
                var countryObject = {};
                $(this).find('Coordinates').each(function(){
                    countryObject.x = $(this).find('x').text();
                    countryObject.y = $(this).find('y').text();
                });
				
                $(this).find('Excluded > Exclude').each(function(i){
                        excludedCountries[$(this).text()] = $(this).text();
                });
                countryObject.excluded = jQuery.extend(true, {}, excludedCountries);
                countryObject.eu = $(this).find('eu').text();
                countryObject.urlKey = $(this).find((l18n !== null ? l18n + ' ': '') + '> url').text();
                countryObject.onMap = $(this).find('onMap').text();

                // Change LanguageVariable to a server side variable
                var LanguageVariable = 'ServerVariable';
                if(LanguageVariable=='Chinese') {
                    $(this).find('Chinese').each(function(){
                        if($(this).find('Name').text()!=''){
                            Name = $(this).find('Name').text();
                        }
                        if($(this).find('url').text()!=''){
                            countryObject.urlKey = $(this).find('url').text();
                        } else {
                            countryObject.urlKey == ''
                        }
                    });
                }
                if(LanguageVariable=='Russian') {
                    $(this).find('Russian').each(function(){
                        if($(this).find('Name').text()!=''){
                            Name = $(this).find('Name').text();
                        }
                        if($(this).find('url').text()!=''){
                            countryObject.urlKey = $(this).find('url').text();
                        } else {
                            countryObject.urlKey == ''
                        }
                    });
                }
                countryList[Name] = jQuery.extend(true, {}, countryObject);
            });

    jQuery.each(countryList, function(index, val) {

      if(val.onMap==='true'){
          hozData.push(val.x);
          data.push(val.y);
          labels.push(index);
          urlKeys.push(val.urlKey);
      }
    });

    // Draw
    var width = 1700,
        height = 618,
        viewWidth = 635,
        viewHeight = 231,
        zoomScale = 2.6771653543307086614173228346457;
        leftgutter = 0,
        bottomgutter = 0,
        topgutter = 0,
        colorhue = .6 || Math.random(),
        color = "hsl(" + [colorhue, .5, .5] + ")",
        r = Raphael("canvas", viewWidth, viewHeight),
        txt = {font: '12px Helvetica, Arial', fill: "#fff"},
        txt1 = {font: '10px Helvetica, Arial', fill: "#fff"},
        txt2 = {font: '12px Helvetica, Arial', fill: "#000"},
		txt3 = {font: '5px Helvetica, Arial', fill: "#fff", "line-height": '5px'},
        isScaled = false,
        scaleVal = 1,
		xMax = Math.max.apply(Math, hozData),
        //X = (width - leftgutter) / labels.length,
       	X = (width - leftgutter) / xMax,
		max = Math.max.apply(Math, data),
        Y = (height - bottomgutter - topgutter) / max;
		var countryArray = Array(), labelArray = Array();
		r.image("img/map_full_size.png", 0, 0, viewWidth, viewHeight);

	var paper = r, viewBoxWidth = paper.width, viewBoxHeight = paper.height, zoomed=false;

	$('#zoomIn').click(function() {
		if(zoomed==false){
			MapManager.setZoom(zoomScale);
			zoomed=true;
		}
	});
   $('#zoomOut').click(function() {
		MapManager.resetPosition();
		zoomed=false;
	});

			$('a').click(function() {

        		this.blur();
        	});

			$.each(countryList, function(index, value) {
				/*$("#map").append('<div class="more" id="'+index+'"><a href="'+urlPattern+index.toLowerCase().replace('_','-')+'/"><img src="img/map_bullet_small_on.png"/></a><span>'+index.replace('_',' ')+'</span></div>');*/
				$("#MapDropDown").append('<option value="'+index+'">'+index+'</option>');
			});

			$('#MapDropDown').change(function() {
				var selected = $(this).val();
				hozData = [], data = [], labels = [];
				if(selected!=0){
					$.each(countryList, function(index, value) {
						if(selected===index){
							if(value.eu==='true'){
								jQuery.each(countryList, function(key, val) {
									if(val.eu==='false'&&val.onMap==='true'&&(value.excluded.hasOwnProperty( key ) === false)){
                                        hozData.push(val.x);
										data.push(val.y);
										labels.push(key);
										urlKeys.push(val.urlKey);
									}
								});
							} else {
								jQuery.each(countryList, function(key, val) {
									if(selected!=key&&val.onMap==='true'&&(value.excluded.hasOwnProperty( key ) === false)){
										hozData.push(val.x);
										data.push(val.y);
										labels.push(key);
										urlKeys.push(val.urlKey);
									}
								});
							}
						}
					});
                    if(zoomed==true&&Raphael.vml){
					    MapManager.resetPosition();
                        zoomed=false;
                        r.image("img/map_full_size.png", 0, 0, width, height);
					}
					r.image("img/map_full_size.png", 0, 0, viewWidth, viewHeight);
					drawMap();
					//MapManager.renewCanvas();
				}
			});
			jQuery.fn.animateAuto = function(prop, speed, callback){
				var elem, height, width;
				return this.each(function(i, el){
					el = jQuery(el), elSpan = jQuery(el).children('span'), 
					elem = elSpan.clone().css({"height":"auto","width":"auto"}).appendTo("body");
					height = elem.css("height"),
					width = parseFloat(elem.css("width")) + 3,
					elWidth = parseFloat(width) + 30,
					elem.remove();
					
					if(prop === "height")
						elSpan.animate({"height":height}, speed, callback);
					else if(prop === "width") {
						elSpan.animate({"width":width}, speed, callback);
						el.animate({"width":elWidth}, speed, callback);  
					}
					else if(prop === "both")
						elSpan.animate({"width":width,"height":height}, speed, callback);
				});  
			}			
			
			//Expand more info button on hover
			$(".more").hover(function(e){
				$(this).stop().animateAuto("width", 200).css({'z-index' : '10'}); //Change the width increase caption size
			}, function () {
				$(this).stop().animate({width: '15px','z-index' : '1'}, 200);
      		});
			
			
jQuery.fn.animateViewBox = function(currentViewBox, viewX, viewY, width, height, duration, callback) {
	
    duration = duration || 250;

    var originals = currentViewBox, //current viewBox Data from where the animation should start
        differences = {
                x: viewX - originals.x,
                y: viewY - originals.y,
                width: width - originals.width,
                height: height - originals.height
        },
        delay = 13,
        stepsNum = Math.ceil(duration / delay),
        stepped = {
                x: differences.x / stepsNum,
                y: differences.y / stepsNum,
                width: differences.width / stepsNum,
                height: differences.height / stepsNum
        }, i,
        canvas = this;

    /**
     * Using a lambda to protect a variable with its own scope.
     * Otherwise, the variable would be incremented inside the loop, but its
     * final value would be read at run time in the future.
     */
    function timerFn(iterator) {
            return function() {
                    canvas.setViewBox(
                            originals.x + (stepped.x * iterator),
                            originals.y + (stepped.y * iterator),
                            originals.width + (stepped.width * iterator),
                            originals.height + (stepped.height * iterator)
                    );
                    // Run the callback as soon as possible, in sync with the last step
                    if(iterator == stepsNum && callback) {
                            callback(viewX, viewY, width, height);
                    }
            }
    }

    // Schedule each animation step in to the future
    // Todo: use some nice easing
    for(i = 1; i <= stepsNum; ++i) {
            setTimeout(timerFn(i), i * delay);
    }
}			

// Safely (and lazily) use console.*
if (!window.console) {
	(function() {
		var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
		"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
		window.console = {};
		for (var i = 0; i < names.length; ++i) {
			window.console[names[i]] = function() {};
		}
	}());
}

// Request animation frame
/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
if ( !window.requestAnimationFrame ) {
	window.requestAnimationFrame = ( function() {
		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
			return window.setTimeout( callback, 1000 / 60 );
		};
	} )();

}

if( !window.cancelAnimationFrame ){
	window.cancelAnimationFrame = ( function() {
		return window.webkitCancelRequestAnimationFrame ||
		window.mozCancelRequestAnimationFrame    ||
		window.oCancelRequestAnimationFrame      ||
		window.msCancelRequestAnimationFrame     ||
		clearTimeout
	})();
}

(function(RFN) {

	function addToQueue(canvas, stepFunction, duration, callback) {
		var queue = findQueue(canvas),
			startTime = +new Date(),
			endTime = startTime + duration,
			runID = ++addToQueue.runID;

		function startAnimation() {
			function animate() {
				var now = +new Date(),
					elapsed = now - startTime,
					completeness = now >= endTime ? 1 : (elapsed / duration);

				stepFunction(completeness);

				if(now >= endTime) {
					completeQueueItem(runID, queue, callback);
					return cancelAnimationFrame(animate);
				}
				return requestAnimationFrame(animate, canvas);
			}
			return animate();
		}

		queue.push(startAnimation);

		manageQueue(queue);

	}
	addToQueue.runID = 0;

	function manageQueue(queue) {
		var current = queue[0];
		if(!current) {
			return;
		}
		if(!current.runID) {
			current.runID = current();
		}
	}

	function findQueue(canvas) {
		if(!canvas.queueID) {
			canvas.queueID = Raphael.createUUID();
		}
		var queueObj = animateViewBox.stat.queue;
		if(!queueObj[canvas.queueID]) {
			queueObj[canvas.queueID] = [];
		}
		return queueObj[canvas.queueID];
	}

	function completeQueueItem(runID, queue, callback) {
		var currentItem = queue.shift();

		if(currentItem) {
			if(callback) {
				callback();
			}
			manageQueue(queue);
		}
	}

	var animateViewBox = function(viewX, viewY, width, height, duration, callback) {

		duration = duration || 250;

		var originals = MapManager.getViewBox(),
			differences = {
				x: viewX - originals.x,
				y: viewY - originals.y,
				width: width - originals.width,
				height: height - originals.height
			},
			stepped = {
				x: differences.x,
				y: differences.y,
				width: differences.width,
				height: differences.height
			}, i = 1,
			canvas = this;

		addToQueue(canvas, function(completeness) {
			canvas.setViewBox(
				originals.x + (stepped.x * completeness),
				originals.y + (stepped.y * completeness),
				originals.width + (stepped.width * completeness),
				originals.height + (stepped.height * completeness)
			);
		}, duration, function() {
			if(callback) {
				callback(viewX, viewY, width, height);
			}
		});

	}

	// Todo, set queues up and append operations behind so that animations do not overlap
	animateViewBox.stat = {
		queue: {}
	}

	RFN.animateViewBox = animateViewBox;

}(Raphael.fn));
var MapManager = (new function() {
	var charts,
		activeChart,
		activeChartBackupData,
		svgElement,
		canvasOffset, canvasBounds,
		canvas = $(document.getElementById('canvas')),
		dimensions = {
			width: canvas.width(),
			height: canvas.height()
		},
		canvasDimensions = {
			width: dimensions.width,
			height: dimensions.height
		},
		scale = 1.0,
		minimumScale = 0.1,
		view = {
			x: 0,
			y: 0
		},		
		initialView = {
			x: 0,
			y: 0
		},
		flatIndex = {},
		inst,
		blockedCall,
		isVML = Raphael.vml,
		supportsRichEffects = Raphael.svg;
	svgElement = paper;
	//Raphael(canvas[0], dimensions.width, dimensions.height);

	canvasOffset = canvas.offset();
	canvasBounds = {
		x: [canvasOffset.left, canvasOffset.left + canvas.outerWidth()],
		y: [canvasOffset.top, canvasOffset.top + canvas.outerHeight()]
	};

	function updateViewBoxAttributes(x, y, width, height) {
		view.x = x;
		view.y = y;
		dimensions.width = width;
		dimensions.height = height;
		scale = canvasDimensions.width / width;
	}

	return (inst = {
		svgElement: svgElement,
		init: function(userCharts, chart) {
			var call = function() {
				charts = userCharts;
				inst.load(chart);
			}
			if(!blockedCall && !MapManager.blockInit) {
				call();
			}
			else if(blockedCall && MapManager.blockInit === false) {
				blockedCall.call(this);
			}
			else if(MapManager.blockInit === true) {
				blockedCall = call;
			}
		},
		setZoom: function(strength, settings)    {

			scale = Math.min(Math.max(scale * strength, minimumScale), zoomScale);
			var viewBox = svgElement.canvas,
				width = 1700,
				height = 618,
				centre = [dimensions.width / 2, dimensions.height / 5],
				newCentre;
				settings = settings || { animate: true };
				var newWidth = parseInt(canvasDimensions.width / scale),
					newHeight = parseInt(canvasDimensions.height / scale);

				newCentre = [newWidth / 2, newHeight / 2];

				var newX = view.x + centre[0] - newCentre[0],
					newY = view.y + centre[1] - newCentre[1];

				if(supportsRichEffects && settings.animate) {
					svgElement.animateViewBox(newX, newY, newWidth, newHeight, 500, updateViewBoxAttributes);
				}
				else {
					//This line needed for IE6-8 to allow reset to work correctly.
					MapManager.resetPosition();
					svgElement.setViewBox(newX, newY, newWidth, newHeight);
					updateViewBoxAttributes(newX, newY, newWidth, newHeight);
				}
				jQuery.each(countryArray, function(index, val) {				
					val.attr("r", 2);
					//var frame = r.popup(10, 147, val, "right").attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .7}).hide();
				});
				var counter = 0;
				jQuery.each(labelArray, function(index, val) {


					//console.log(val.getBBox().height = 10);
					//console.log(hozData[counter] + ' ' + data[counter]);
					//var frame = r.popup(hozData[counter], data[counter], val, "right").attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .7}).hide();
					//val.getBBox().height = val.getBBox().height / 2;
					//val.getBBox().width = val.getBBox().width / 2;
					//var side = "right";
				    //ppp = r.popup(val.getBBox().x, val.getBBox().y, val, side, 1, true);
					//val.getBBox().width = val.getBBox().width / 2;
					//val.getBBox().height = val.getBBox().height / 2;
					//val.node.clientHeight = 4;
					//val.node.clientHeight = 6;
					//console.log(val.node.clientHeight);
					//, height/2
					//counter++;
				});
				this.dispatchEvent('chartChangedPosition');

		},
		setView: function(coords, relative, animate) {
			var newX, newY;

			animate = typeof(animate) != 'undefined' ? animate : true;

			if(relative) {
				newX = view.x + coords.x;
				newY = view.y + coords.y;
			}
			else {
				newX = coords.x;

				newY = coords.y;
			}

			if(supportsRichEffects && animate) {
				svgElement.animateViewBox(newX, newY, dimensions.width, dimensions.height, 150, updateViewBoxAttributes);
			}
			else {
				svgElement.setViewBox(newX, newY, dimensions.width, dimensions.height);
				updateViewBoxAttributes(newX, newY, dimensions.width, dimensions.height);
			}
			this.dispatchEvent('chartChangedPosition');
		},
		getViewBox: function() {
			return {
				x: view.x,
				y: view.y,
				width: dimensions.width,
				height: dimensions.height,
				scale: this.getScale()
			}
		},
		getScale: function() {
			return scale;
		},
		setSelected:		function(object) {
			activeChart.selectNode(object);
		},
		setCentre:			function(object, animate) {

			animate = animate !== false;

			activeChart.centreNode(object);

			this.setView(this.calculateCentrePoint(object), false, animate);

			this.dispatchEvent('chartCentredNode');
		},
		dispatchEvent:		function(event, data) {
			canvas.trigger(event, data);
		},
		resetPosition: function() {
			if(supportsRichEffects) {
				svgElement.animateViewBox(initialView.x, initialView.y, canvasDimensions.width, canvasDimensions.height, 500, updateViewBoxAttributes);
			}
			else {
				updateViewBoxAttributes(initialView.x, initialView.y, canvasDimensions.width, canvasDimensions.height);
				svgElement.setViewBox(initialView.x, initialView.y, canvasDimensions.width, canvasDimensions.height);
			}
			jQuery.each(countryArray, function(index, val) {				
				val.attr("r", 4);
			});
			this.dispatchEvent('chartResetPosition');
		},
		showFullChart: function() {
			var i,
				b = this.calculateBoundaries(),
				newX = b.minX,
				newY = b.minY,
				newWidth = b.maxX - b.minX,
				newHeight = b.maxY - b.minY;

			svgElement.animateViewBox(newX, newY, newWidth, newHeight, 150, updateViewBoxAttributes);
			this.dispatchEvent('chartChangedPosition');
		},
		calculateBoundaries: function() {
			var minX = activeChart.xCoord - Node.stat.horizontalMargin,
				minY = activeChart.yCoord - Node.stat.verticalMargin,
				maxX = 0,
				maxY = 0;
			activeChart.traverse(function() {
				minX = Math.min(minX, this.xCoord - Node.stat.horizontalMargin);
				maxX = Math.max(maxX, this.xCoord + Node.stat.width + Node.stat.horizontalMargin);
				minY = Math.min(minY, this.yCoord);
				maxY = Math.max(maxY, this.yCoord + Node.stat.height + Node.stat.verticalMargin);
			});

			minimumScale = canvasDimensions.width / (maxX - minX);

			return {
				minX: minX,
				maxX: maxX,
				minY: minY,
				maxY: maxY
			}
		},
		calculateCentrePoint: function(object) {
			var centrePoint = {
				x: object.xCoord + Node.stat.width / 2,
				y: object.yCoord + Node.stat.height + 2
			}

			centrePoint.x -= dimensions.width / 2;
			centrePoint.y -= dimensions.height / 3;

			return centrePoint;
		},
		getMaxViewableCoords: function() {
			return {
				x: view.x + dimensions.width,
				y: view.y + dimensions.height
			}
		},
		ensureNodeIsViewable: function(node) {
			var margin = 20,
				canvasMax = inst.getMaxViewableCoords(),
				canvasMin = { x: view.x, y: view.y },
				nMax = node.getMaximumExtents(),
				nMin = node.getMinimumExtents(),
				workingCoords = { x: view.x, y: view.y };

			if(canvasMax.x < nMax.x) {
				workingCoords.x = nMax.x + margin - dimensions.width;
			}
			if(canvasMin.x > nMin.x) {
				workingCoords.x = nMin.x - margin;
			}
			if(canvasMax.y < nMax.y) {
				workingCoords.y = nMax.y + margin - dimensions.height;
			}
			if(canvasMin.y > nMin.y) {
				workingCoords.y = nMin.y - margin;
			}

			if(workingCoords.x != view.x || workingCoords.y != view.y) {
				inst.setView(workingCoords, false, true);
			}
		},
		ensureEventInView: function(ex, ey) {

			var	modX = 0,
				modY = 0;

			// Pan the canvas with move, if needed
			if(ex > canvasBounds.x[1]) {
				modX = ex - canvasBounds.x[1];
			}
			else if(ex < canvasBounds.x[0]) {
				modX = ex - canvasBounds.x[0];
			}
			if(ey > canvasBounds.y[1]) {
				modY = ey - canvasBounds.y[1];
			}
			else if(ey < canvasBounds.y[0]) {
				modY = ey - canvasBounds.y[0];
			}

			if(modX || modY) {
				MapManager.setView({ x: modX, y: modY }, true, false);
			}
		},
		cancelChanges: function() {
			svgElement.clear();
			activeChart.destroy();
			activeChart = new Chart(activeChartBackupData);
			Node.positionTree(activeChart);
			this.resetPosition();
			activeChart.render(svgElement);
			this.dispatchEvent('chartCancelChanges');
		},
		renewCanvas: function() {
			if(supportsRichEffects) {
				svgElement.clear();
			}
			else {
				// Because VML renders different elements at different MapManager levels...
				// The safest thing to do is just to recreate it all and zero everything.
				// Somehow, this works. But that's IE for you. :-/
				svgElement.remove();
				inst.svgElement = svgElement = Raphael(canvas[0], canvasDimensions.width, canvasDimensions.height)
				inst.setView(0, 0, false, false);

				svgElement.setViewBox(0, 0, canvasDimensions.width, canvasDimensions.height);
				updateViewBoxAttributes(0, 0, canvasDimensions.width, canvasDimensions.height);
			}
		},
		load: function(chart) {

			var	needsReset = !!activeChart;

			if(!chart) chart = charts[0];

			if(needsReset) {
				activeChart.destroy();
				inst.renewCanvas();
			}

			svgElement.setViewBox(0, 0, canvasDimensions.width, canvasDimensions.height);
			updateViewBoxAttributes(0, 0, canvasDimensions.width, canvasDimensions.height);

			SIMPLIFY.requestHandler.json('OrganisationChart_Load', { Chart: chart }, function(response) {
				var data = response.Data,
					json = JSON.parse(data.JSON),
					saveBar = $('#SaveBar'),
					filterBar = $('div.filterBar');

				activeChartBackupData = json;

				activeChart = new Chart(json);

				// Once everything has been set up, position the nodes.
				Node.positionTree(activeChart);

				// Display the chart
				activeChart.render(svgElement);

				// Read names in to memory for later (find country)...
				if(needsReset) {
					flatIndex = {};
				}
				activeChart.traverse(function() {
					if(flatIndex[this.Name]) {
						flatIndex[this.Name + ' (' + this.Title + ')'] = this;
					}
					else {
						flatIndex[this.Name] = this;
					}
				});

				AutocompleteField.registerLocalDatabase('orgchart', flatIndex);

				if(activeChart.IsReadOnly !== true) {
					filterBar.css('borderRight', '');
					saveBar.show();
				}
				else {
					filterBar.css('borderRight', 0);
					saveBar.hide();
				}

				if(activeChart.centred) {
					initialView = inst.calculateCentrePoint(activeChart.centred);
					inst.setView(initialView, false, false);
					activeChart.selectNode(activeChart.centred);
				}
				else {
					initialView = { x: 0, y: 0 }
				}

			});

		},
		callChartMethod: function(method) {
			return activeChart[method]();
		},
		getItemByRecordId: function(recordId) {
			var result;
			activeChart.traverse(function() {
				if(this.RecordId == recordId) {
					result = this;
					return false;
				}
			});
			return result;
		},
		supportsRichEffects: supportsRichEffects
	})
}());

var nodeConstructor = function(properties) {
	var i,
		typeClass,
		children = properties.Children;

	this.Children = [];

	for(i in properties) {
		if(i == 'Children') continue; // Don't set this until later
		this[i] = properties[i];
	}

	i = null;

	for(i in children) {
		// Set up a linked list
		if(properties.Type == 'Country') {
			children[i].chart = this.chart;
		}
		else if(properties.Type == 'Chart') {
			children[i].chart = this;
		}
		children[i].parent = this;
		this.Children.push(new Country(children[i]));
	}

	TreeEntity.stat.addToLevel(this);

};    
    
		//r.drawGrid(leftgutter + X * .5 + .5, topgutter + .5, width - leftgutter - X, height - topgutter - bottomgutter, 10, 10, "#000");
	drawMap = function() {

    var label = r.set(),
        lx = 0, ly = 0,
        is_label_visible = false,
        leave_timer,
        blanket = r.set(),
		circleRadius = 4, circleHoverRadius = 5;
		label.push(r.text(60, 12, "United Kingdom").attr(txt));
		label.hide();
    var frame = r.popup(100, 100, label, "right").attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .7}).hide();

    var p, bgpp;
    for (var i = 0, ii = labels.length; i < ii; i++) {

		var y = Math.round(data[i]),
            //y = Math.round(height - bottomgutter - Y * data[i]),            
			//x = Math.round(leftgutter + X * (i + .5)),
            x = Math.round(hozData[i]),
			t = r.text(x, height - 6, labels[i]).attr(txt).toBack();
		
		//Shove the labels into an array for modification later
		labelArray[i] = t;
		
        if (!i) {
            p = ["M", x, y, "C", x, y];
            bgpp = ["M", leftgutter + X * .5, height - bottomgutter, "L", x, y, "C", x, y];
        }
        if (i && i < ii - 1) {
            var Y0 = Math.round(height - bottomgutter - Y * data[i - 1]),
                X0 = Math.round(leftgutter + X * (i - .5)),
                Y2 = Math.round(height - bottomgutter - Y * data[i + 1]),
                X2 = Math.round(leftgutter + X * (i + 1.5));
            var a = getAnchors(X0, Y0, x, y, X2, Y2);
            p = p.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
            bgpp = bgpp.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
        }	
		if(zoomed===true){
			circleRadius = 2;
		}	
        var dot = r.circle(x, y, circleRadius).attr({fill: "#293583", stroke: "#ffffff", "stroke-width": 2, "stroke-opacity": 0.9});
		countryArray[i] = dot;
        blanket.push(r.rect(x - 2.5, y - 2.5, 5, 5).attr({stroke: "1", fill: "#fff", opacity: 0}));
        var rect = blanket[blanket.length - 1];
		rect.node.style.cursor = 'pointer';
        (function (x, y, data, lbl, dot, url) {
            var timer, i = 0;
			rect.click(function (){
				window.top.location.href = url;
			});
            rect.hover(function () {
				dot.attr("r", circleHoverRadius);
				circleHoverRadius = 5;
				if(zoomed===true){
					circleHoverRadius = 3;
				}
                clearTimeout(leave_timer);
                var side = "right";
                if (x + frame.getBBox().width > width) {
                    side = "left";
                }
				labelOffset = x+10;
                label[0].attr(txt);
                label[0].attr({x: x});
                label[0].attr({y: y});
				if(zoomed==true){
					label[0].attr(txt3);
					labelOffset = x+5;
                    /*if(scaleVal===1){
                        if(!Raphael.vml) {
                            scaleVal = 0.8;
                        } else {
                            label[0].attr({x: x});
                            label[0].attr({y: y});

                            scaleVal = 1;//0.4;

                            //frame.transform("s0.4");
                            //isScaled = true;
                        }
                    } */
				//}
                    if(Raphael.vml) {
                        //label[0].transform("t"+x+","+y);
                        //label[0].transform();
                        //label[0].transform("t"+labelOffset+","+y+"s0.8");
                        label[0].attr({x: x - 10});
                        label[0].transform("...s0.7");
                        isScaled = true;
                    } else {
                    }
				} else {
				    if(isScaled==true){
				        //label[0].transform("t"+x+","+y);
				    }
				    //Need to rescale here
				    //label[0].transform("s1");
				}

                label[0].attr({text: lbl});
                var ppp = r.popup(labelOffset, y, label, side, 1);
                //ppp.dx = Math.round(ppp.dx * scaleVal);
                //ppp.dy = Math.round(ppp.dy * scaleVal);
                if(zoomed==true){
                    //console.log(Raphael.vml);
                    if(Raphael.vml) {
                        anim = Raphael.animation({
                            path: ppp.path,
                            transform: ["t", ppp.dx, ppp.dy]
                        }, 200 * is_label_visible);
                    } else {
                        anim = Raphael.animation({
                            path: ppp.path,
                            transform: ["t", ppp.dx, ppp.dy]
                        }, 200 * is_label_visible);
                    }
                    //scaleVal = 1;
                } else {
                    anim = Raphael.animation({
                        path: ppp.path,
                        transform: ["t", ppp.dx, ppp.dy]
                    }, 200 * is_label_visible);
                }

                //Required to fix a problem with IE6-8 and VML
				if( typeof label[0].transform() === 'string') {
				    var strs = Raphael.parseTransformString(label[0].transform());

                    lx = strs[0][1];
                    ly = strs[0][2];
                }
                else {
                    lx = label[0].transform()[0][1] + ppp.dx;
                    ly = label[0].transform()[0][2] + ppp.dy;
                }

                frame.show().stop().animate(anim);
                label[0].show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);
                /*if(zoomed===true&&!Raphael.vml){
                    label[0].show().stop().animateWith(frame, anim, {transform: ["t", lx, ly, "s", scaleVal]}, 200 * is_label_visible);
                } else {
                    //if(isScaled===true) {
                        //label[0].show().stop().animateWith(frame, anim, {transform: ["t", lx, ly, "s", scaleVal]}, 200 * is_label_visible);
                    //} else {
                        label[0].show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);
                    //}
                }  */
				dot.attr("r", circleHoverRadius);
                is_label_visible = true;
            }, function () {
				circleRadius = 4;
				if(zoomed==true){
					circleRadius = 2;
				}	

				dot.attr("r", circleRadius);				
                leave_timer = setTimeout(function () {
                    frame.hide();
                    label[0].hide();
                    is_label_visible = false;
                }, 1);
            });
        })(x, y, data[i], labels[i], dot, urlKeys[i]);
    }
    p = p.concat([x, y, x, y]);
    bgpp = bgpp.concat([x, y, x, y, "L", x, height - bottomgutter, "z"]);
    frame.toFront();
    label[0].toFront();
    blanket.toFront();
	}
	drawMap();
        }
    });
};