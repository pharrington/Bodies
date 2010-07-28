$.World = function (imageName, resolution) {
	var image = $.resource(imageName),
	    pixels,
	    region,
	    offset,
	    width, height;

	this.left = 0;
	this.top = 0;
	this.width = image.width;
	this.height = image.height;
	this.scanWidth = image.width * 4;
	this.rows = Math.ceil(this.height / resolution);
	this.columns = Math.ceil(this.width / resolution);
	this.canvas = document.createElement("canvas");
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.context = this.canvas.getContext("2d");
	this.context.drawImage(image, 0, 0);
	this.imageData = this.context.getImageData(0, 0, this.width, this.height);
	this.pixels = this.imageData.data;
	this.quadtree = new $.Quadtree(0, 0, this.width, this.height);
	this.actors = [];

	// check the pixels to see if we need to add this region to the collision map
	for (var y = 0; y < this.height; y += resolution) {
		height = (y > this.height - resolution) ? this.height - y : resolution;
		for (var x = 0; x < this.width; x += resolution) {
			width = (x > this.width - resolution) ? this.width - x : resolution;
			if (isOpaque(this.pixels, this.scanWidth, x, y, width, height)) {
				region = {};
				region.dx = region.dy = 0;
				region.x = region.left = x;
				region.y = region.top = y;
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
};

$.World.prototype.draw = function () {
	$.context.drawImage(this.canvas, 0, 0);
};

$.World.prototype.insert = function (item) {
	this.actors.push(item);
	this.quadtree.insert(item);
};

$.World.prototype.update = function (callback) {
	var actor,
	    region,
	    collisionRegions,
	    collisions;
              	for (var i = 0; i < this.actors.length; i++) {
			actor = this.actors[i];
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
                      	for (var j = 0; j < collisionRegions.length; j++ ) {
                              	var r = collisionRegions[j];
                              	for (var k = 0; k < r.items.length; k++) {
                                      	var other = r.items[k];
                                      	if ($.testCollision(actor, other)) {
						if (collisions.indexOf(other) === -1) {
							collisions[collisions.length] = other;
						}
                                      	}
                              	}
                      	}
		if (collisions.length) {
			eject(actor, collisions);
		}
	}
};

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

function isOpaque(pixels, scanWidth, x, y, w, h) {
	offset = y * scanWidth + x * 4 + 3;
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
