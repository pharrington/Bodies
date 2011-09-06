(function () {
	function expandShape(orig) {
		var expanded = [],
		    row,
		    i, j;

		for (i = 0; i < orig.length; i++) {
			row = orig[i];
			expanded[i] = [];
			expanded[i+1] = [];

			for (j = 0; j < row.length; j++) {
				expanded[i][j] =
				expanded[i+1][j] =
				expanded[i][j+1] =
				expanded[i+1][j+1] = orig[i][j];
			}
		}


		return expanded;
	}

	var BigPiece = $.inherit(Piece, {
		scale: 2
	});
})();
