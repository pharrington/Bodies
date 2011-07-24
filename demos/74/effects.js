var FX = {};

FX.Fireworks = {
	duration: 600,

	gravity: 0.02,
	count: 12,
	speed: 0.43,

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
		var speed = Math.random() * this.speed,
		    vel,
		    angle,
		    particle,
		    colors,
		    color;

		colors = this.colors[color];
		color = colors[Math.floor(Math.random() * colors.length)];

		angle = Math.random() * Math.PI * 2;

		particle = this.particleSystem.createParticle();
		particle.duration = this.duration;
		particle.setPosition(x, y);
		particle.setVelocity(
			speed * Math.cos(angle),
			speed * Math.sin(angle) - 0.05);
		particle.setAcceleration(0, this.gravity);
		particle.setColor(color);
		particle.radius = 3;
		if (Math.random() < 0.35) {
			particle.delay = Math.random() * 200;
		}
	},

	init: function () {
		if (!this.duration) { return; }

		var x, y,
		    field = this.field,
		    blockSize = Piece.blockSize,
		    spacing = Piece.spacing,
		    row,
		    i, j;

		for (i = 0; i < this.rows.length; i++) {
			row = this.rows[i];

			y = row.index * blockSize + spacing
			for (x = 0; x < field.columns; x++) {
				for (j = 0; j < this.count; j++) {
					this.addParticle(blockSize / 2 + x * (blockSize + spacing),
							 y,
							 row.blocks[i].color);
				}
			}
		}
	},

	setOffset: function (o) {
		this.particleSystem.offset = o;
	},

	refresh: function (dt) {
		this.particleSystem.update(dt, $.context);
	},
};

FX.Streak = {
	start: function (piece) {
		
	},

	end: function (piece) {
	},

	refresh: function (dt) {
		
	}
};

FX.Dummy = {
	rows: null,
	field: null,

	init: $.noop,
	refresh: $.noop
};
