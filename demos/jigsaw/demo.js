Array.prototype.last = function () {
	return this[this.length-1];
};

Array.prototype.copy = function () {
	return this.map(function (val) {
		return (typeof val === "object" && typeof val.copy === "function") ? val.copy() : val;
	});
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

/* the first step to any program is to define the global variables */
var Configuration = {
	width: 800,
	height: 600,
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

function Jigsaw(width, height) {
	var cellSize = 150,
	    hSize, vSize,
	    cx = width / cellSize,
	    cy  = height / cellSize,
	    hEdge, vEdge,
	    canvas = document.createElement("canvas");

	/* Try to divide rows and columns evenly, as close to the given cell size as possible */
	hSize = width / Math.ceil(cx);
	vSize = height / Math.ceil(cy);
	this.columns = Math.ceil(width / hSize);
	this.rows = Math.ceil(height / vSize);

	canvas.width = width;
	canvas.height = height;
	this.width = width;
	this.height = height;
	this.context = canvas.getContext("2d");

	this.edges = [];

	for (y = 0; y < cy; y++) {
		this.hline(y, vSize * y, width, this.columns);
	}
	for (x = 0; x < cx; x++) {
		this.vline(x, hSize * x, height, this.rows);
	}
}

Jigsaw.prototype.rows = 0;
Jigsaw.prototype.columns = 0;

Jigsaw.prototype.cutPiece = function (image, col, row) {
	var cell = this.edges[row][col],
	    left = cell.y,
	    top = cell.x,
	    right,
	    bottom;
	if (col === this.columns - 1) {
		right = [{x: this.width, y: top.last().y},
		         {x: this.width}];
	} else {
		right = this.edges[row][col+1].y;
	}
	if (row === this.rows - 1) {
		bottom = [{x: left.last().x, y: this.height},
		          {y: this.height}];
	} else {
		bottom = this.edges[row+1][col].x;
	}
	right[right.length-1].y = bottom.last().y;
	bottom[bottom.length-1].x = right.last().x;

	return new Piece(image, col, row, top, right, bottom.copy().reverse(), left.copy().reverse());
};

Jigsaw.prototype.hline = function (rowIndex, oy, width, cells) {
	var edges = this.edges,
	    row = [],
	    edge;
	calculateEdge(oy, width, cells, function (x, y, x2, y2, x3, y3, x4, y4, cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4, column) {
		if (!rowIndex) {
			edge = [{y: 0}, {y: 0}];
			edge[0].x = column ? x : 0;
			edge[1].x = x4;
		} else {
			edge = [{x: x, y: y},
				{x: cx1, y: cy1}, {x: cx1, y: cy1}, {x: x2, y: y2},
				{x: cx2, y: cy2}, {x: cx3, y: cy3}, {x: x3, y: y3},
				{x: cx4, y: cy4}, {x: cx4, y: cy4}, {x: x4, y: y4}];
		}
		row.push({x: edge});
	});
	edges.push(row);
};

Jigsaw.prototype.vline = function (columnIndex, ox, height, cells) {
	var edges = this.edges,
	    edge,
	    cell;
	calculateEdge(ox, height, cells, function (y, x, y2, x2, y3, x3, y4, x4, cy1, cx1, cy2, cx2, cy3, cx3, cy4, cx4, row) {
		cell = edges[row][columnIndex];

		if (!columnIndex) {
			edge = [{x: 0}, {x: 0}];
			edge[0].y = row ? y : y;
			edge[1].y = y4;
		} else {
			x4 = row === cells - 1 ? x4 : edges[row+1][columnIndex].x[0].x;
			edge =[{x: cell.x[0].x, y: y},
				{x: cx1, y: cy1}, {x: cx1, y: cy1}, {x: x2, y: y2},
				{x: cx2, y: cy2}, {x: cx3, y: cy3}, {x: x3, y: y3},
				{x: cx4, y: cy4}, {x: cx4, y: cy4}, {x: x4, y: y4}];
		}
		cell.x[0].y = y;
		cell.y = edge;
	});
};

function calculateEdge(offset, length, cells, callback) {
	var y = offset,
	    cellWidth = length / cells,
	    xm, x,
	    dy = cellWidth / 6,
	    range = cellWidth / 20, rx, ry, rx4,
	    x2, y2, x3, y3, x4, y4,
	    cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4,
	    direction;

	for (var i = 0; i < cells; i++) {
		rx = random(range, range * 2);
		ry = random(-range/2, range/2);
		rx4 = random(-range, range);
		if (i === cells - 1) {
			x = x4;
			x4 = length;
			y = y4;
		} else if (i === 0) {
			x = 0;
			x4 = x + cellWidth + rx4;
			y = Math.random() * 10 - 5 + offset;
		} else {
			x = x4;
			x4 = i * cellWidth + cellWidth + rx4;
			y = y4;
		}
		xm = x + cellWidth / 2;
		direction = Math.round(Math.random()) ? 1 : -1;
		dy *= direction;
		x2 = xm - cellWidth / 5;
		y2 = y - dy;
		x3 = xm + cellWidth / 5;
		y3 = y - dy;
		y4 = offset + ry;
		cx1 = x2 + rx + range;
		cy1 = y + ry - range / 2.5;
		cx2 = x2;
		cy2 = y2 - dy;
		cx3 = x3;
		cy3 = cy2;
		cx4 = x3 - rx - range;
		cy4 = cy1;
		callback(x, y, x2, y2, x3, y3, x4, y4,
			 cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4, i);
	}
}

function extremity(edge, vertical) {
	var axis,
	    t;
	axis = vertical ? "y" : "x";

	if (edge.length === 2) {
		return edge[0][axis];
	}

	t = bezierMax(edge[3][axis], edge[4][axis], edge[5][axis], edge[6][axis]);
	return bezier(t, edge[3][axis], edge[4][axis], edge[5][axis], edge[6][axis]);
}

function bezier(t, p0, p1, p2, p3) {
	var ti = 1 - t;
	return ti*ti*ti*p0 + 3*t*p1*ti*ti + 3*ti*p2*t*t + t*t*t*p3;
}

function bezierMax(p0, p1, p2, p3) {
	if (p0 + 3 * p2 === 3 * p1 + p3) {
		return 0.5;
	}
	var a = 6 * (p0 - 2 * p1 + p2),
	    b = p0 - 3 * p1 + 3 * p2 - p3,
	    sqrt = Math.sqrt(a * a + 36 * b * (p1 - p0));
	return (-a + sqrt) / (-6 * b);
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
};

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

	this.row = row;
	this.column = col;
	this.topEdge = top;
	this.leftEdge = left;
	this.bottomEdge = bottom;
	this.rightEdge = right;

	bounds.x = Math.min(left[0].x, left.last().x, extremity(left));
	bounds.y = Math.min(top[0].y, top.last().y, extremity(top, true));
	bounds.right = Math.max(right[0].x, right.last().x, extremity(right));
	bounds.bottom = Math.max(bottom[0].y, bottom.last().y, extremity(bottom, true));
	this.bounds = bounds;

	$.Sprite.call(this, bounds.right - bounds.x, bounds.bottom - bounds.y, {foreign: true});

	/* clip */
	clipImage(this.oContext, bounds, top, right, bottom, left, image);
	$.Sprite.prototype.copyPixels.call(this);

	/* boundary clipping path */
	edges = [top, right, bottom, left].map(function (edge) {
		edge = edge.copy();
		edge.forEach(function (point) {
			point.x -= bounds.x;
			point.y -= bounds.y;
		});
		return edge;
	});
	clipImage(this.context, bounds, edges[0], edges[1], edges[2], edges[3]);

	/* find the offset of the piece's corners */
	corners.tl = {x: top[0].x - bounds.x, y: top[0].y - bounds.y};
	corners.tr = {x: right[0].x - bounds.x, y: right[0].y - bounds.y};
	corners.bl = {x: bottom.last().x - bounds.x, y: bottom.last().y - bounds.y}; // bottom is reversed
	this.corners = corners;
	this.edges = new Rect;
}

Piece.prototype = new $.Sprite;
Piece.prototype.constructor = Piece;

Piece.prototype.moveTo = function (x, y, independent) {
	var dx, dy,
	    corner = this.corners,
	    group;

	this.edges.tl = {x: corner.tl.x + x, y: corner.tl.y + y};
	this.edges.tr = {x: corner.tr.x + x, y: corner.tr.y + y};
	this.edges.bl = {x: corner.bl.x + x, y: corner.bl.y + y};

	if (this.group && !independent) {
		group = this.group;
		dx = x - this.x;
		dy = y - this.y
		group.moveTo(group.x + dx, group.y + dy);
	} else {
		$.Sprite.prototype.moveTo.call(this, x, y);
	}
};

Piece.prototype.testPoint = function (point) {
	return this.context.isPointInPath(point.x - this.x, point.y - this.y);
};

Piece.prototype.relationTo = function (other) {
	if (this.row !== other.row && this.column !== other.column) { return; }
	if (this.row === other.row - 1) { return "above"; }
	if (this.row === other.row + 1) { return "below"; }
	if (this.column === other.column - 1) { return "left"; }
	if (this.column === other.column + 1) { return "right"; }
};

Piece.prototype.groupWith = function (other) {
	var newGroup;

	if (!this.group) {
		if (other.group) { other.group.insert(this); }
		else { newGroup = new PieceGroup([this, other]); }
	} else {
		if (other.group) { other.group.merge(this.group); }
		else { this.group.insert(other); }
	}
};

function PieceGroup(pieces) {
	$.Group.call(this, pieces);
	this.resetBounds();
}

PieceGroup.prototype = new $.Group;
PieceGroup.prototype.constructor = PieceGroup;

PieceGroup.prototype.insert = function (piece) {
	$.Group.prototype.insert.call(this, piece);
	this.resetBounds();
};

PieceGroup.prototype.resetBounds = function () {
	var piece,
	    pieces = this.items;

	this.x = pieces[0].x;
	this.y = pieces[0].y;
	this.right = pieces[0].right;
	this.bottom = pieces[0].bottom;

	for (var i = 1; i < pieces.length; i++) {
		piece = pieces[i];
		this.x = Math.min(this.x, piece.x);
		this.y = Math.min(this.y, piece.y);
		this.right = Math.max(this.right, piece.right);
		this.bottom = Math.max(this.bottom, piece.bottom);
	}
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

function groupSnap(group, tree) {
	var others;
	group.items.forEach(function (item) {
		others = tree.queryItems(item).filter(function (piece) {
			return (group.items.indexOf(piece) === -1);
		});
		snap(item, others);
	});
}

function snap(piece, others) {
	var pe = piece.edges, oe,
	    other,
	    threshold = 10,
	    snapped;
	for (var i = 0, l = others.length; i < l; i++) {
		snapped = false;
		other = others[i];
		oe = other.edges;
		switch (piece.relationTo(other)) {
		case "above":
			if (distance(pe.bl, oe.tl) < threshold) {
				snapped = true;
				piece.moveTo(oe.tl.x - piece.corners.bl.x,
					     oe.tl.y - piece.corners.bl.y);
			}
			break;
		case "below":
			if (distance(pe.tl, oe.bl) < threshold) {
				snapped = true;
				piece.moveTo(oe.bl.x - piece.corners.tl.x,
					     oe.bl.y - piece.corners.tl.y);
			}
			break;
		case "left":
			if (distance(pe.tr, oe.tl) < threshold) {
				snapped = true;
				piece.moveTo(oe.tl.x - piece.corners.tr.x,
					     oe.tl.y - piece.corners.tr.y);
			}
			break;
		case "right":
			if (distance(pe.tl, oe.tr) < threshold) {
				snapped = true;
				piece.moveTo(oe.tr.x - piece.corners.tl.x,
					     oe.tr.y - piece.corners.tl.y);
			}
			break;
		}
		if (snapped) {
			piece.groupWith(other);
			return;
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
		clip.x = Math.min(clip.x, dirty.x) - 1;
		clip.y = Math.min(clip.y, dirty.y) - 1;
		clip.right = Math.max(clip.right, dirty.right) + 1;
		clip.bottom = Math.max(clip.bottom, dirty.bottom) + 1;

		//redrawRegion(clip);
		redraw();
	});

	//$.loaded(init);
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
