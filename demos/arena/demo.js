/* the ship being responsible for its bullets seems fundamentally wrong
 * whats a better way to structure this?
 */
function Ship() {
	$.Sprite.call(this, "moth", {precompute: true});
	this.bullets = [];
	this.lastShotTime = 0;
	this.eject = true;
	this.alive = true;
}

Ship.inherit($.Sprite);
Ship.prototype.collisionType = CPLAYER;

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
	this.bullets.deleteItem(bullet);
};

Ship.prototype.update = function (dt) {
	this._super.update.call(this, dt);
	this.bullets.forEach(function (b) { b.update(dt); });
};

Ship.prototype.damaged = function (bullet) {
	/*
	 * invinciblity!!
	 */
};

function Enemy(spawn) {
	$.Sprite.call(this, "enemy", {precompute: true});
	
	this._super.moveTo.call(this, spawn.x, spawn.y);
	this.spawnDelay = spawn.delay;
	this.emitter = BulletEmitter.spiral2;
}

Enemy.inherit($.Sprite);
Enemy.prototype.collisionType = CENEMY;
Enemy.prototype.health = 1;
Enemy.prototype.alive = false;
Enemy.prototype.eject = true;
Enemy.prototype.movement = null;
Enemy.prototype.startTime = null;
Enemy.prototype.wave = null;

(function () {
	var id = 0;
	function generateId() { return id++; }

	Enemy.prototype.id = function () {
		if (!this.__id__) { this.__id__ = generateId(); }
		this.id = function () { return this.__id__; };
		return this.__id__;
	};
})();

Enemy.prototype.update = function (dt, now) {
	if (!this.startTime) { return; }
	if (!this.alive) {
		if (now - this.startTime >= this.spawnDelay) {
			this.alive = true;
			this.movement = Movement.stalker;
		}
		else {
			return;
		}
	}
	this.movement.update(this, now);
	this._super.update.call(this, dt);
	this.emitter.update(this, now).forEach(function (bullet) {
		bullets.push(bullet);
		arena.insert(bullet);
	});
};

Enemy.prototype.damaged = function (bullet) {
	this.health -= bullet.power;
	this.health <= 0 && this.die();
};

Enemy.prototype.die = function () {
	this.alive = false;
	enemies.deleteItem(this);
	arena.deleteItem(this);
	this.wave.deleteItem(this);
};

function EnemyWave(enemySpecs, spawn) {
	var enemies = [];
	enemySpecs.forEach(function (spec) {
		spec.delay = spec.delay ? spec.delay + spawn : spawn;
		enemies.push(new Enemy(spec));
	});

	this.spawnDelay = spawn;
	this.enemies = enemies;
}

EnemyWave.prototype.start = function (now) {
	var enemy;
	for (var i = 0, len = this.enemies.length; i < len; ++i) {
		enemy = this.enemies[i];
		enemy.startTime = now;
		enemy.wave = this;
		enemies.push(enemy);
		arena.insert(enemy);
	}
};

EnemyWave.prototype.deleteItem = function (item) {
	this.enemies.deleteItem(item);
};

function drawSprite(sprite) {
	if (sprite.alive) { viewport.draw(sprite); }
}

function redraw() {
	bg.draw();
	viewport.draw(arena);
	viewport.draw(ship);
	enemies.forEach(drawSprite);
	ship.bullets.forEach(drawSprite);
	bullets.forEach(drawSprite);
}

function collide(actor, others) {
	if (others[0].wall) {
		actor.die();
	} else if (actor.collisionType & CBULLET) {
		others.forEach(function (o) { o.damaged(actor); });
		actor.die();
	}
}

function interested(a, b) {
	return  (a.wall || b.wall) ||
		(a.alive && b.alive) &&
		((a.collisionType ^ b.collisionType) & CPLAYER) &&
		((a.collisionType ^ b.collisionType) & CBULLET);
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
	$.loadImage("enemy", "butterfly.png");
	$.loadImage("enemybullet", "enemybullet.png");
	$.loaded(function () {
		/* prerotate sprites */
		["moth", "bullet", "enemy", "enemybullet"].forEach(function (resource) {
			new $.Sprite(resource, {precompute: true});
		});
		ship = new Ship();
		ship.moveTo(44, 3560);
		ship.vMax = 250;
		ship.rotateTo(angle + Math.PI / 2);

		arena = new $.World("ring", arenaTilesheet, arenaMap, 50);
		bg = new $.TiledBackground("bg", width, height);
		arena.insert(ship);
		viewport = new $.Viewport(width, height, arena.width, arena.height);

		//waves[0] = new EnemyWave([{x: 400, y: 3300}], 1000);
		waves[0] = new EnemyWave([{x: 400, y: 3300},
					  {x: 420, y: 3375},
					  {x: 450, y: 3500}], 2000);
	});

	$.start(function (now) {
		waves[0].start(now);
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
				pox = (px + scroll.x) - (cx - viewport.left);
				poy = (py + scroll.y) - (cy - viewport.top);
				bAngle = Math.atan2(poy, pox);
				ship.shoot(bAngle, now);
			}

			for (var i = 0, len = enemies.length; i < len; i++) {
				enemies[i].update(dt, now);
			}
			for (var i = 0, len = bullets.length; i < len; i++) {
				bullets[i].update(dt, now);
			}
			arena.update(collide, interested);
			redraw();
		} /* end if (!paused) */
	}, 17);
}, false);
