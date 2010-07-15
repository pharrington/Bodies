function Bodies(width, height) {
	var selector = "field",
	    canvas = null,
	    context = null,
	    callbacks = {},
	    images = {},
	    loadingImages = 0;

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
		loadingImages++;
		image.onload = function () {
			loadingImages--;
		}
		image.src = path;
		images[name] = image;
	};

	Bodies.resource = function (name) {
		return images[name];
	};

	Bodies.loaded = function (callback) {
		if (loadingImages == 0) {
			callback();
		} else {
			window.setTimeout(function() {
				Bodies.loaded(callback)
			}, 100);
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
		var point = Bodies.coordinates(e);

		if (callbacks["mousemove"]) {
			var mmCallbacks = callbacks["mousemove"];
			for (var i = 0; i < mmCallbacks.length; i++) {
				mmCallbacks[i](point.x, point.y);
			}
		}
	}

	Bodies.refresh = function(callback) {
		callbacks.refresh = callback;
		window.setInterval(reDraw, 25);
	};

	Bodies.mouseMove = function (callback) {
		if (callbacks["mousemove"] === undefined) {
			callbacks["mousemove"] = [];
		}
		callbacks["mousemove"].push(callback);
	};

	Bodies.testCollision = function testCollision(s1, s2) {
		var left,
		    top,
		    width,
		    height,
		    pixels1, pixels2,
		    offset1, offset2,
		    dataWidth1, dataWidth2,
		    s1Width = s1.width,
		    s2Width = s2.width,
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
		width = (Math.min(s1Right, s2Right) - left) * 4 // four ints per pixel;
		height = Math.min(s1Bottom, s2Bottom) - top;

		pixels1 = s1.pixels;
		pixels2 = s2.pixels;

		offset1 = (((top - s1.top) * s1Width) + (left - s1Left)) * 4 + 3;
		offset2 = (((top - s2.top) * s2Width) + (left - s2Left)) * 4 + 3;
		dataWidth1 = s1Width * 4;
		dataWidth2 = s2Width * 4;

		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x += 4) {
				if ((pixels1[offset1 + x] == 255) && (pixels2[offset2 + x] == 255)) {
					return true;
				}
			}
			offset1 += dataWidth1;
			offset2 += dataWidth2;
		}
		return false;
	};

	Bodies.Sprite = function (imageName) {
		var image = Bodies.resource(imageName);

		this.x = null;
		this.y = null;
		this.left = null;
		this.top = null;
		this.right = null;
		this.bottom = null;
		this.imageData = null;

		this.canvas = document.createElement("canvas"),
		this.context = this.canvas.getContext("2d");
		this.canvas.width = this.width = image.width;
		this.canvas.height = this.height = image.height;
		this.context.drawImage(image, 0, 0);
		this.imageData = this.context.getImageData(0, 0, this.width, this.height);
		this.pixels = this.imageData.data;

		this.moveTo = function (x, y) {
			this.x = x;
			this.y = y;
			this.left = Math.floor(x);
			this.top = Math.floor(y);
			this.right = this.left + this.width;
			this.bottom = this.top + this.height;
		};

		this.draw = function () {
			context.drawImage(this.canvas, this.x, this.y);
		};
	};

	Bodies.CollisionTrie = function (x, y, r, b) {
		this.isPartitioned = false;
		this.nodes = null;
		this.maxItems = 20;
		this.maxDepth = 5;
		this.items = [];
		this.left = x;
		this.top = y;
		this.right = r;
		this.bottom = b;

		this.insert = function(item, depth) {
			// lets bail
			if (!this.contains(item.x, item.y, item.right, item.bottom)) {
				return;
			}

			if (depth === undefined) {
				depth = 0;
			}

			if (this.isPartitioned &&
			    !this.stradlesNodes(item)) {
				for (var i = 0; i < 4; i++) {
					this.nodes[i].insert(item, depth+1);
				}
				return;
			}

			// lets split
			if (!this.isPartitioned &&
			    (this.items.length >= this.maxItems)  &&
			    !this.stradlesNodes(item) &&
			    (depth < this.maxDepth)) {
				this.createNodes();
				for (var i = 0; i < 4; i++) {
					this.nodes[i].insert(item, depth+1);
				}
				return;
			}

			// add the item to this node
			item.collisionNode = this;
			this.items.push(item);
		};

		this.createNodes = function() {
			var cX = (this.left + this.right) / 2,
			    cY = (this.top + this.bottom) / 2;

			this.nodes = [];
			this.nodes[0] = new Bodies.CollisionTrie(this.left, this.top, cX, cY);
			this.nodes[1] = new Bodies.CollisionTrie(cX, this.top, this.right, cY);
			this.nodes[2] = new Bodies.CollisionTrie(this.left, cY, cX, this.bottom);
			this.nodes[3] = new Bodies.CollisionTrie(cX, cY, this.right, this.bottom);
			this.redistribute();
			this.isPartitioned = true;
		};

		this.redistribute = function () {
			var i = 0,
			    item = this.items[i];

			while (item) {
				if (!this.stradlesNodes(item)) {
					this.deleteItem(item);
					this.nodes[0].insert(item);
					this.nodes[1].insert(item);
					this.nodes[2].insert(item);
					this.nodes[3].insert(item);
				} else {
					i++;
				}
				item = this.items[i];
			}
		};

		this.stradlesNodes = function(item) {
			var cX = (this.left + this.right) / 2,
			    cY = (this.top + this.bottom) / 2;

			return (((item.x < cX) && (item.right > cX)) ||
				((item.y < cY) && (item.bottom > cY)));
		};

		this.queryNodes = function(rect, nodes) {
			var x = rect.x,
			    y = rect.y,
			    r = rect.right,
			    b = rect.bottom;

			if (this.contains(x, y, r, b)) {
				nodes.push(this);
			}
			
			if (this.isPartitioned) {
				for (var i = 0; i < 4; i++) {
					this.nodes[i].queryNodes(rect, nodes);
				}
			}
		};

		this.contains = function(x, y, r, b) {
			return ((x >= this.left) &&
				(r <= this.right) &&
				(y >= this.top) &&
				(b <= this.bottom));
		};

		this.deleteItem = function (item) {
			var index;
			if ((index = this.items.indexOf(item)) == -1) {
				return;
			}
			this.items.splice(index, 1);
		};
	};

	initCanvas();
	canvas.addEventListener("mousemove", mouseMove, false);
};
