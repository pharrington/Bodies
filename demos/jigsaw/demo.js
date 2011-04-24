Function.prototype.curry = function () {
	var a = arguments, f = this;

	return function (arg) {
		var args = Array.prototype.slice.call(a);
		args.push(arg);

		return f.apply(window, args);
	};
};

Array.prototype.flatten = function () {
	var result = [],
	    i,
	    len,
	    item,
	    proto = Array.prototype;

	for (i = 0, len = this.length; i < len; i++) {
		item = this[i];
		if (Object.prototype.toString.call(item) === "[object Array]") {
			proto.push.apply(result, proto.flatten.call(item));
		} else {
			result.push(item);
		}
	}
	return result;
};

Array.prototype.min = function () {
	return Math.min.apply(null, this.flatten());
};

Array.prototype.max = function () {
	return Math.max.apply(null, this.flatten());
};

Array.prototype.last = function () {
	return this[this.length-1];
};

Array.prototype.copy = function () {
	return this.map(function (val) {
		return (typeof val === "object") ? Object.prototype.copy.call(val) : val;
	});
};

Object.prototype.first = function () {
	var k, v;
	for (k in this) {
		if (this.hasOwnProperty(k)) {
			v = this[k];
			break;
		}
	}
	return !v ? null : [k, v];
};

Object.prototype.copy = function () {
	var o = new this.constructor(),
	    val;
	for (property in this) {
		if (!this.hasOwnProperty(property)) { continue; }

		val = this[property];
		if (typeof val === "object") {
			o[property] = Object.prototype.copy.call(val);
		} else {
			o[property] = val;
		}
	};
	return o;
};

function pointStr(p) {
	return p.x + "_" + p.y;
}

/* the first step to any program is to define the global variables */
var Configuration = {
	width: 800,
	height: 700,
	bgcolor: "#aaa",
	rotate: true,
	/* please don't do bad things with my api key :( */
	cellSizes: [100, 150, 200],
	flickrKey: "dd8f94de8e3c2a2f76cd087ffc4b6020"
	},
	selectedPiece,
	stack;

function random(low, high) {
	return Math.random() * (high - low) + low;
}

function distance(p1, p2) {
	var x1 = p1.x, x2 = p2.x,
	    y1 = p1.y, y2 = p2.y,
	    dx2 = (x1 - x2) * (x1 - x2),
	    dy2 = (y1 - y2) * (y1 - y2);
	return Math.sqrt(dx2 + dy2);
}

function flickrURL(photo, size) {
	size = size ? "_" + size : "";
	return "http://farm" + photo.farm +
		".static.flickr.com/" + photo.server + "/" +
		photo.id + "_" +
		photo.secret + 
		size + ".jpg";
}

function fetchImages() {
	ajax("http://api.flickr.com/services/rest/", {
		method: "flickr.interestingness.getList",
		api_key: Configuration.flickrKey,
		format: "json",
		per_page: 24
	});
}

function jsonFlickrApi(response) {
	var imageList = "",
	    first;
	response.photos.photo.forEach(function (photo) {
		var url = flickrURL(photo, "z"),
		    small = flickrURL(photo, "s");
		imageList += "<li><a href='#'><img src='" + small +
		"' data-url='" + url +
		"'</img></a></li>";
	});

	document.getElementById("pictures").innerHTML = imageList;
	first = document.querySelector("#pictures img");
	first.className = "selected"
	$.loadImage("puzzleSource", first.getAttribute("data-url"));
	$.loaded(init);
}

function plotCorners(length, cells) {
	var cellLength = length / cells,
	    range = cellLength / 20,
	    axis = [],
	    c,
	    i;

	for (i = 0; i <= cells; i++ ) {
		c = i * cellLength;
		if (i && i != cells) { c += random(-range, range); }
		axis.push(c);
	}
	return axis;
}

function plotEdge(x, y, xn, yn, makeEdge) {
	if (y === ~~y && y === yn) {
		return makeEdge(x, y, xn, yn);
	}

	var cellWidth = xn - x,
	    dy = cellWidth / 6,
	    range = cellWidth / 20, rx, ry,
	    xm, x2, y2, x3, y3,
	    cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4,
	    direction;

	rx = random(range, range * 2);
	ry = random(-range/2, range/2);
	xm = x + cellWidth / 2;
	direction = Math.round(Math.random()) ? 1 : -1;
	dy *= direction;
	x2 = xm - cellWidth / 5;
	y2 = y - dy;
	x3 = xm + cellWidth / 5;
	y3 = y - dy;
	cx1 = x2 + rx + range;
	cy1 = y + ry - range / 2.5;
	cx2 = x2;
	cy2 = y2 - dy;
	cx3 = x3;
	cy3 = cy2;
	cx4 = x3 - rx - range;
	cy4 = cy1;

	return makeEdge(x, y, x2, y2, x3, y3, xn, yn,
		 cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4);
}

function makeHedge(x, y, x2, y2, x3, y3, x4, y4, cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4) {
	if (x3 === undefined) {
		return [{x: x, y: y}, {x: x2, y: y}];
	}
	return [{x: x, y: y},
		{x: cx1, y: cy1}, {x: cx1, y: cy1}, {x: x2, y: y2},
		{x: cx2, y: cy2}, {x: cx3, y: cy3}, {x: x3, y: y3},
		{x: cx4, y: cy4}, {x: cx4, y: cy4}, {x: x4, y: y4}];
}

function makeVedge(y, x, y2, x2, y3, x3, y4, x4, cy1, cx1, cy2, cx2, cy3, cx3, cy4, cx4) {
	if (x3 === undefined) {
		return [{x: x, y: y}, {x: x, y: y2}];
	}
	return [{x: x, y: y},
		{x: cx1, y: cy1}, {x: cx1, y: cy1}, {x: x2, y: y2},
		{x: cx2, y: cy2}, {x: cx3, y: cy3}, {x: x3, y: y3},
		{x: cx4, y: cy4}, {x: cx4, y: cy4}, {x: x4, y: y4}];
}

function extremity(edge, vertical) {
	var axis,
	    t1, t2, t3,
	    s1, s2, s3;
	axis = vertical ? "y" : "x";

	if (edge.length === 2) {
		return edge[0][axis];
	}

	s1 = [0, 1, 2, 3].map(function (i) { return edge[i][axis]; });
	t1 = bezierMax(s1);
	s2 = [3, 4, 5, 6].map(function (i) { return edge[i][axis]; });
	t2 = bezierMax(s2);
	s3 = [6, 7, 8, 9].map(function (i) { return edge[i][axis]; });
	t3 = bezierMax(s3);
	return [bezier(t1, s1), bezier(t2, s2), bezier(t3, s3)];
}

function bezier(t, segment) {
	var ti = 1 - t,
	    p0 = segment[0],
	    p1 = segment[1],
	    p2 = segment[2],
	    p3 = segment[3];
	return ti*ti*ti*p0 + 3*t*p1*ti*ti + 3*ti*p2*t*t + t*t*t*p3;
}

function bezierMaxHelper(p0, p1, p2, p3) {
	if (p0 + 3 * p2 === 3 * p1 + p3) {
		return 0.5;
	}

	var a = 6 * (p0 - 2 * p1 + p2),
	    b = p0 - 3 * p1 + 3 * p2 - p3,
	    d = Math.sqrt(a * a + 36 * b * (p1 - p0)),
	    plus = (-a + d) / (-6 * b),
	    minus = (-a - d) / (-6 * b);

	return (plus >= 0 && plus <= 1) ? plus : minus;
}

function bezierMax(segment) {
	var t = bezierMaxHelper.apply(null, segment);
	if (isNaN(t)) {
		t = 1 - bezierMaxHelper.apply(null, segment.copy().reverse());
	}
	return isNaN(t) ? 0 : t;
}

function segment(context, line) {
	var segment;
	if (line.length === 2) {
		segment = line[1];
		context.lineTo(segment.x, segment.y);
	} else {
		for (var i = 1; i <= 7; i += 3) {
			segment = line.slice(i, i + 3);
			context.bezierCurveTo(segment[0].x, segment[0].y, segment[1].x, segment[1].y, segment[2].x, segment[2].y);
		}
	}
}

function Rect(left, top, right, bottom) {
	this.x = left;
	this.y = top;
	this.right = right;
	this.bottom = bottom;
};

function Point(x, y) {
	this.x = x;
	this.y = y;
}

Point.create = function (p) {
	return new Point(p.x, p.y);
};

Point.prototype.equals = function (other) {
	var threshold = .01;

	return Math.abs(this.x - other.x) < threshold &&
		Math.abs(this.y - other.y) < threshold;
};

Point.prototype.add = function (other) {
	return new Point(this.x + other.x, this.y + other.y);
};

Point.prototype.sub = function (other) {
	return new Point(this.x - other.x, this.y - other.y);
};

Point.prototype.rotate = function (theta, pivot) {
	var sin = Math.sin(theta),
	    cos = Math.cos(theta),
	    x = this.x,
	    y = this.y,
	    o,
	    p = this;
	
	if (pivot) {
		o = pivot;
		p = p.sub(o);
	}
	p = new Point(p.x * cos - p.y * sin, p.x * sin + p.y * cos);

	if (pivot) {
		p = p.add(o);
	}

	return p;
};


function Jigsaw(width, height, cellSize) {
	var cx = width / cellSize,
	    cy  = height / cellSize,
	    t, l, r, b, t2, l2,
	    hplots = [], vplots = [],
	    row,
	    cell,
	    x, y;

	/* Try to divide rows and columns evenly, as close to the given cell size as possible */
	hSize = width / Math.ceil(cx);
	vSize = height / Math.ceil(cy);
	this.columns = Math.ceil(width / hSize);
	this.rows = Math.ceil(height / vSize);
	this.width = width;
	this.height = height;
	this.edges = [];

	for (y = 0; y <= this.rows; y++) {
		hplots.push(plotCorners(this.width, this.columns));
	}

	for (x = 0; x <= this.columns; x++) {
		vplots.push(plotCorners(this.height, this.rows));
	}

	for (y = 0; y <= this.rows; y++) {
		row = [];
		for (x = 0; x <= this.columns; x++) {
			cell = {};
			t = vplots[x][y];
			l = hplots[y][x];
			b = vplots[x][y+1];
			r = hplots[y][x+1];
			if (r) {
				t2 = vplots[x+1][y];
				cell.x = plotEdge(l, t, r, t2, makeHedge).map(Point.create);
			}
			if (b) {
				l2 = hplots[y+1][x];
				cell.y = plotEdge(t, l, b, l2, makeVedge).map(Point.create);
			}
			row.push(cell);
		}
		this.edges.push(row);
	}
}

Jigsaw.prototype.rows = 0;
Jigsaw.prototype.columns = 0;

Jigsaw.prototype.cutPiece = function (image, col, row) {
	var cell = this.edges[row][col],
	    left = cell.y,
	    top = cell.x,
	    right = this.edges[row][col+1].y,
	    bottom = this.edges[row+1][col].x;

	return new Piece(image, col, row, top.copy(), right.copy(), bottom.copy().reverse(), left.copy().reverse());
};

function Piece(image, col, row, top, right, bottom, left) {
	var bounds = new Rect,
	    context,
	    corners = {},
	    edges;

	top.newPath = true;
	this.image = image;
	this.offset = new Point(0, 0);
	this.edges = [top, right, bottom, left];

	bounds.x = [left[0].x, left.last().x, extremity(left)].min();
	bounds.y = [top[0].y, top.last().y, extremity(top, true)].min();
	bounds.right = [right[0].x, right.last().x, extremity(right)].max();
	bounds.bottom = [bottom[0].y, bottom.last().y, extremity(bottom, true)].max();
	this.bounds = bounds;

	$.Sprite.call(this, bounds.right - bounds.x, bounds.bottom - bounds.y, {foreign: true});
	
	this.clip();
}

Piece.prototype = new $.Sprite;
Piece.prototype.constructor = Piece;

Piece.prototype.moveTo = function (x, y) {
	$.Sprite.prototype.moveTo.call(this, x, y);
	this.offset.x = this.x;
	this.offset.y = this.y;
};

Piece.prototype.clip = function () {
	var edges,
	    clip,
	    bounds = this.bounds,
	    angle = this.rotation;

	this.oContext.lineWidth = 2.5;
	this.oContext.strokeStyle = "#555";

	this.clipImage(this.oContext, this.edges, true);
	$.Sprite.prototype.copyPixels.call(this);
	$.Sprite.prototype.rotateTo.call(this, this.rotation);

	/* boundary clipping path */
	clip = this.edges.map(function (edge) {
		return edge.map(function (point) {
			return point.sub(bounds);
		});
	});

	this.clipEdges = clip;
	this.updateEdges();
	this.clipImage(this.context, clip);
};

Piece.prototype.rotateTo = function (angle) {
	this.rotation = angle;
	this.clip();
};

Piece.prototype.clipImage = function (context, edges, drawImage) {
	var bounds = this.bounds;

	context.beginPath();
	context.save();

	if (drawImage) {
		context.translate(-bounds.x, -bounds.y);
	} else {
		context.translate(this.halfWidth, this.halfHeight);
		context.rotate(this.rotation);
		context.translate(-this.halfBaseWidth, -this.halfBaseHeight);
	}

	edges.forEach(function (edge) {
		if (edge.newPath) {
			context.moveTo(edge[0].x, edge[0].y);
		}
		segment(context, edge);
	});

	context.closePath();
	context.clip();
	if (drawImage) {
		context.drawImage(this.image, 0, 0);
		context.stroke();
	}

	context.restore();
}

Piece.prototype.updateEdges = function () {
	var angle = this.rotation,
	    offset = this.offset.sub({x: this.dx, y: this.dy}),
	    center = {x: this.halfBaseWidth, y: this.halfBaseHeight};

	this.transformEndpoints = this.edges.map(function (edge) {
		return [edge[0].rotate(angle), edge.last().rotate(angle)];
	});

	this.clipEndpoints = this.clipEdges.map(function (edge) {
		return [edge[0].rotate(angle, center).add(offset),
			edge.last().rotate(angle, center).add(offset)];
	}, this);
};

function collectEndpoints(points, removeDuplicates, edge) {
	var p, p1, p2;

	edge.newPath = false;
	p1 = pointStr(edge[0]);
	p2 = pointStr(edge.last());
	p = points[p2];

	if (removeDuplicates && p && p[p1]) {
		delete p[p1];
	} else {
		if (!points[p1]) { points[p1] = {}; }
		points[p1][p2] = edge;
	}
}

Piece.prototype.merge = function (other) {
	var edges = [],
	    p, p1, p2,
	    points = {};

	this.edges.forEach(collectEndpoints.curry(points, false));
	other.edges.forEach(collectEndpoints.curry(points, true));

	// prune phantom edges
	for (p in points) {
		if (!points[p].first()) { delete points[p]; }
	}

	/* follow the gathered points to create our new edges
	 * we just follow each edge's associated point, and quit when we're back to the first point
	 */

	for (p in points) {
		if (!points.hasOwnProperty(p)) {
			continue;
		}

		p1 = points[p];
		p2 = p1.first();
		p2[1].newPath = true;

		while (p2) {
			/* add this edge, and remove it from our collection of points */
			edges.push(p2[1]);
			delete p1[p2[0]];

			/* if there are no more edges connected to this point, remove it */
			if (!p1.first()) {
				delete points[p];
			}

			/* onto the next point */
			p = p2[0];
			p1 = points[p2[0]];
			p2 = p1 && p1.first();
		}
	}

	this.reset(edges, other);
};

Piece.prototype.reset = function (edges, other) {
	var b = this.bounds,
	    ob = other.bounds;

	b.x = Math.min(b.x, ob.x);
	b.y = Math.min(b.y, ob.y);
	b.right = Math.max(b.right, ob.right);
	b.bottom = Math.max(b.bottom, ob.bottom);
	$.Sprite.prototype.resize.call(this, b.right - b.x, b.bottom - b.y);
	this.moveTo(Math.min(this.x, other.x), Math.min(this.y, other.y));

	this.edges = edges;
	this.clip();
};

Piece.prototype.testPoint = function (point) {
	return this.context.isPointInPath(point.x - this.x, point.y - this.y);
};

/* not really a stack, just a convenient way to draw the most recently selected pieces last */
function DrawStack() {
	this.items = [];
}

DrawStack.prototype.moveToTop = function (item) {
	var items = this.items,
	    index = items.indexOf(item);
	if (index === -1 || (index === items.length - 1)) { return; }
	items.splice(index, 1);
	items.push(item);
};

DrawStack.prototype.push = function (item) {
	this.items.push(item);
};

DrawStack.prototype.draw = function () {
	var items = this.items;
	for (var i = 0; i < items.length; i++) {
		items[i].draw();
	}
};

function clear() {
	$.context.fillRect(0, 0, $.width, $.height);
}

function redraw() {
	clear();
	stack.draw();
}

function snap(piece, others) {
	var i, j, k,
	    o, other,
	    edge1, edge2,
	    endpoints1, endpoints2,
	    threshold = 10;

	/* TODO: less horrid snap detection algorithm */
	for (i = 0; i < piece.edges.length; i++) {
		edge1 = piece.transformEndpoints[i];
		endpoints1 = piece.clipEndpoints[i];

		for (j = 0; j < others.length; j++) {
			o = others[j];

			for (k = 0; k < o.edges.length; k++) {
				edge2 = o.transformEndpoints[k];
				endpoints2 = o.clipEndpoints[k];

				if (edge1[0].equals(edge2.last()) &&
				    edge2[0].equals(edge1.last()) && 
				    distance(endpoints1[0], endpoints2.last()) < threshold &&
				    distance(endpoints2[0], endpoints1.last()) < threshold) {
					o.merge(piece, k, i);
					stack.moveToTop(o);
					stack.items.deleteItem(piece);
					return;
				}
			}
		}
	}
}


function cutImage(image) {
	var sizeIndex = parseInt(document.querySelector("input:checked").value),
	    jigsaw = new Jigsaw(image.width, image.height, Configuration.cellSizes[sizeIndex]),
	    pieces = [], piece;

	for (var y = 0; y < jigsaw.rows; y++) {
		for (var x = 0; x < jigsaw.columns; x++) {
			piece = jigsaw.cutPiece(image, x, y);
			piece.moveTo(random(0, $.width - piece.width), random(0, $.height - piece.height));
			Configuration.rotate && piece.rotateTo(Math.PI / 2 * ~~random(0, 4));
			piece.updateEdges();
			piece.draw();
			pieces.push(piece);
		}
	}
	return pieces;
}


function init() {
	var image = $.resource("puzzleSource"),
	    pieces,
	    piece,
	    jigsaw,
	    x, y;

	$.loaded(function () {
		clear();
		pieces = cutImage(image);
		stack = new DrawStack();
		for (var i = 0; i < pieces.length; i++) {
			stack.push(pieces[i]);
		}
	});
}

function redrawRegion(clip) {
	$.context.save();
	$.context.beginPath();
	$.context.rect(clip.x, clip.y, clip.right - clip.x, clip.bottom - clip.y);
	$.context.clip();
	$.context.fill();

	stack.items.filter(function (piece) {
		return !(piece.x > clip.right ||
			 piece.right < clip.left ||
			 piece.y > clip.bottom ||
			 piece.bottom < clip.top);
	}).forEach(function (piece) {
		piece.draw();
	});
	$.context.restore();
}

window.addEventListener("load", function () {
	$.init("board", Configuration.width, Configuration.height);
	$.context.fillStyle = Configuration.bgcolor;
	$.context.fillRect(0, 0, $.width, $.height);
	fetchImages();

	$.mouseDown(function (x, y, e) {
		var point = new Rect(x, y, x+1, y+1),
		    items = stack.items,
		    moveable;

		for (var j = items.length - 1; j >= 0; j--) {
			if (items[j].testPoint(point)) {
				// select this piece
				selectedPiece = items[j];

				// rotate piece on right click
				if (e.button === 2) {
					selectedPiece.rotate(Math.PI / 2);
					stack.moveToTop(selectedPiece);
					redraw();
					selectedPiece = null;
					return;
				}
				selectedPiece.mx = x - selectedPiece.x;
				selectedPiece.my = y - selectedPiece.y;
				stack.moveToTop(selectedPiece);
				redrawRegion(selectedPiece);
				return;
			}
		}
	});

	$.mouseUp(function (x, y) {
		if (!selectedPiece) { return; }

		selectedPiece.updateEdges();
		snap(selectedPiece, stack.items);
		redraw();
		selectedPiece.mx = 0;
		selectedPiece.my = 0;
		selectedPiece = null;
	});

	$.mouseMove(function (x, y) {
		var clip;

		if (!selectedPiece) { return; }

		clip = new Rect;
		clip.x = selectedPiece.x;
		clip.y = selectedPiece.y;
		clip.right = selectedPiece.right;
		clip.bottom = selectedPiece.bottom;
		
		selectedPiece.moveTo(x - selectedPiece.mx, y - selectedPiece.my);
		clip.x = Math.floor(Math.min(clip.x, selectedPiece.x));
		clip.y = Math.floor(Math.min(clip.y, selectedPiece.y));
		clip.right = Math.ceil(Math.max(clip.right, selectedPiece.right));
		clip.bottom = Math.ceil(Math.max(clip.bottom, selectedPiece.bottom));

		redrawRegion(clip);
	});

	$.start();

	document.getElementById("reset").addEventListener("click", init, false);

	document.getElementById("pictures").addEventListener("click", function (e) {
		var preview,
		    url,
		    element,
		    previous;
		if (preview = e.target.src) {
			element = e.target;
			previous = document.querySelector(".selected");
			if (element !== previous) {
				if (previous) {
					previous.className = previous.className.replace(/\s*\bselected\b\s*/, "");
				}
				element.className += " selected";
				url = element.getAttribute("data-url");
				url && $.loadImage("puzzleSource", url);
			}
		}
	}, false);
}, false);
