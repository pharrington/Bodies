/* the ship being responsible for its bullets seems fundamentally wrong
 * whats a better way to structure this?
 */
function Ship() {
	$.Sprite.call(this, "moth");
	this.bullets = [];
	this.lastShotTime = 0;
	this.eject = true;
}

Ship.prototype = new $.Sprite;
Ship.prototype._super = $.Sprite.prototype;
Ship.prototype.constructor = Ship;
Ship.prototype.shoot = function (angle, now) {
	var b,
	    x, y;
	if (now - this.lastShotTime > Bullet.interval) {
		x = this.x + this.halfWidth;
		y = this.y + this.halfHeight;
		b = new Bullet(x, y, angle);
		b.ship = this;
		this.bullets.push(b);
		arena.insert(b);
		this.lastShotTime = now;
	}
};

Ship.prototype.killBullet = function (bullet) {
	var bullets = this.bullets,
	    index = bullets.indexOf(bullet);
	if (index !== -1) { bullets.splice(index, 1); }
};

Ship.prototype.update = function (dt) {
	this._super.update.call(this, dt);
	this.bullets.forEach(function (b) { b.update(dt); });
};

function Bullet(x, y, angle) {
	$.Sprite.call(this, "bullet");
	var v = this.velocity,
	    _super = this._super,
	    cos = Math.cos(angle),
	    sin = Math.sin(angle),
	    dx = -this.halfWidth;
	    dy = -this.oHeight;

	this.vx = cos * v;
	this.vy = sin * v;
	this.ship = null;
	_super.moveTo.call(this, x + dx, y + dy);
	_super.rotateTo.call(this, angle);
}

Bullet.prototype = new $.Sprite;
Bullet.prototype._super = $.Sprite.prototype;
Bullet.prototype.constructor = Bullet;
Bullet.prototype.velocity = 800;
Bullet.interval = 100;

Bullet.prototype.die = function () {
	this.ship.killBullet(this);
};

var ship,
    arena,
    bg,
    viewport,
    width = 800, height = 600,
    px = 0, py = 0,
    angle = 0,
    bulletAngle = 0,
    paused = false;

function redraw() {
	bg.draw();
	viewport.draw(arena);
	viewport.draw(ship);
	ship.bullets.forEach(function (b) { viewport.draw(b); });
}

function hitWall(bullet) {
	arena.deleteItem(bullet);
	bullet.die();
}

function interested(a, b) {
	return a.wall || b.wall;
}

addEventListener("load", function () {
	var addBullet = false,
	    lastTimeAdded = 0;
	document.getElementById("pause").addEventListener("click", function () {
		paused = !paused;
	}, false);

	$.init("field", width, height);
	$.mouseMove(function (x, y) {
		px = x;
		py = y;
	});

	$.mouseDown(function () {
		addBullet = true;
	});

	$.mouseUp(function () {
		addBullet = false;
	});
	$.loadImage("moth", "moth-small2.png");
	$.loadImage("ring", "outline_tilesheet.png");
	$.loadImage("bg", "grid.png");
	$.loadImage("bullet", "bullet.png");
	$.loaded(function () {
		ship = new Ship();
		ship.moveTo(44, 3560);
		ship.ax = 0;
		ship.ay = 0;
		ship.vMax = 250;
		ship.rotateTo(angle + Math.PI / 2);

		arena = new $.World("ring", arenaTilesheet, arenaMap, 50);
		bg = new $.TiledBackground("bg", width, height);
		arena.insert(ship);
		viewport = new $.Viewport(width, height, arena.width, arena.height);
	});

	$.refresh(function (elapsed, now) {
		var dt = elapsed / 1000,
		    cx, cy, // center coordinates of the ship
		    pox, poy, // point offset from the viewport
		    bAngle, // angle of the bullet
		    scroll;

		if (!paused) {

			ship.vx = ship.vy = 0;
			if ($.keys[65]) { // A, Left
				ship.vx = -ship.vMax;
			} else if ($.keys[68]) { // D, Right
				ship.vx = ship.vMax;
			}
			if ($.keys[87]) { // W, Up
				ship.vy = -ship.vMax;
			} else if ($.keys[83]) { // S, Down
				ship.vy = ship.vMax;
			}
		
			ship.update(dt);
			cx = ship.x + ship.halfWidth;
			cy = ship.y + ship.halfHeight;
			scroll = viewport.scrollTo(cx, cy);
			bg.moveTo(viewport.left * 0.4, viewport.top * 0.4);

			poy = py - (cy - viewport.top);
			pox = px - (cx - viewport.left);
			angle = Math.atan2(poy, pox);
			ship.rotateTo(angle + Math.PI / 2);
			if (addBullet) {
				pox = (px + 13 * scroll.x) - (cx - viewport.left);
				poy = (py + 13 * scroll.y) - (cy - viewport.top);
				bAngle = Math.atan2(poy, pox);
				ship.shoot(bAngle, now);
			}
			arena.update(hitWall, interested);
			redraw();
		} /* end if (!paused) */
	}, 20);
}, false);
