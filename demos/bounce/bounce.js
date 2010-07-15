var c,
    paused = false,
    debug;

function clickField(balls, x, y) {
	Bodies.context.clearRect(0, 0, 800, 600);
	draw(balls);
	for (var i = 0; i < balls.length; i++) {
		var ball = balls[i],
		    cx = ball.x + ball.width / 2,
		    cy = ball.y + ball.height / 2,
		    r = ball.width / 2;
		if (Math.sqrt(Math.pow(cx - x, 2) + Math.pow(cy - y, 2)) < r) {
			var region = ball.collisionNode;
			drawRect(region.left, region.top, region.right - region.left, region.bottom - region.top, Bodies.context);
			debug = ball;
			return;
		}
	}
}

function drawRect(x, y, w, h, context) {
	context.lineWidth = 5;
	context.strokeStyle = "red";
	context.strokeRect(x, y, w, h);
}

function draw(collection) {
	for (var i = 0; i < collection.length; i++) {
		collection[i].draw();
	}
}

window.addEventListener("load", function() {
	var width = 1500,
	    height = 1100,
	    BALL_COUNT = 400,
	    balls = [];

	document.getElementById("pause").addEventListener("click", function () {
		paused = !paused;
	}, false);

	document.getElementById("field").addEventListener("click", function (e) {
		var p = Bodies.coordinates(e);
		clickField(balls, p.x, p.y);
	}, false);

	document.getElementById("add").addEventListener("click", function () {
		var ball = new Bodies.Sprite("circle");
		ball.moveTo(Math.random() * (width - 100) + 50, Math.random() * (height - 100) + 50);
		ball.vx = Math.random() * 10;
		ball.vy = Math.random() * 10;
		ball.update = function() {
			if (this.x + this.width >= width || this.x <= 0) { this.vx *= -1; }
			if (this.y + this.height >= height || this.y <= 0) { this.vy *= -1; }
			this.moveTo(this.x + this.vx, this.y + this.vy);
		};
		balls.push(ball);
		c.insert(ball);
	}, false);

	Bodies(width, height);
	Bodies.loadImage("circle", "circle.png");
	c = new Bodies.CollisionTrie(0, 0, width, height);

	Bodies.loaded(function() {
		for (var i = 0; i < BALL_COUNT; i++) {
			var ball = new Bodies.Sprite("circle");
			ball.moveTo(Math.random() * (width - 100) + 50, Math.random() * (height - 100) + 50);
			ball.vx = Math.random() * 10;
			ball.vy = Math.random() * 10;
			ball.update = function() {
				var x = this.x,
				    y = this.y;
				if (x + this.width >= width || x <= 0) { this.vx *= -1; }
				if (y + this.height >= height || y <= 0) { this.vy *= -1; }
				this.moveTo(x + this.vx, y + this.vy);
			};
			balls.push(ball);
			c.insert(ball);
		}
	});
	
	Bodies.refresh(function (context) {
		if (!paused) {
			context.clearRect(0, 0, width, height);
		}
		for (var i = 0; i < balls.length; i++) {
			var ball = balls[i],
		    	    region = ball.collisionNode,
		    	    collisionRegions = [];

			if (!paused) {
			ball.update();

			// update quadtree
			c.queryNodes(ball, collisionRegions);
			if (collisionRegions[collisionRegions.length-1] != region) {
				region.deleteItem(ball);
				c.insert(ball);
			}

			// collide
			for (var j = 0; j < collisionRegions.length; j++ ) {
				var r = collisionRegions[j];
				for (var k = 0; k < r.items.length; k++) {
					var b2 = r.items[k];
					if ((ball != b2) && Bodies.testCollision(ball, b2)) {
						ball.vx *= -1;
						ball.vy *= -1;
						ball.update();
						while (Bodies.testCollision(ball, b2)) {
							ball.update();
						}
					}
				}
			}
			}
		}
		draw(balls);
	});
}, true);
