(function (window, undefined) {

var AI = {
	base: null,
	states: [],
	currentBumpiness: 0,

	WEIGHTS: {
		MAXHEIGHT: -2,
		WELLS: -2.75,
		HEIGHT: 0,
		HOLES: -8,
		BUMPINESS: 0
	},

	POWERS: {
		MAXHEIGHT: 1,
		WELLS: 1,
		HOLES: 1
	},

	height: function (grid) {
		var row, col,
		    field = this.base.field;

		for (row = 0; row < field.rows; row++) {
			for (col = 0; col < field.columns; col++) {
				if (grid[row][col]) {
					return field.rows - row;
				}
			}
		}

		return 0;
	},

	resetBumpiness: function () {
		this.currentBumpiness = 0;
	},

	accumulateBumpiness: function (height) {
		this.currentBumpiness += height;
	},

	weighBumpiness: function () {
		return this.currentBumpiness * this.WEIGHTS.BUMPINESS;
	},

	weighMaxHeight: function (height) {
		return Math.pow(height, this.POWERS.MAXHEIGHT) * this.WEIGHTS.MAXHEIGHT;
	},

	weighHeight: function (height) {
		return height * this.WEIGHTS.HEIGHT;
	},

	weighWell: function (height) {
		var adjustedHeight = Math.abs(height);

		return Math.pow(adjustedHeight, this.POWERS.WELLS) * this.WEIGHTS.WELLS;
	},

	weighHoles: function (holes) {
		return Math.pow(holes * 2, this.POWERS.HOLES) * this.WEIGHTS.HOLES;
	},

	rank: function (grid) {
		var col, row,
		    result = 0,
		    colHeight = 0,
		    oldHeight = 0,
		    maxHeight = 0,
		    holes = 0,
		    dangerHeight = 15,
		    field = this.base.field;

		this.resetBumpiness();

		for (col = 0; col < field.columns; col++) {
			colHeight = 0;
			holes = 0;

			for (row = 0; row < field.rows; row++) {
				if (!colHeight && grid[row][col]) {
					colHeight = field.rows - row;

					if (colHeight > maxHeight) {
						maxHeight = colHeight;
					}

				} else if (colHeight && !grid[row][col]) {
					holes++;
				}
			}

			result += this.weighHeight(colHeight);

			if (col) {
				this.accumulateBumpiness(colHeight - oldHeight);
				result += this.weighWell(colHeight - oldHeight);
			}

			result += this.weighHoles(holes);
			oldHeight = colHeight;
		}

		if (maxHeight >= dangerHeight) {
			result -= Math.abs(result / 2) * (maxHeight - dangerHeight + 1);
		}

		result += this.weighMaxHeight(maxHeight);
		result += this.weighBumpiness();

		return result;
	},

	init: function (game) {
		if (this.base) { return; }

		var states = this.states,
		    field = game.field,
		    maxStates = (field.columns * 4) + (field.columns - 1),
		    i;

		this.base = game;

		for (i = 0; i < maxStates; i++) {
			states[i] = $.inherit(game, {
				field: $.inherit(field, {
					grid: new Array(field.rows),
					drawBlock: $.noop,
					animate: $.noop
				})
			});

			for (j = 0; j < field.rows; j++) {
				states[i].field.grid[j] = new Array(field.columns);
			}
		}
	},

	piecePath: function (piece, field, dest) {
		var piece = $.inherit(piece, {
				gridPosition: $.inherit(piece.gridPosition)
			}),
		    path = [],
		    delta,
		    direction,
		    desty = piece.gridPosition.y;

		if (piece.gridPosition.x === dest.gridPosition.x &&
		    piece.gridPosition.y === dest.gridPosition.y &&
		    piece.shapeIndex === dest.shapeIndex) {
			return path;
		}

		if (dest.shapeIndex === piece.shapes.length - 1) {
			path.push(Piece.Rotation.CCW);
			piece.rotateCCW();
		} else {
			while (piece.shapeIndex !== dest.shapeIndex) {
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

		while (piece.gridPosition.x !== dest.gridPosition.x) {
			path.push(direction);
			piece.move(direction);
		}

		while (piece.gridPosition.y !== dest.gridPosition.y &&
		       !(field.collision(piece) || field.oob(piece))) {
			desty++;
			piece.moveDown();
		}

		if (piece.gridPosition.x === dest.gridPosition.x &&
		    piece.gridPosition.y === dest.gridPosition.y) {
			path.push(desty + 10);
			return path;
		} else {
			return null;
		}
	},

	generateMove: function () {
		var state,
		    field,
		    i = 0,
		    x,
		    shape,
		    piece,
		    basePiece = this.base.currentPiece,
		    rank,
		    best = { rank: -Number.MAX_VALUE },
		    path,
		    dest,
		    cols = this.base.field.columns;

		for (x = -2; x < cols; x++) {
			for (shape = 0; shape < basePiece.shapes.length; shape++) {
				piece = $.inherit(basePiece, {
					gridPosition: {x: 0, y: 0},
					shapeIndex: shape
				});
				state = this.states[i];

				piece.init(state);
				piece.gridPosition.x = x;
				piece.setShape();

				field = state.field;
				field.copy(this.base.field);
				field.moveToBottom(piece);

				dest = $.inherit(piece, {
					shapeIndex: piece.shapeIndex
				});

				path = this.piecePath(basePiece, field, dest);

				if (!(field.collision(piece) || field.oob(piece)) && path) {
					field.merge(piece);
					field.clearRows(true);

					rank = this.rank(field.grid);
					if (rank > best.rank) {
						best.dest = dest;
						best.rank = rank;
						best.path = path;
					}
				}

				i++;
			}
		}

		return best;
	},

	movePiece: function (dt) {
		var path = this.currentPath,
		    piece = this.base.currentPiece,
		    currentMove;

		if (!path) {
			this.startPiece();
		}

		/*
		 * commented out as hard drops, not soft drops currently lock the piece
		if (this.destination.gridPosition.x === piece.gridPosition.x &&
		    this.destination.gridPosition.y === piece.gridPosition.y) {
		    	this.base.input(Inputs.SoftDrop);
			return;
		}
		*/

		if (!path) {
			return;
		}

		currentMove = path[0];

		if (this.handleMove(currentMove, piece, dt)) {
			path.shift();
		}
	},

	handleMove: function (code, piece, dt) {
		var desty,
		    game = this.base,
		    nextMove = true;

		switch (code) {
			case Piece.Direction.Left:
				game.input(Inputs.Left);
				break;
			case Piece.Direction.Right:
				game.input(Inputs.Right);
				break;

			case Piece.Rotation.CW:
				game.input(Inputs.RotateCW);
				break;
			case Piece.Rotation.CCW:
				game.input(Inputs.RotateCCW);
				break;

			default:
				desty = code - 10;
				if (piece.gridPosition.y !== desty) {
					this.moveDown(desty, piece, dt);
					nextMove = false;
				}
		}

		return nextMove;
	},

	moveDown: function (desty, piece, dt) {
		this.base.input(Inputs.HardDrop);
	},

	startPiece: function () {
		var piece = this.base.currentPiece,
		    field = this.base.field,
		    move;

		move = this.generateMove();
		this.destination = move.dest;
		this.currentPath = move.path;
	},

	endPiece: function () {
		this.currentPath = null;
	},

	gameOver: function () {
		this.base = null;
	},
};

window.AI = AI;

})(this);
