(function (window, undefined) {

var Countdown = {
	_node: null,
	node: function () {
		var node = this._node, container = document.getElementById("center_content");

		if (node) { return node; }

		this._node = node = document.createElement("div");
		node.appendChild(document.createTextNode(""));
		node.className = "countdown";
		container.appendChild(node);

		return node;
	},

	countdown: function (num) {
		this.node().className = "countdown";
		this.node().firstChild.nodeValue = num;

		if (num > 1) {
			setTimeout(this.countdown.bind(this).partial(num - 1), 1000);
		}

		// set a timeout for setting the className because Firefox won't otherwise clear the previous class
		window.setTimeout(function () {
			this.node().className = "countdown tick";
		}.bind(this), 20);
	},

	tick: function (seconds) {
		if (this.running) { return; }
		this.running = true;

		this.node().style.display = "block";
		this.countdown(seconds);
	},

	end: function () {
		this.running = false;
		this.node().style.display = "none";
	}
};

window.Countdown = Countdown;

})(this);
