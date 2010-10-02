Function.prototype.inherit = function (proto) {
	this.prototype = new proto;
	this.prototype._super = proto.prototype;
	this.prototype.constructor = this;
};

Array.prototype.deleteItem = function (element) {
	var index = this.indexOf(element);
	index !== -1 && this.splice(index, 1);
};

var _$ = window.$,
    loadingImages = 0,
    time,
    loopInterval = null,
    started = false;

Bodies = $ = {
	id: "field",
	canvas: null,
	context: null,
	width: null,
	height: null,
	offsetLeft: null,
	offsetTop: null,
	callbacks: {},
	images: {},
	defaultInterval: 40,
	keys: [],

	init: function(id, width, height) {
		if (typeof id === "string") {
			this.id = id;
		} else if (typeof id === "number") {
			widht = id;
			height = width;
		}

		$ = this;
		$.canvas = document.getElementById(this.id);
		$.canvas.width = $.width = width;
		$.canvas.height = $.height = height;
		$.context = $.canvas.getContext("2d");
		attachEvents();
		calculateOffsets();
	},
	
	loadImage: function (name, path) {
		var image = new Image();
		loadingImages += 1;
		image.onload = function () {
			loadingImages -= 1;
		};
		image.src = path;
		$.images[name] = image;
	},
	
	resource: function (name) {
		return $.images[name];
	},
	
	loaded: function (callback) {
		if (loadingImages) {
			setTimeout(function () {
				$.loaded(callback);
			}, 100);
		} else {
			callback();
		}
	},
	
	refresh: function (callback, interval) {
		if (!interval) { interval = $.defaultInterval; }
		$.callbacks.refresh = callback;
		if (!started) {
			setTimeout(function () {
				$.refresh(callback, interval);
			}, 100);
		} else {
			loopInterval && clearInterval(loopInterval);
			loopInterval = setInterval($.loop, interval);
		}
	},
	
	start: function (callback) {
		if (loadingImages) {
			setTimeout(function () {
				$.start(callback);
			}, 100);
		} else {
			time = new Date().getTime();
			started = true;
			if (callback) { callback(time) };
		}
	},

	loop: function () {
		var now = new Date().getTime(),
		    elapsed = now - time;
		time = now;
		runKeyHoldCallbacks(now);
		$.callbacks.refresh(elapsed, now);
	},
	
	testPoint: function (point, sprite) {
	    	var sLeft = sprite.left - sprite.dx, sRight = sprite.right - sprite.dx,
	    	    sTop = sprite.top - sprite.dy, sBottom = sprite.bottom - sprite.dy;
	
		if (point.x < sLeft ||
	    	    point.x > sRight ||
	    	    point.y < sTop ||
	    	    point.y > sBottom) {
			return false;
		}

		offset = (((point.y - sTop + sprite.imageOffsetY) * sprite.imageWidth) + (point.x - sLeft + sprite.imageOffsetX)) * 4 + 3;
		return sprite.pixels[offset] === 255;
	},

	testCollision: function (s1, s2) {
		if (s1 === s2) { return false; }
		var left,
	    	top,
	    	width,
	    	height,
	    	pixels1, pixels2,
	    	offset1, offset2,
	    	dataWidth1, dataWidth2,
	    	s1Width, s2Width,

	    	s1Left = s1.left, s1Right = s1.right,
	    	s1Top = s1.top, s1Bottom = s1.bottom,
	    	s2Left = s2.left, s2Right = s2.right,
	    	s2Top = s2.top, s2Bottom = s2.bottom;
	
		if (s1Right < s2Left ||
	    	s1Left > s2Right ||
	    	s1Bottom < s2Top ||
	    	s1Top > s2Bottom) {
			return false;
		}
	
		left = Math.max(s1Left, s2Left);
		top = Math.max(s1Top, s2Top);
		width = (Math.min(s1Right, s2Right) - left) * 4; // four "ints" per pixel;
		height = Math.min(s1Bottom, s2Bottom) - top;
	
		s1Width = s1.imageWidth;
		s2Width = s2.imageWidth;
		pixels1 = s1.pixels;
		pixels2 = s2.pixels;
	
	
		offset1 = (((top - s1Top + s1.imageOffsetY) * s1Width) + (left - s1Left + s1.imageOffsetX)) * 4 + 3;
		offset2 = (((top - s2Top + s2.imageOffsetY) * s2Width) + (left - s2Left + s2.imageOffsetX)) * 4 + 3;
		dataWidth1 = s1.scanWidth;
		dataWidth2 = s2.scanWidth;
	
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x += 4) {
				if ((pixels1[offset1 + x] === 255) && (pixels2[offset2 + x] === 255)) {
					return true;
				}
			}
			offset1 += dataWidth1;
			offset2 += dataWidth2;
		}
		return false;
	},
	
	/**
 	* determine the area of collisions between two objects
 	*/
	
	collisionArea: function (s1, s2) {
		if (s1 === s2) { return 0; } // for consistency with the fact that an object can't collide with itself
		var left,
	    	top,
	    	width,
	    	height,
	    	pixels1, pixels2,
	    	offset1, offset2,
	    	dataWidth1, dataWidth2,
	    	s1Width, s2Width,
	    	s1Left = s1.left, s1Right = s1.right,
	    	s1Top = s1.top, s1Bottom = s1.bottom,
	    	s2Left = s2.left, s2Right = s2.right,
	    	s2Top = s2.top, s2Bottom = s2.bottom,
	    	area = 0;
	
		if (s1Right < s2Left ||
	    	s1Left > s2Right ||
	    	s1Bottom < s2Top ||
	    	s1Top > s2Bottom) {
			return 0;
		}
	
		left = Math.max(s1Left, s2Left);
		top = Math.max(s1Top, s2Top);
		width = (Math.min(s1Right, s2Right) - left) * 4; // four "ints" per pixel;
		height = Math.min(s1Bottom, s2Bottom) - top;
	
		s1Width = s1.imageWidth;
		s2Width = s2.imageWidth;
		pixels1 = s1.pixels;
		pixels2 = s2.pixels;
	
	
		offset1 = (((top - s1Top + s1.imageOffsetY) * s1Width) + (left - s1Left + s1.imageOffsetX)) * 4 + 3;
		offset2 = (((top - s2Top + s2.imageOffsetY) * s2Width) + (left - s2Left + s2.imageOffsetX)) * 4 + 3;
		dataWidth1 = s1.scanWidth;
		dataWidth2 = s2.scanWidth;
	
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x += 4) {
				if ((pixels1[offset1 + x] === 255) && (pixels2[offset2 + x] === 255)) {
					area++;
				}
			}
			offset1 += dataWidth1;
			offset2 += dataWidth2;
		}
		return area;
	},

	coordinates: function (e) {
		var x, y;
		if (e.pageX) {
			x = e.pageX;
			y = e.pageY;
		} else if (e.clientX) {
			x = e.clientX +
		    	document.body.scrollLeft +
		    	document.documentElement.scrollLeft;
			y = e.clientY +
		    	document.body.scrollTop +
		    	document.documentElement.scrollTop;
		}
	
		x -= $.offsetLeft;
		y -= $.offsetTop;
		return {x: x, y: y};
	},

	mouseMove: function (callback) {
		addMouseCallback("mousemove", callback);
	},

	mouseDown: function (callback) {
		addMouseCallback("mousedown", callback);
	},

	mouseUp: function (callback) {
		addMouseCallback("mouseup", callback);
	},

	keyPress: function (callback) {
		$.callbacks.keyPress = callback;
	},

	keyHold: function (callback, delay, interval) {
		var keyHold;

		keyHold = $.callbacks.keyHold = $.callbacks.keyHold || {};
		keyHold.callback = callback;
		keyHold.delay = delay;
		keyHold.interval = interval;
	},

	register: function (o) {
		var events = ["keyHold", "keyPress", "mouseUp", "mouseDown", "mouseMove", "loaded", "start", "refresh"],
		    e,
		    i, len;

		for (i = 0, len = events.length; i < len; i++) {
			e = events[i];
			if (e in o) {
				$[e](o[e].bind(o));
			}
		}
	}
};

function addMouseCallback(event, callback) {
	if (!$.callbacks[event]) {
		$.callbacks[event] = [];
	}
	$.callbacks[event].push(callback);
}

function runKeyHoldCallbacks(now) {
	var keys = $.keys,
	    keyHold = $.callbacks.keyHold,
	    key,
	    i, len;

	if (!keyHold) { return; }

	for (i = 0, len = keys.length; i < len; i++) {
		key = keys[i];

		if (!key) { continue; }

		if (!key.interval) {
			keyHold.callback(i);
			key.interval = keyHold.delay;
		} else if (now >= key.last + key.interval) {
			keyHold.callback(i);
			key.interval = keyHold.interval;
			key.last = now;
		}
	}
}

function attachEvents() {
	/* superstitious use of code duplication right here */
	$.canvas.addEventListener("mousedown", function (e) {
		var point = $.coordinates(e),
	    	callbacks;
	
		e.preventDefault();
		if ($.callbacks.mousedown) {
			callbacks = $.callbacks.mousedown;
			for (var i = 0; i < callbacks.length; i++) {
				callbacks[i](point.x, point.y, e);
			}
		}
	}, false);

	$.canvas.addEventListener("mouseup", function (e) {
		var point = $.coordinates(e),
	    	callbacks;
	
		e.preventDefault();
		if ($.callbacks.mouseup) {
			callbacks = $.callbacks.mouseup;
			for (var i = 0; i < callbacks.length; i++) {
				callbacks[i](point.x, point.y, e);
			}
		}
	}, false);

	$.canvas.addEventListener("contextmenu", function (e) {
		e.preventDefault();
	}, false);

	$.canvas.addEventListener("mousemove", function (e) {
		var point = $.coordinates(e),
	    	mmCallbacks;
	
		e.preventDefault();
		if ($.callbacks.mousemove) {
			mmCallbacks = $.callbacks.mousemove;
			for (var i = 0; i < mmCallbacks.length; i++) {
				mmCallbacks[i](point.x, point.y, e);
			}
		}
	}, false);
	
	addEventListener("keydown", function (e) {
		var keys = $.keys,
		    pressed = keys[e.keyCode],
		    keyPress = $.callbacks.keyPress;

		e.preventDefault();
		if (!pressed) {
			keys[e.keyCode] = {last: new Date().getTime()};
			keyPress && keyPress(e.keyCode);
		}

	}, false);
	
	addEventListener("keyup", function (e) {
		$.keys[e.keyCode] = false;
	}, false);
}

function calculateOffsets() {
	var b = $.canvas.getBoundingClientRect();

	$.offsetLeft = b.left;
	$.offsetTop = b.top;
}
