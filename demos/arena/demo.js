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
    width = 1100, height = 800,
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
		var dt = elapsed / 1000;

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
