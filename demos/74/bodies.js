/* a miserable pile of Javascript
 *
 */

(function () {
function argsArray(args) {
	return Array.prototype.slice.call(args);
}

Function.prototype.partial = function () {
	var f = this, args = argsArray(arguments);

	return function () {
		var i, len;

		for (i = 0, len = arguments.length; i < len; i++) {
			args.push(arguments[i]);
		}

		return f.apply(this, args);
	};
};

Function.prototype.bind = function (o) {
	var f = this;

	return function () {
		var args = argsArray(arguments);

		return f.apply(o, args);
	};
};

Function.prototype.curry = function () {
	var a = arguments, f = this;

	return function (arg) {
		var args = argsArray(a);
		args.push(arg);

		return f.apply(window, args);
	};
};

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
		var canctx;

		if (typeof id === "string") {
			this.id = id;
		} else if (typeof id === "number") {
			height = width;
			width = id;
		}

		$ = this;
		$.width = width;
		$.height = height;
		$.canvas = document.getElementById(this.id);

		if ($.canvas) {
			$.canvas.width = width;
			$.canvas.height = height;
			$.context = $.canvas.getContext("2d");
		} else {
			canctx = $.createCanvas(width, height);
			$.canvas = canctx[0];
			$.context = canctx[1];

			$.canvas.id = this.id;
			document.body.appendChild($.canvas);
		}

		attachEvents();
		calculateOffsets();
	},
	
	createCanvas: function (width, height) {
		var canvas, context;

		canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		context = canvas.getContext("2d");

		return [canvas, context];
	},

	loadImage: function (name, path) {
		var image = new Image();
		loadingImages += 1;

		image.onload = function () {
			$.images[name] = this;
			loadingImages -= 1;
		};
		image.src = path;
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
		var events = ["keyHold", "keyPress", "mouseUp", "mouseDown", "mouseMove", "refresh"],
		    e,
		    i, len,
		    args = [];

		for (i = 0, len = events.length; i < len; i++) {
			e = events[i];
			if (e in o) {
				switch (e) {
				case "keyHold":
					args = [o.keyHoldDelay, o.keyHoldInterval];
					break;
				case "refresh":
					args = [o.refreshInterval];
					break;
				}

				$[e].apply($, [o[e].bind(o)].concat(args));
			}
		}
	},

	noop: function () {}
};

function addMouseCallback(event, callback) {
	$.callbacks[event] = callback;
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

function runMouseCallbacks(eventName, e) {
	var point = $.coordinates(e),
	    i, len,
	    callback;
	
	e.preventDefault();
	callback = $.callbacks[eventName];

	callback && callback(point.x, point.y, e);
}

function attachEvents() {
	["mousedown", "mouseup", "mousemove"].forEach(function (name) {
		$.canvas.addEventListener(name, runMouseCallbacks.curry(name), false);
	});

	$.canvas.addEventListener("contextmenu", function (e) {
		e.preventDefault();
	}, false);

	
	addEventListener("keydown", function (e) {
		var keys = $.keys,
		    pressed = keys[e.keyCode],
		    keyPress = $.callbacks.keyPress;

		//e.preventDefault();
		if (!pressed) {
			keys[e.keyCode] = {last: new Date().getTime()};
			keyPress && keyPress(e.keyCode);
		}

		e.preventDefault();
	}, false);
	
	addEventListener("keyup", function (e) {
		$.keys[e.keyCode] = false;
		e.preventDefault();
	}, false);
}

function calculateOffsets() {
	var b = $.canvas.getBoundingClientRect();

	$.offsetLeft = b.left;
	$.offsetTop = b.top;
}
$.Sprite = function (imageName, height, options) {;
	if (imageName === undefined) { return; }
	var image,
	    width;

	options = options || {};
	this.canvas = document.createElement("canvas");
	this.context = this.canvas.getContext("2d");
	this.oCanvas = document.createElement("canvas");
	this.oContext = this.oCanvas.getContext("2d");

	if (typeof imageName === "number" && typeof height === "number") {
		width = imageName;
	} else {
		image = $.resource(imageName);
		options = height || {};
		width = image.width;
		height = image.height;
		this.resource = image;
		this.resourceName = imageName;
		this.steps = 150;
	}

	this.wall = false;
	this.precompute = options.precompute;
	this.foreign = options.foreign;
	this.resize(width, height);
};

$.Sprite.precomputed = {};

$.Sprite.prototype.x = null;
$.Sprite.prototype.y = null;
$.Sprite.prototype.left = null;
$.Sprite.prototype.top = null;
$.Sprite.prototype.right = null;
$.Sprite.prototype.bottom = null;
$.Sprite.prototype.width = null;
$.Sprite.prototype.height = null;
$.Sprite.prototype.rotation = 0;
$.Sprite.prototype.ox = 0;
$.Sprite.prototype.oy = 0;
$.Sprite.prototype.dx = 0;
$.Sprite.prototype.dy = 0;
$.Sprite.prototype.vx = 0;
$.Sprite.prototype.vy = 0;
$.Sprite.prototype.imageOffsetX = 0;
$.Sprite.prototype.imageOffsetY = 0;

$.Sprite.prototype.resize = function (width, height) {
	var image = this.resource;

	this.oCanvas.width = this.oWidth = width;
	this.oCanvas.height = this.oHeight = height;
	this.halfBaseWidth = this.oWidth / 2;
	this.halfBaseHeight = this.oHeight / 2;

	setRotatedDimensions.call(this);


	if (image !== undefined) {
		this.oContext.drawImage(image, 0, 0);
		if (this.precompute) {
			preRotate(this);
		}
		else {
			copyPixels.call(this);
		}
	}
};

$.Sprite.prototype.moveTo = function (x, y) {
	this.x = x;
	this.y = y;

	this.ox = x - this.dx;
	this.oy = y - this.dy;

	this.left = Math.floor(x);
	this.top = Math.floor(y);

	this.right = this.left + this.width;
	this.bottom = this.top + this.height;
	return this;
};

$.Sprite.prototype.rotateTo = function (angle) {
	var context = this.context,
	    increment,
	    rotated,
	    width = this.width,
	    height = this.height;

	if (this.precompute) {
		increment = Math.PI * 2 / this.steps;

		if (angle < 0) { angle += Math.PI * 2; }

		rotated = $.Sprite.precomputed[this.resourceName][Math.floor(angle / increment) * increment];
		copyCachedProperties(rotated, this);
		return;
	}


	this.rotation = angle;
	setRotatedDimensions.call(this);

	context.clearRect(0, 0, width, height);
	context.save();
	context.translate(this.halfWidth, this.halfHeight);
	context.rotate(angle);
	context.translate(-this.halfBaseWidth, -this.halfBaseHeight);
	context.drawImage(this.oCanvas, 0, 0);
	context.restore();

	if (!this.foreign) {
		this.imageData = context.getImageData(0, 0, width, height);
		this.pixels = this.imageData.data;
	}
};

$.Sprite.prototype.rotate = function (angle) {
	this.rotation += angle;
	this.rotateTo(this.rotation);
};

$.Sprite.prototype.updatePixels = function (update) {
	if (this.foreign) { return; }
	var context = this.oContext,
	    data = context.getImageData(0, 0, this.oWidth, this.oHeight),
	    pixels = data.data;
	update(this.oWidth, this.oHeight, pixels);
	context.putImageData(data, 0, 0);
	if (this.rotation) {
		this.rotateTo(this.rotation);
	} else {
		copyPixels.call(this);
	}
};

$.Sprite.prototype.readPixels = function (callback) {
	if (this.foreign) { throw "Cannot update pixels of foreign source"; }

	var context = this.oContext,
	    data = context.getImageData(0, 0, this.oWidth, this.oHeight),
	    pixels = data.data;

	callback(this.oWidth, this.oHeight, pixels);
};

$.Sprite.prototype.draw = function (ctx) {
	ctx = ctx || $.context;
	ctx.drawImage(this.canvas, this.left, this.top);
};

$.Sprite.prototype.update = function (dt) {
	this.moveTo(this.x + this.vx * dt, this.y + this.vy * dt);
};

function copyCachedProperties(from, to) {
	var props = ["pixels", "canvas", "width", "height", "dx", "dy"],
	    prop,
	    i, len;

	for (i = 0, len = props.length; i < len; i++) {
		prop = props[i];
		to[prop] = from[prop];
	}
}

function preRotate(sprite) {
	var group = $.Sprite.precomputed[sprite.resourceName],
	    resource,
	    increment,
	    steps = sprite.steps,
	    rotation;

	if (group) {
		sprite.canvas = group[0].canvas;
		sprite.pixels = group[0].pixels;
		return;
	}
	group = $.Sprite.precomputed[sprite.resourceName] = {};
	increment = Math.PI * 2 / steps;
	for (var i = 0; i < steps; ++i) {
		rotation = i * increment;
		resource = group[rotation] = {};

		resource.rotation = rotation;
		resource.oWidth = sprite.oWidth;
		resource.oHeight = sprite.oHeight;
		resource.halfBaseWidth = sprite.halfBaseWidth;
		resource.halfBaseHeight = sprite.halfBaseHeight;


		resource.canvas = document.createElement("canvas");
		resource.oCanvas = sprite.oCanvas;

		/* this also sets the canvas resource dimensions */
		setRotatedDimensions.call(resource);
		resource.context = resource.canvas.getContext("2d");

		$.Sprite.prototype.rotateTo.call(resource, rotation);

		delete resource.context;
		delete resource.imageData;
	}
	sprite.canvas = group[0].canvas;
	sprite.pixels = group[0].pixels;
}

function setRotatedDimensions() {
	var angle = this.rotation,
	    ow = this.oWidth,
	    oh = this.oHeight,
	    sin = Math.sin(angle),
	    cos = Math.cos(angle);

	this.canvas.width = this.imageWidth = this.width = Math.floor(Math.abs(oh * sin) + Math.abs(ow * cos));
	this.canvas.height = this.imageHeight = this.height = Math.floor(Math.abs(oh * cos) + Math.abs(ow * sin));
	this.halfWidth = this.width / 2;
	this.halfHeight = this.height / 2;
	this.scanWidth = this.width * 4;

	this.dx = (ow - this.width) / 2;
	this.dy = (oh - this.height) / 2;
	this.x = this.ox + this.dx;
	this.y = this.oy + this.dy;
	this.left = Math.floor(this.x);
	this.top = Math.floor(this.y);
}

function copyPixels() {
	this.context.clearRect(0, 0, this.width, this.height);
	this.context.drawImage(this.oCanvas, 0, 0);
	if (!this.foreign) {
		this.imageData = this.context.getImageData(0, 0, this.width, this.height);
		this.pixels = this.imageData.data;
	}
}

$.Sprite.prototype.copyPixels = copyPixels;
$.Group = function (pieces) {
	this.items = [];
	if (pieces !== undefined) {
		for (var i = 0; i < pieces.length; i++) {
			this.insert(pieces[i]);
		}
	}
};

$.Group.prototype.x = 0;
$.Group.prototype.y = 0;

$.Group.prototype.insert = function (item) {
	var items = this.items;
	if (items.indexOf(items) !== -1) { return; }
	item.group = this;
	items[items.length] = item;
};

$.Group.prototype.remove = function (item) {
	var index, items = this.items;
	if ((index = items.indexOf(item)) === -1) { return; }
	items.splice(index, 1);
};

$.Group.prototype.merge = function (other) {
	if (other === this) { return; }
	var item,
	    items = other.items;

	for (var i = 0; i < items.length; i++) {
		this.insert(items[i]);
	}
	items.length = 0;
};

$.Group.prototype.moveTo = function (x, y) {
	var dx = x - this.x,
	    dy = y - this.y,
	    items = this.items,
	    item;

	this.x = this.right = x;
	this.y = this.bottom = y;
	for (var i = 0; i < items.length; i++) {
		item = items[i];
		item.moveTo(item.x + dx, item.y + dy, true);
		this.right = Math.max(this.right, item.right);
		this.bottom = Math.max(this.bottom, item.bottom);
	}
};

$.Group.prototype.draw = function () {
	var items = this.items, i;
	for (i = 0; i < items.length; i++) {
		items[i].draw();
	}
};
$.Quadtree = function (x, y, r, b) {
	this.isPartitioned = false;
	this.nodes = null;
	this.maxItems = 10;
	this.maxDepth = 3;
	this.items = [];
	this.left = this.x = x;
	this.top = this.y = y;
	this.right = r;
	this.bottom = b;
};

$.Quadtree.prototype.insert = function (item, depth) {
	var items = this.items,
	    itemsLength = items.length;

	// lets bail

	if (!this.contains(item.x, item.y, item.right, item.bottom)) {
		return;
	}

	if (depth === undefined) {
		depth = 0;
	}

	// for our posterity
	if (this.isPartitioned &&
	    !this.stradlesNodes(item)) {
		for (var i = 0; i < 4; i++) {
			this.nodes[i].insert(item, depth + 1);
		}
		return;
	}

	// lets split
	if (!this.isPartitioned &&
	    (itemsLength >= this.maxItems)  &&
	    !this.stradlesNodes(item) &&
	    (depth < this.maxDepth)) {
		this.createNodes();
		for (var i = 0; i < 4; i++) {
			this.nodes[i].insert(item, depth + 1);
		}
		return;
	}

	// add the item to this node
	item.collisionNode = this;
	items[itemsLength] = item;
};

$.Quadtree.prototype.createNodes = function () {
	var cX = (this.left + this.right) / 2,
	    cY = (this.top + this.bottom) / 2,
	    nodes = [];

	nodes[0] = new $.Quadtree(this.left, this.top, cX, cY);
	nodes[1] = new $.Quadtree(cX, this.top, this.right, cY);
	nodes[2] = new $.Quadtree(this.left, cY, cX, this.bottom);
	nodes[3] = new $.Quadtree(cX, cY, this.right, this.bottom);
	this.nodes = nodes;
	this.redistribute();
	this.isPartitioned = true;
};

$.Quadtree.prototype.redistribute = function () {
	var i = 0,
	    item = this.items[i],
	    nodes = this.nodes;

	while (item) {
		if (!this.stradlesNodes(item)) {
			this.deleteItem(item);
			nodes[0].insert(item);
			nodes[1].insert(item);
			nodes[2].insert(item);
			nodes[3].insert(item);
		} else {
			i++;
		}
		item = this.items[i];
	}
};

$.Quadtree.prototype.stradlesNodes = function (item) {
	var cX = (this.left + this.right) / 2,
	    cY = (this.top + this.bottom) / 2;

	return (((item.x < cX) && (item.right > cX)) ||
		((item.y < cY) && (item.bottom > cY)));
};

$.Quadtree.prototype.queryNodes = function (rect, nodes) {
	var x = rect.x,
	    y = rect.y,
	    r = rect.right,
	    b = rect.bottom;

	if (this.touches(x, y, r, b)) {
		nodes[nodes.length] = this;
	}
	
	if (this.isPartitioned) {
		for (var i = 0; i < 4; i++) {
			this.nodes[i].queryNodes(rect, nodes);
		}
	}
};

$.Quadtree.prototype.queryItems = function (rect) {
	var nodes = [],
	    items = [];
	this.queryNodes(rect, nodes);
	for (var i = 0, l = nodes.length; i < l; ++i) {
		Array.prototype.push.apply(items, nodes[i].items);
	}
	return items;
};

$.Quadtree.prototype.contains = function (x, y, r, b) {
	return ((x >= this.left) &&
		(r <= this.right) &&
		(y >= this.top) &&
		(b <= this.bottom));
};

$.Quadtree.prototype.touches = function (x, y, r, b) {
	return !(x > this.right ||
		r < this.left ||
		y > this.bottom ||
		b < this.top);
};

$.Quadtree.prototype.deleteItem = function (item) {
	var index,
	    items = this.items;
	if ((index = items.indexOf(item)) === -1) {
		return;
	}
	items.splice(index, 1);
};
$.World = function (imageName, tilesheet, map, resolution) {
	var image = $.resource(imageName),
	    pixels,
	    region,
	    offset,
	    width, height,
	    tile,
	    tcanvas,
	    tcontext,
	    sx, sy;

	this.left = 0;
	this.top = 0;
	this.width = map.width;
	this.height = map.height;
	this.scanWidth = image.width * 4;
	tcanvas = document.createElement("canvas");
	tcanvas.width = image.width;
	tcanvas.height = image.height;
	tcontext = tcanvas.getContext("2d");
	tcontext.drawImage(image, 0, 0);
	this.pixels = tcontext.getImageData(0, 0, image.width, image.height).data;
	this.canvas = document.createElement("canvas");
	this.canvas.width = map.width;
	this.canvas.height = map.height;
	this.context = this.canvas.getContext("2d");
	this.quadtree = new $.Quadtree(0, 0, map.width, map.height);
	this.actors = [];

	for (var i = 0, len = map.tiles.length; i < len; ++i) {
		tile = map.tiles[i];
		region = {};
		region.dx = region.dy = 0;
		region.x = region.left = tile.x;
		region.y = region.top = tile.y;
		region.width = region.height = resolution;
		region.right = region.x + region.width;
		region.bottom = region.y + region.height;
		sx = tilesheet[tile.tile].x;
		sy = tilesheet[tile.tile].y;
		region.imageOffsetX = sx;
		region.imageOffsetY = sy;
		region.imageWidth = image.width;
		region.imageHeight = image.height;
		region.scanWidth = this.scanWidth;
		region.pixels = this.pixels;
		region.wall = true;
		this.context.drawImage(tcanvas, sx, sy, resolution, resolution, tile.x, tile.y, resolution, resolution);
		this.quadtree.insert(region);
	}
};

$.World.prototype.draw = function () {
	$.context.drawImage(this.canvas, 0, 0);
};

$.World.prototype.insert = function (item) {
	this.actors.push(item);
	this.quadtree.insert(item);
};

$.World.prototype.deleteItem = function (item) {
	var actors = this.actors,
	    index = actors.indexOf(item);

	if (index !== -1) {
		actors.splice(index, 1);
		item.collisionNode.deleteItem(item);
	}
};

$.World.prototype.update = function (callback, filter) {
	var actor,
	    region,
	    collisionRegions,
	    collisions,
	    actors = this.actors;

	if (!filter) { filter = returnTrue; }
	for (var i = 0; i < actors.length; ++i) {
		actor = actors[i];
		region = actor.collisionNode;
		collisions = [];
		collisionRegions = [];

		// update quadtree
		this.quadtree.queryNodes(actor, collisionRegions);
		if (collisionRegions[collisionRegions.length-1] !== region) {
			region.deleteItem(actor);
			this.quadtree.insert(actor);
		}	

		// collide
		for (var j = 0, regionsLength = collisionRegions.length; j < regionsLength; ++j) {
			var r = collisionRegions[j];
			for (var k = 0, itemsLength = r.items.length; k < itemsLength; ++k) {
				var other = r.items[k];
				if (filter(actor, other) && $.testCollision(actor, other)) {
					if (collisions.indexOf(other) === -1) {
						collisions[collisions.length] = other;
					}
				}
			}
		}
		if (collisions.length) {
			if (actor.eject && collisions[0].wall) { eject(actor, collisions); }
			else if (callback) { callback(actor, collisions); }
		}
	}
};

function returnTrue() { return true; }
function eject(actor, walls) {
	var oldX, oldY,
   		normalX, normalY,
   		dx, dy,
   		length = 1,
   		angle,
   		cos, sin,
   		colliding = true;

	oldX = actor.x;
	oldY = actor.y;


	normalX = wallCollisionArea(actor.moveTo(oldX - 1, oldY), walls) -
  		wallCollisionArea(actor.moveTo(oldX + 1, oldY), walls);
	normalY = wallCollisionArea(actor.moveTo(oldX, oldY - 1), walls) -
  		wallCollisionArea(actor.moveTo(oldX, oldY + 1), walls);

	angle = Math.atan2(normalY, normalX);
	cos = Math.cos(angle);
	sin = Math.sin(angle);

	while (colliding) {
		colliding = false;
		dx = length * cos;
		dy = length * sin;
		actor.moveTo(oldX + dx, oldY + dy);
		for (var i = 0; i < walls.length && !colliding; i++) {
			if ($.testCollision(actor, walls[i])) {
				colliding = true;
			}
		}
		length += 1;
	}
}

function wallCollisionArea(item, walls) {
	var area = 0;
	for (var i = 0; i < walls.length; i++) {
		wall = walls[i];
		area += $.collisionArea(item, wall);
	}
	return area;
}
/*
 * Viewport is the Canvas window into a larger world.
 */
$.Viewport = function (width, height, worldWidth, worldHeight) {
	this.width = width;
	this.height = height;
	this.boundaryx = Math.floor(width / 4);
	this.boundaryy = Math.floor(height / 4);
	this.worldWidth = worldWidth;
	this.worldHeight = worldHeight;
	this.left = 0;
	this.top = 0;
};

$.Viewport.prototype.draw = function (image) {
	$.context.drawImage(image.canvas, image.left - this.left, image.top - this.top);
};

$.Viewport.prototype.scrollTo = function (x, y) {
	var ox = this.left,
	    oy = this.top,
	    bx = this.boundaryx,
	    by = this.boundaryy;

	if (x <= bx) { this.left = 0; }
	else if (x + bx > this.worldWidth) { this.left = this.worldWidth - this.width; }
	else if (x < ox + bx) { this.left = x - bx; }
	else if (x > ox + this.width - bx) { this.left = x + bx - this.width; }

	if (y <= by) { this.top = 0; }
	else if (y + by > this.worldHeight) { this.top = this.worldHeight - this.height; }
	else if (y < oy + by) { this.top = y - by; }
	else if (y > oy + this.height - by) { this.top = y + by - this.height; }

	return {x: this.left - ox, y: this.top - oy};
};
$.TiledBackground = function (resource, width, height) {
	var image = $.resource(resource),
	    rx = Math.floor(width / image.width) + 1,
	    ry = Math.floor(height / image.height) + 1;

	this.tileWidth = image.width;
	this.tileHeight = image.height;
	this.left = 0;
	this.top = 0;
	this.width = width;
	this.height = height;

	this.canvas = document.createElement("canvas");
	this.canvas.width = this.width + image.width;
	this.canvas.height = this.height + image.height;
	this.context = this.canvas.getContext("2d");
	this.context.fillStyle = "#000";
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

	for (var x = 0; x < rx; x++) {
		for (var y = 0; y < ry; y++) {
			this.context.drawImage(image, x * image.width, y * image.height);
		}
	}
};

$.TiledBackground.prototype.moveTo = function (x, y) {
	this.left = Math.floor(x % this.tileWidth);
	this.top = Math.floor(y % this.tileHeight);
};

$.TiledBackground.prototype.draw = function () {
	$.context.drawImage(this.canvas, -this.left, -this.top);
};
window.Bodies = window.$ = Bodies;
}());
