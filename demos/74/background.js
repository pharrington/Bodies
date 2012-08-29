(function (window) {

function Background(resource, offset) {
	var canctx = $.createCanvas(resource.width, resource.height);

	this.canvas = document.getElementById("field_background");
	this.context = this.canvas.getContext("2d");

	this.canvas.width = resource.width;
	this.canvas.height = resource.height;
	this.context.drawImage(resource, 0, 0);
}

window.Background = Background;
})(window);
