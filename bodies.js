/* a miserable pile of Javascript
 *
 */

function Bodies(width, height) {
	var selector = "field",
	    canvas = null,
	    context = null,
	    callbacks = {},
	    images = {},
	    loadingImages = 0;

	Bodies.Keys = [];

	function initCanvas() {
		canvas = document.getElementById(selector);
		canvas.width = width;
		canvas.height = height;
		Bodies.context = context = canvas.getContext("2d");
	}

	function reDraw() {
		callbacks.refresh(context);
	}

	Bodies.loadImage = function (name, path) {
		var image = new Image();
		loadingImages += 1;
		image.onload = function () {
			loadingImages -= 1;
		};
		image.src = path;
		images[name] = image;
	};

	Bodies.resource = function (name) {
		return images[name];
	};

	Bodies.loaded = function (callback) {
		if (loadingImages) {
			setTimeout(function () {
				Bodies.loaded(callback);
			}, 100);
		} else {
			callback();
		}
	};

	Bodies.coordinates = function (e) {
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

		x -= canvas.offsetLeft;
		y -= canvas.offsetTop;
		return {x: x, y: y};
	};

	function mouseMove(e) {
		var point = Bodies.coordinates(e),
		    mmCallbacks;

		if (callbacks.mousemove) {
			mmCallbacks = callbacks.mousemove;
			for (var i = 0; i < mmCallbacks.length; i++) {
				mmCallbacks[i](point.x, point.y);
			}
		}
	}

	function keyDown(e) {
		Bodies.Keys[e.keyCode] = true;
	}

	function keyUp(e) {
		Bodies.Keys[e.keyCode] = false;
	}

	Bodies.refresh = function (callback) {
		callbacks.refresh = callback;
		setInterval(reDraw, 25);
	};

	Bodies.mouseMove = function (callback) {
		if (!callbacks.mousemove) {
			callbacks.mousemove = [];
		}
		callbacks.mousemove.push(callback);
	};

	Bodies.testCollision = function testCollision(s1, s2) {
		if (s1 === s2) { return false; }
		var left,
		    top,
		    width,
		    height,
		    pixels1, pixels2,
		    offset1, offset2,
		    dataWidth1, dataWidth2,
		    s1Width, s2Width,
		    s1Left = s1.left - s1.dx, s1Right = s1.right - s1.dx,
		    s1Top = s1.top - s1.dy, s1Bottom = s1.bottom - s1.dy,
		    s2Left = s2.left - s2.dx, s2Right = s2.right - s2.dx,
		    s2Top = s2.top - s2.dy, s2Bottom = s2.bottom - s2.dy;

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
	};

	Bodies.Sprite = function (imageName) {
		var image = Bodies.resource(imageName),
		    maxLength,
		    theta;

		this.x = null;
		this.y = null;
		this.left = null;
		this.top = null;
		this.right = null;
		this.bottom = null;
		this.rotation = 0;
		this.dx = this.dy = 0;
		this.imageOffsetX = 0;
		this.imageOffsetY = 0;

		this.canvas = document.createElement("canvas");
		this.context = this.canvas.getContext("2d");
		this.baseCanvas = document.createElement("canvas");
		this.baseContext = this.baseCanvas.getContext("2d");
		this.baseCanvas.width = this.baseWidth = image.width;
		this.baseCanvas.height = this.baseHeight = image.height;
		this.halfBaseWidth = this.baseWidth / 2;
		this.halfBaseHeight = this.baseHeight / 2;


		// the actual image canvas will be larger, to handle rotations
		maxLength = Math.sqrt(Math.pow(image.width, 2) + Math.pow(image.height, 2));
		this.width = this.height = this.imageWidth = this.imageHeight = Math.floor(maxLength);
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.dx = Math.floor(this.width / 2 - this.halfBaseWidth);
		this.dy = Math.floor(this.height / 2 - this.halfBaseHeight);

		this.baseContext.drawImage(image, 0, 0);
		this.context.drawImage(image, this.dx, this.dy);
		this.imageData = this.context.getImageData(0, 0, this.width, this.height);
		this.pixels = this.imageData.data;
		this.scanWidth = this.width * 4;

		this.moveTo = function (x, y) {
			this.x = x;
			this.y = y;
			this.left = Math.floor(x);
			this.top = Math.floor(y);
			this.right = this.left + this.width;
			this.bottom = this.top + this.height;
		};

		this.rotateTo = function (angle) {
			var newWidth, newHeight,
			    baseWidth = this.baseWidth, baseHeight = this.baseHeight,
			    halfBaseWidth = this.halfBaseWidth, halfBaseHeight = this.halfBaseHeight,
			    sinTheta, cosTheta,
			    oX, oY;

			this.rotation = angle;

			oX = this.width / 2;
			oY = this.height / 2;

			this.context.clearRect(0, 0, this.width, this.height);
			this.context.save();
			this.context.translate(oX, oY);
			this.context.rotate(this.rotation);
			this.context.translate(-halfBaseWidth, -halfBaseHeight);
			this.context.drawImage(this.baseCanvas, 0, 0);
			this.context.restore();

			// ImageData/CanvasPixelArray allocations get out of control with the next line.
			// The alternative would be to create and store a seperate collision mask for the sprite, and manually rotate that :(
			this.imageData = this.context.getImageData(0, 0, this.width, this.height);
			this.pixels = this.imageData.data;
		}

		this.rotate = function (angle) {
			this.rotation += angle;
			this.rotateTo(this.rotation);
		};

		this.draw = function () {
			context.drawImage(this.canvas, this.x - this.dx, this.y - this.dy);
		};
	};

	Bodies.CollisionTrie = function (x, y, r, b) {
		this.isPartitioned = false;
		this.nodes = null;
		this.maxItems = 15;
		this.maxDepth = 3;
		this.items = [];
		this.left = x;
		this.top = y;
		this.right = r;
		this.bottom = b;

		this.insert = function (item, depth) {
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

		this.createNodes = function () {
			var cX = (this.left + this.right) / 2,
			    cY = (this.top + this.bottom) / 2,
			    nodes = [];

			nodes[0] = new Bodies.CollisionTrie(this.left, this.top, cX, cY);
			nodes[1] = new Bodies.CollisionTrie(cX, this.top, this.right, cY);
			nodes[2] = new Bodies.CollisionTrie(this.left, cY, cX, this.bottom);
			nodes[3] = new Bodies.CollisionTrie(cX, cY, this.right, this.bottom);
			this.nodes = nodes;
			this.redistribute();
			this.isPartitioned = true;
		};

		this.redistribute = function () {
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

		this.stradlesNodes = function (item) {
			var cX = (this.left + this.right) / 2,
			    cY = (this.top + this.bottom) / 2;

			return (((item.x < cX) && (item.right > cX)) ||
				((item.y < cY) && (item.bottom > cY)));
		};

		this.queryNodes = function (rect, nodes) {
			var x = rect.x,
			    y = rect.y,
			    r = rect.right,
			    b = rect.bottom;

			if (this.contains(x, y, r, b)) {
				nodes[nodes.length] = this;
			}
			
			if (this.isPartitioned) {
				for (var i = 0; i < 4; i++) {
					this.nodes[i].queryNodes(rect, nodes);
				}
			}
		};

		this.contains = function (x, y, r, b) {
			return ((x >= this.left) &&
				(r <= this.right) &&
				(y >= this.top) &&
				(b <= this.bottom));
		};

		this.deleteItem = function (item) {
			var index,
			    items = this.items;
			if ((index = items.indexOf(item)) === -1) {
				return;
			}
			items.splice(index, 1);
		};
	};

	Bodies.World = function (imageName) {
		var image = Bodies.resource(imageName),
		    pixels,
		    region,
		    offset,
		    width, height;

		this.resolution = 20;
		this.width = image.width;
		this.height = image.height;
		this.scanWidth = image.width * 4;
		this.rows = Math.ceil(this.height / this.resolution);
		this.columns = Math.ceil(this.width / this.resolution);
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.context = this.canvas.getContext("2d");
		this.context.drawImage(image, 0, 0);
		this.imageData = this.context.getImageData(0, 0, this.width, this.height);
		this.pixels = this.imageData.data;
		this.quadtree = new Bodies.CollisionTrie(0, 0, this.width, this.height);
		this.actors = [];

		// check the pixels to see if we need to add this sector to the collision map
		for (var y = 0; y < this.height; y += this.resolution) {
			height = (y > this.height - this.resolution) ? this.height - y : this.resolution;
			for (var x = 0; x < this.width; x += this.resolution) {
				width = (x > this.width - this.resolution) ? this.width - x : this.resolution;
				if (isOpaque(this.pixels, this.scanWidth, x, y, width, height)) {
					region = {};
					region.dx = region.dy = 0;
					region.x = x;
					region.y = y;
					region.width = width;
					region.height = height;
					region.right = region.x + region.width;
					region.bottom = region.y + region.height;
					region.imageOffsetX = x;
					region.imageOffsetY = y;
					region.imageWidth = image.width;
					region.imageHeight = image.height;
					region.scanWidth = this.scanWidth;
					region.pixels = this.pixels;
					this.quadtree.insert(region);
				}
			}
		}

		this.draw = function () {
			context.drawImage(this.canvas, 0, 0);
		};

		this.insert = function (item) {
			this.actors.push(item);
			this.quadtree.insert(item);
		};

		this.update = function () {
                	for (var i = 0; i < this.actors.length; i++) {
                        	var actor = this.actors[i],
                            	region = actor.collisionNode,
                            	collisionRegions = [];
	
                        	// update quadtree
                        	this.quadtree.queryNodes(actor, collisionRegions);
                        	if (collisionRegions[collisionRegions.length-1] != region) {
                                	region.deleteItem(actor);
                                	this.quadtree.insert(actor);
                        	}
	
                        	// collide
                        	for (var j = 0; j < collisionRegions.length; j++ ) {
                                	var r = collisionRegions[j];
                                	for (var k = 0; k < r.items.length; k++) {
                                        	var other = r.items[k];
                                        	if (Bodies.testCollision(actor, other)) {
							alert([other.x, other.y, other.right, other.bottom].join(", "));
                                        	}
                                	}
                        	}
                	}
 
		};
	};

	function isOpaque(pixels, scanWidth, x, y, w, h) {
		offset = x * y * 4 + 3;
		for (var i = 0; i < h; i++) {
			for (var j = 0; j < w * 4; j += 4) {
				if (pixels[offset + j] === 255) {
					return true
				}
			}
			offset += scanWidth;
		}
		return false;
	}

	initCanvas();
	canvas.addEventListener("mousemove", mouseMove, false);
	addEventListener("keydown", keyDown, false);
	addEventListener("keyup", keyUp, false);
}
