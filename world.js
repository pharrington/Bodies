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
