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
Ship.prototype.shoot = function (now) {
	var b;
	if (now - this.lastShotTime > Bullet.interval) {
		b = new Bullet(this.x, this.y, this.rotation - Math.PI / 2);
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
	var v = this.velocity,
	    _super = this._super;

	$.Sprite.call(this, "bullet");
	this.vx = Math.cos(angle) * v;
	this.vy = Math.sin(angle) * v;
	this.ship = null;
	_super.moveTo.call(this, x, y);
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
    width = 500, height = 500,
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
	$.loadImage("ring", "outline.png");
	$.loadImage("bg", "grid.png");
	$.loadImage("bullet", "bullet.png");
	$.loaded(function () {
		ship = new Ship();
		ship.moveTo(44, 3560);
		ship.ax = 0;
		ship.ay = 0;
		ship.vMax = 350;
		ship.rotateTo(angle + Math.PI / 2);

		arena = new $.World("ring", 20);
		bg = new $.TiledBackground("bg", width, height);
		arena.insert(ship);
		viewport = new $.Viewport(width, height, arena.width, arena.height);
	});

	$.refresh(function (elapsed, now) {
		var accel = 25,
		    stopAccel = -100,
		    dt = elapsed / 1000;

		ship.ax = ship.ay = stopAccel;

		if (!paused) {

			if ($.keys[65]) { // A, Left
				ship.ax = -accel;
			} else if ($.keys[68]) { // D, Right
				ship.ax = accel;
			}
			if ($.keys[87]) { // W, Up
				ship.ay = -accel;
			} else if ($.keys[83]) { // S, Down
				ship.ay = accel;
			}
		
			ship.vx += ship.ax;
			ship.vy += ship.ay;
	
			if (ship.ax === stopAccel) { // no X axis movement
				if (ship.vx < 0) {
					ship.vx = 0;
				}
			} else {
				if (ship.vx > ship.vMax) {
					ship.vx = ship.vMax;
				}
				if (ship.vx < -ship.vMax) {
					ship.vx = -ship.vMax;
				}
			}
	
			if (ship.ay === stopAccel) { // no Y axis movement
				if (ship.vy < 0) {
					ship.vy = 0;
				}
			} else {
				if (ship.vy > ship.vMax) {
					ship.vy = ship.vMax;
				}
				if (ship.vy < -ship.vMax) {
					ship.vy = -ship.vMax;
				}
			}
			ship.update(dt);
			viewport.scrollTo(ship.x + ship.halfWidth, ship.y + ship.halfHeight);
			bg.moveTo(viewport.left * 0.4, viewport.top * 0.4);

			angle = Math.atan2(py - (ship.y - viewport.top), px - (ship.x - viewport.left));
			ship.rotateTo(angle + Math.PI / 2);
			if (addBullet) {
				ship.shoot(now);
			}
			arena.update(hitWall, interested);
			redraw();
		} /* end if (!paused) */
	}, 20);
}, false);
