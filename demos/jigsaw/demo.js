Array.prototype.flatten = function () {
	var result = [],
	    i,
	    len,
	    item;
	for (i = 0, len = this.length; i < len; i++) {
		item = this[i];
		if (Object.prototype.toString.call(item) === "[object Array]") {
			Array.prototype.push.apply(result, item.flatten());
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
		return (typeof val === "object" && typeof val.copy === "function") ? val.copy() : val;
	});
};

Object.prototype.equals = function (other) {
	for (p in this) {
		if (this.hasOwnProperty(p) && other.hasOwnProperty(p)) {
			this[p] !== other[p] && return false;
		}
	}
	return true;
};

Object.prototype.copy = function () {
	var o = this.constructor(),
	    val;
	for (property in this) {
		val = this[property];
		if (typeof val === "object" && typeof val.copy === "function") {
			o[property] = val.copy();
		} else if (this.hasOwnProperty(property)) {
			o[property] = val;
		}
	};
	return o;
};

function Point(x, y) {
	this.x = x;
	this.y = y;
}

Point.prototype.add = function (other) {
	return new Point(this.x + other.x, this.y + other.y);
}

/* the first step to any program is to define the global variables */
var Configuration = {
	width: 1000,
	height: 800,
	bgcolor: "#aaa",
	/* please don't do bad things with my api key :( */
	flickrKey: "dd8f94de8e3c2a2f76cd087ffc4b6020"
	},
	ctree,
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

function Rect(left, top, right, bottom) {
	this.x = left;
	this.y = top;
	this.right = right;
	this.bottom = bottom;
};

function plotCorners(length, cells) {
	var cellLength = length / cells,
	    range = cellLength / 20,
	    axis = [],
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

function Jigsaw(width, height) {
	var cellSize = 150,
	    cx = width / cellSize,
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
				cell.x = plotEdge(l, t, r, t2, makeHedge);
			}
			if (b) {
				l2 = hplots[y+1][x];
				cell.y = plotEdge(t, l, b, l2, makeVedge);
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

	return new Piece(image, col, row, top, right, bottom.copy().reverse(), left.copy().reverse());
};

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

function bezierMax1(p0, p1, p2, p3) {
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
	var t = bezierMax1.apply(null, segment);
	if (isNaN(t)) {
		t = 1 - bezierMax1.apply(null, segment.copy().reverse());
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

function clipImage(context, bounds, top, right, bottom, left, image) {
	context.beginPath();
	context.save();
	image && context.translate(-bounds.x, -bounds.y);
	context.moveTo(top[0].x, top[0].y);
	segment(context, top);
	segment(context, right);
	segment(context, bottom);
	segment(context, left);
	context.closePath();
	context.clip();
	if (image) {
		context.drawImage(image, 0, 0);
		context.restore();
	}
}

function Piece(image, col, row, top, right, bottom, left) {
	var bounds = new Rect,
	    context,
	    corners = {},
	    edges;

	this.offset = new Point(0, 0);
	this.edges = [top, right, bottom, left];

	bounds.x = [left[0].x, left.last().x, extremity(left)].min();
	bounds.y = [top[0].y, top.last().y, extremity(top, true)].min();
	bounds.right = [right[0].x, right.last().x, extremity(right)].max();
	bounds.bottom = [bottom[0].y, bottom.last().y, extremity(bottom, true)].max();
	this.bounds = bounds;

	$.Sprite.call(this, bounds.right - bounds.x, bounds.bottom - bounds.y, {foreign: true});

	/* clip */
	clipImage(this.oContext, bounds, top, right, bottom, left, image);
	$.Sprite.prototype.copyPixels.call(this);

	/* boundary clipping path */
	edges = this.edges.map(function (edge) {
		edge = edge.copy();
		edge.forEach(function (point) {
			point.x -= bounds.x;
			point.y -= bounds.y;
		});
		return edge;
	});
	clipImage(this.context, bounds, edges[0], edges[1], edges[2], edges[3]);
}

Piece.prototype = new $.Sprite;
Piece.prototype.constructor = Piece;

Piece.prototype.moveTo = function (x, y, independent) {
	var dx, dy,
	    corner = this.corners,
	    group;

	this.offset.x = x;
	this.offset.y = y;
	$.Sprite.prototype.moveTo.call(this, x, y);
};

Piece.prototype.merge = function (other) {
	var edges = [],
	    edge, oedge,
	    shared {}, oshared = {},
	    i, j;

	/* find the indices of all edges shared between both pieces */
	for (i = 0; i < this.edges.length; i++) {
		edge = this.edges[i];

		for (j = 0; j < other.edges.length; j++) {
			oedge = other.edges[end];

			if (edge[0].equals(oedge.last()) && edge.last().equals(oedge[0])) {
				shared[i] = true;
				oshared[j] = true;
			}
		}
	}

	/* create a new set of edges thats the symmetric difference between the current to sets
	 * the edges from "other" are inserted where "this" edges are removed
	 */
	i = j = 0;
	while (this.edges.length && other.edges.length) {
		for (; !(i in shared); i++) {
			edges.push(this.edges.splice(i, 1)[0]);
		}
		for (; i in shared; i++) {
			this.edges.splice(i, 1);
		}

		for (; !(j in oshared); j++) {
			edges.push(other.edges.splice(i, 1)[0]);
		}
		for (; j in oshared; j++) {
			other.edges.splice(j, 1);
		}
	}
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
	    pedge, oedge,
	    pstart, pend,
	    ostart, oend,
	    threshold = 10;

	/* TODO: less horrid snap detection algorithm */
	for (i = 0; i < piece.edges.length; i++) {
		pedge = piece.edges[i];
		pstart = piece.offset.add(pedge[0]);
		pend = piece.offset.add(pedge.last());
		for (j = 0; j < others.length; j++) {
			o = others[j];
			other = o.edges;
			for (k = 0; k < other.length; k++) {
				oedge = other[k];
				ostart = o.offset.add(oedge[0]);
				oend = o.offset.add(oedge.last());
				if (distance(pstart, oend) < threshold && distance(pend, ostart) < threshold) {
					o.merge(piece, k, i);
					return;
				}
			}
		}
	}
}


function cutImage(image) {
	var jigsaw = new Jigsaw(image.width, image.height),
	    pieces = [], piece;

	for (var y = 0; y < jigsaw.rows; y++) {
		for (var x = 0; x < jigsaw.columns; x++) {
			piece = jigsaw.cutPiece(image, x, y);
			piece.moveTo(random(0, $.width - piece.width), random(0, $.height - piece.height));
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

	clear();
	pieces = cutImage(image);
	ctree = new $.Quadtree(-250, -250, Configuration.width + 250, Configuration.height + 250);
	stack = new DrawStack();
	for (var i = 0; i < pieces.length; i++) {
		ctree.insert(pieces[i]);
		stack.push(pieces[i]);
	}
}

function redrawRegion(clip) {
	$.context.save();
	$.context.beginPath();
	$.context.rect(clip.x, clip.y, clip.right - clip.x, clip.bottom - clip.y);
	$.context.clip();
	$.context.fill();
	ctree.queryItems(clip).sort(function (a, b) {
		var items = stack.items;
		return items.indexOf(a) < items.indexOf(b) ? -1 : 1;
	}).filter(function (piece) {
		return !(piece.x > clip.right ||
			 piece.right < clip.left ||
			 piece.y > clip.bottom ||
			 piece.bottom < clip.top);
	}).forEach(function (piece) {
		piece.draw();
	});
	$.context.restore();
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
		per_page: 8
	});
}

function jsonFlickrApi(response) {
	var imageList = "";
	response.photos.photo.forEach(function (photo) {
		var url = flickrURL(photo, "z"),
		    small = flickrURL(photo, "s");
		imageList += "<li><a href='#'><img src='" + small +
		"' data-url='" + url +
		"'</img></a></li>";
	});
	document.getElementById("pictures").innerHTML = imageList;
	$.loadImage("puzzleSource", document.querySelector("#pictures img").getAttribute("data-url"));
	$.loaded(init);
}

window.addEventListener("load", function () {
	$.init("board", Configuration.width, Configuration.height);
	$.context.fillStyle = Configuration.bgcolor;
	$.context.fillRect(0, 0, $.width, $.height);
	fetchImages();

	$.mouseDown(function (x, y) {
		var point = new Rect(x, y, x+1, y+1),
		    items,
		    moveable;
		items = ctree.queryItems(point);
		items.sort(function (a, b) {
			var items = stack.items;
			return items.indexOf(a) > items.indexOf(b) ? -1 : 1
		});
		for (var j = 0; j < items.length; j++) {
			if (items[j].testPoint(point)) {
				// select this piece
				selectedPiece = items[j];
				selectedPiece.mx = x - selectedPiece.x;
				selectedPiece.my = y - selectedPiece.y;
				if (selectedPiece.group) {
					selectedPiece.group.items.forEach(function (piece) {
						stack.moveToTop(piece);
					});
				} else {
					stack.moveToTop(selectedPiece);
				}
				redraw();
				break;
			}
		}
	});

	$.mouseUp(function (x, y) {
		var group;
		if (!selectedPiece) { return; }
		group = selectedPiece.group;
		if (group) {
			groupSnap(group, ctree);
		} else {
			snap(selectedPiece, ctree.queryItems(selectedPiece));
		}
		redraw();
		selectedPiece.mx = 0;
		selectedPiece.my = 0;
		selectedPiece = null;
	});

	$.mouseMove(function (x, y) {
		var node,
		    group,
		    pieces,
		    dirty,
		    clip;

		if (!selectedPiece) { return; }

		clip = new Rect;
		group = selectedPiece.group;
		pieces = group ? group.items : [selectedPiece];
		dirty = group ? group : selectedPiece;
		clip.x = dirty.x;
		clip.y = dirty.y;
		clip.right = dirty.right + 1;
		clip.bottom = dirty.bottom + 1;
		
		pieces.forEach(function (piece) {
			node = selectedPiece.collisionNode;
			if (!node.contains(selectedPiece)) {
				node.deleteItem(selectedPiece);
				ctree.insert(selectedPiece);
			}
			selectedPiece.moveTo(x - selectedPiece.mx, y - selectedPiece.my);
		});
		clip.x = Math.min(clip.x, dirty.x);
		clip.y = Math.min(clip.y, dirty.y);
		clip.right = Math.max(clip.right, dirty.right);
		clip.bottom = Math.max(clip.bottom, dirty.bottom);

		redraw();
		//redrawRegion(clip);
	});

	$.start();

	document.getElementById("reset").addEventListener("click", init, false);

	document.getElementById("pictures").addEventListener("click", function (e) {
		var preview,
		    name,
		    ext,
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
				/*
				name = preview.slice(preview.lastIndexOf("/")+1, preview.lastIndexOf("-sq"));
				ext = preview.slice(preview.lastIndexOf("."));
				*/
				$.loadImage("puzzleSource", element.getAttribute("data-url"));
			}
		}
	}, false);
}, false);
