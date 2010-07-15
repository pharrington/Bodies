function mark(red) {
	if (mark.marked === undefined) { mark.marked = false; }
	if ((red && mark.marked) || (!red && !mark.marked)) { return; }
	mark.marked = red;
	var color = red ? [255, 0, 0, 255] : [0, 0, 0, 255],
	    pixels = this.imageData.data;

	for (var p = 0; p < this.width * this.height; p++) {
		var index = p * 4;
		if (pixels[index + 3] > 0) {
			for (var i = 0; i < 3; i++) {
				pixels[index + i] = color[i];
			}
		}
	}
	this.context.putImageData(this.imageData, 0, 0);
}

window.addEventListener("load", function() {
	var s1, s2;
	Bodies(600, 600);
	Bodies.loadImage("oval", "oval.gif");

	Bodies.mouseMove(function (x, y) {
		s1.moveTo(x, y);
	});

	Bodies.loaded(function () {
		s1 = new Bodies.Sprite("oval");
		s2 = new Bodies.Sprite("oval");
		s1.moveTo(0, 0);
		s2.moveTo(200, 200);
	});

	Bodies.refresh(function(context) {
		if (Bodies.testCollision(s1, s2)) {
			mark.call(s2, true);
		} else {
			mark.call(s2, false);
		}
		context.clearRect(0, 0, 600, 600);
		s1.draw();
		s2.draw();
	});
}, true);
