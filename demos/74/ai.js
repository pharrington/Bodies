var AI = {
	states: [],

	Weights: {
		MAXHEIGHT: -10,
		RIGHTHEIGHT: -20,
		DEEPWELLS: -4,
		EDGEHEIGHT: 3
	},

	height: function (grid) {
		var row, col;

		for (row = 0; row < 20; row++) {
			for (col = 0; col < 10; col++) {
				if (grid[row][col]) {
					return 20 - row;
				}
			}
		}

		return 0;
	},

	piecePath: function (piece, field, dest, path) {
		var p = instance(piece),
		    path = [],
		    delta,
		    initialDirection,
		    direction,
		    idx,
		    desty = piece.gridPosition.y,
		    x, y;

		// return point
		if ($.equals(piece.gridPosition, dest.gridPosition) && piece.shapeIndex === dest.shapeIndex) {
			return path;
		}

		if (dest.shapeIndex === piece.shapes.length - 1) {
			path.push(Piece.Rotation.CCW);
			piece.rotateCCW();
		} else {
			while (piece.shapeIndex !== dest.shapIndex) {
				path.push(Piece.Rotation.CW);
				piece.rotateCW();
			}
		}

		delta = dest.gridPosition.x - piece.gridPosition.x;
		if (delta > 0) {
			direction = Piece.Direction.Right;
		} else if (delta < 0) {
			direction = Piece.Direction.Left;
		} else {
			direction = 0;
		}

		initialDirection = direction;

		while (piece.gridPosition.x !== dest.gridPosition.x) {
			path.push(direction);
			piece.move(direction);
		}

		while (piece.gridPosition.y !== dest.gridPosition.y && !field.collision(piece)) {
			desty++;
			piece.moveDown();
		}

		// return point
		if ($.equals(piece.gridPosition, dest.gridPosition)) {
			path.push(desty + 10);
			return path;
		}

		// we're blocked, move around barrier

		x = dest.gridPosition.x;
		y = dest.gridPosition.y;

		dest.moveLeft();

		if (field.collision(dest)) {
			dest.moveRight();
			dest.moveRight();

			//return point;
			if (field.collision(dest)) {
				return null;
			} else {
				direction = Piece.Direction.Right;
			}
		} else {
			direction = Piece.Direction.Left;
		}

		if (initialDirection !== direction) {
			idx = path.indexOf(initialDirection);

			if (idx !== -1) {
				path.splice(idx, 1);
			}
		}

		dest.gridPosition.x = x;
		dest.gridPosition.y = y;

		desty--;
		path.push(desty + 10);

		while (field.collision(piece)) {
			path.push(direction);
			piece.move(direction);

			//return point
			if (field.oob(piece)) {
				return null;
			}
		}

		while (piece.gridPosition.y !== dest.gridPosition.y) {
			desty++;
			piece.moveDown();

			//return point
			if (field.collision(piece)) {
				return null;
			}
		}
		path.push(desty + 10);

		direction *= -1;

		while (piece.gridPosition.x !== dest.gridPosition.x) {
			path.push(direction);
			piece.move(direction);

			//return point
			if (field.collision(piece)) {
				return null;
			}
		}

		return path;
	},

	weighMaxHeight: function (grid) {
		var height = this.height(grid);

		return height * this.WEIGHTS.MAXHEIGHT;
	},

	weighEdgeHeight: function (height) {
		return height * this.WEIGHTS.EDGEHEIGHT;
	},

	weighHeight: function (height) {
		return height * this.WEIGHTS.HEIGHT;
	},

	weighWell: function (height) {
		return Math.abs(height) * this.WEIGHTS.DEEPWELLS;
	},

	weighRightHeight: function (height) {
		return height * this.WEIGHTS.RIGHTHEIGHT;
	},

	rank: function (grid) {
		var col, row,
		    result = 0,
		    colHeight = 0,
		    oldHeight = 0,
		    weights = this.Weights;

		result += this.weighMaxHeight(grid);

		for (col = 0, colHeight = 0; col < 10; col++) {
			for (row = 0; row < 20; row++) {
				if (grid[row][col]) {
					colHeight = 20 - row;
				}
			}

			oldHeight = colHeight;
			if (col === 0 || col === 8) {
				result += this.weighEdgeHeight(colHeight);
			} else if (col === 9) {
				result += this.weighRightHeight(colHeight);
			} else {
				result += this.weighHeight(colHeight);
			}

			if (col) {
				result += this.weightWell(colHeight - oldHeight);
			}
		}

		return result;
	},

	init: function (game) {
		var states = this.states,
		    i;

		this.base = game;

		for (i = 0; i < 40; i++) {
			states[i] = $.inherit(game, {
				field: $.inherit(game.field, {
					grid: new Array(20);
				});
			});

			for (j = 0; j < 20; j++) {
				states[i].field.grid[j] = new Array(10);
			}
		}
	},

	generateMove: function () {
		var state,
		    x,
		    shape,
		    piece;

		for (x = -2; x < 10; x++) {
			piece = $.inherit(this.base.currentPiece);

			for (shape = 0; shape < piece.shapes.length; shape++) {
				piece.rotateCW();
			}
		}
	}
};
