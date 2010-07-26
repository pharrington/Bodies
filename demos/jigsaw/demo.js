function Bounds() {};
Bounds.prototype.left = 10000;
Bounds.prototype.top = 10000;
Bounds.prototype.right = 0;
Bounds.prototype.bottom = 0;

var px = [0], py = [0],
    pixels, imageData,
    img = new Image(),
    imgCanvas, imgContext;


function random(low, high) {
	return Math.random(high - low) + low;
}

function hline(oy, width, cells) {
	var c = $.context;
	c.beginPath();
	calculateEdge(oy, width, cells, function (x, y, x2, y2, x3, y3, x4, y4, cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4) {
		if (px.length < cells) { px.push(x4) }
		c.moveTo(x, y);
		c.bezierCurveTo(cx1, cy1, cx1, cy1, x2, y2);
		c.bezierCurveTo(cx2, cy2, cx3, cy3, x3, y3);
		c.bezierCurveTo(cx4, cy4, cx4, cy4, x4, y4);
	});
	c.stroke();
}

function vline(ox, height, cells) {
	var c = $.context;
	c.beginPath();
	calculateEdge(ox, height, cells, function (y, x, y2, x2, y3, x3, y4, x4, cy1, cx1, cy2, cx2, cy3, cx3, cy4, cx4) {
		if (py.length < cells) { py.push(y4) }
		c.moveTo(x, y);
		c.bezierCurveTo(cx1, cy1, cx1, cy1, x2, y2);
		c.bezierCurveTo(cx2, cy2, cx3, cy3, x3, y3);
		c.bezierCurveTo(cx4, cy4, cx4, cy4, x4, y4);
	});
	c.stroke();
}

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
		if (i === cells) {
			x = x4;
			x4 = width - 1;
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
			 cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4);
	}
}

function floodFill(x, y, coords, bounds) {
	if (!clear(x, y) || oob(x, y)) { return; };
	if (x < bounds.left) { bounds.left = x; }
	else if (x > bounds.right) { bounds.right = x; }
	if (y < bounds.top) { bounds.top = y; }
	else if (y > bounds.bottom) { bounds.bottom = y; }
	set(x, y);
	coords.push({x: x, y: y});
	floodFill(x+1, y, coords, bounds);
	floodFill(x-1, y, coords, bounds);
	floodFill(x, y+1, coords, bounds);
	floodFill(x, y-1, coords, bounds);
}

function oob(x, y) {
	return (x < 0 || y < 0 || x >= $.width || y >= $.height);
}

function clear(x, y) {
	return (pixels[y * $.width * 4 + x * 4 + 3] === 0);
}

function set(x, y) {
	var i = y * $.width * 4 + x * 4;
	pixels[i] = 0;
	pixels[i+1] = 0;
	pixels[i+2] = 0;
	pixels[i+3] = 255;
}

function init(width, height, imagePixels) {
	var cellSize = 65,
	    cx = width / cellSize,
	    cy = height / cellSize,
	    x, y,
	    piece,
	    pw, ph,
	    coords = [],
	    b = new Bounds();

	$.init("board", width, height);
	for (y = 1; y < cy; y++) {
		hline(cellSize * y, width, cx);
	}
	for (x = 1; x < cx; x++) {
		vline(cellSize * x, height, cy);
	}
	px.push(width);
	py.push(height);

	imageData = $.context.getImageData(0, 0, width, height);
	pixels = imageData.data;

	// cut image via jigsaws
	x = px.length - 4;
	y = 1;
	tx = Math.floor((px[x] + px[x+1]) / 2);
	ty = Math.floor((py[y] + py[y+1]) / 2);
	floodFill(tx, ty, coords, b);
	c.putImageData(id, 0, 0);
	$.context.drawImage(piece, 0, 0);
}

function Piece(image, bounds, coords) {
	this.canvas = document.createElement("canvas");
	this.context = piece.getContext("2d");
	var id = c.getImageData(0, 0, pw, ph);
	var p = id.data;
	var ip, ii;
	var point;

	pw = b.right - b.left + 1;
	ph = b.bottom - b.top + 1;
	piece.width = pw;
	piece.height = ph;
	for (var i = 0; i < coords.length; i++) {
		point = coords[i];
		ii = point.y * img.width * 4 + point.x * 4;
		ip = (point.y - b.top) * pw * 4 + (point.x - b.left) * 4;
		for (var j = 0; j < 4; j++) {
			p[ip + j] = imagePixels[ii + j];
		}
	}
}

window.addEventListener("load", function () {
	img.onload = function () {
		imgCanvas = document.createElement("canvas");
		imgCanvas.width = this.width;
		imgCanvas.height = this.height;
		imgContext = imgCanvas.getContext("2d");
		imgContext.drawImage(this, 0, 0);
		init(this.width, this.height, imgContext.getImageData(0, 0, this.width, this.height).data);
	};
	img.src = "padbury.gif";
}, false);
