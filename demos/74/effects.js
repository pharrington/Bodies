var Fireworks = {
	elapsed: null,
	duration: 600,

	gravity: 0.02,
	count: 17,
	speed: 0.43,

	width: null,
	height: null,
	offset: null,

	colors: {
		cyan: ["#c0f8fc", "#0bd0df", "#012337", "#ffffff", "#ffffff", "#18e2f4", "#0382cb"],
		yellow: ["#faf0bc", "#f0e314", "#a4a01b",  "#a40214", "#be1f30", "#608b40", "#ffffff", "#ffffff"],
		red: ["#f03b51", "#f2164a", "#c90c03", "#d20c1f", "#ffffff", "#ffffff"],
		blue: ["#177cf4", "#0326cb", "#c0dcfc", "#91b1f1", "#062365", "#3125c1", "#4b468e", "#f2f136", "#ffffff", "#ffffff"],
		orange: ["#f59231", "#edb903", "#f6d6ac", "#8d5d09", "#7f50f3", "#522fa8", "#ffffff", "#ffffff"],
		purple: ["#ccaef8", "#6417f1", "#8203cb", "#e10bf9", "#1b0ada", "#0b37f9", "#ffffff", "#ffffff"],
		green: ["#d0fcbc", "#5bf418", "#08cb03", "#63f453", "#94dd0b", "#fafa0c", "#ffffff", "#ffffff"]
	},

	addParticle: function (x, y, color) {
		var accel = new Vector(0, this.gravity),
		    speed = Math.random() * this.speed,
		    vel,
		    angle,
		    particle,
		    colors,
		    color;

		colors = this.colors[color];
		color = colors[Math.floor(Math.random() * colors.length)];

		angle = Math.random() * Math.PI * 2;
		vel = new Vector(speed * Math.cos(angle), speed * Math.sin(angle));
		vel.y -= 0.05;

		particle = this.particleSystem.createParticle();
		particle.duration = this.duration;
		particle.setPosition(new Vector(x, y));
		particle.setVelocity(vel);
		particle.setAcceleration(accel);
		particle.setColor(color);
	},

	init: function () {
		if (!this.duration) { return; }
		this.elapsed = 0;

		var x, y,
		    offset,
		    field = this.field,
		    blockSize = Piece.blockSize,
		    spacing = Piece.spacing,
		    row,
		    i, j;

		offset = new Vector(this.field.offset);

		for (i = 0; i < this.rows.length; i++) {
			row = this.rows[i];

			y = row.index * blockSize + spacing
			for (x = 0; x < field.columns; x++) {
				for (j = 0; j < this.count; j++) {
					this.addParticle(offset.x + blockSize / 2 + x * (blockSize + spacing),
							 offset.y + y,
							 row.blocks[i].color);
				}
			}
		}
	},

	refresh: function (dt) {
		if (this.elapsed === null) { return; }

		var ctx = $.context,
		    percent;

		this.elapsed += dt;
		percent = this.elapsed / this.duration;

		if (percent >= 1) {
			this.elapsed = null;
		}

		this.animate(dt);
	},

	animate: function (dt) {
		this.particleSystem.update(dt, $.context);
	}
};

var Dummy = {
	rows: null,
	field: null,

	init: $.noop,
	refresh: $.noop
};
