(function (window, undefined) {

var Util = {
	cycle: function (array, index) {
		var len = array.length;

		index %= len;
		if (index < 0) { index += len }

		return array[index];
	},

	cacheNode: function (selector) {
		var node;

		return function () {
			if (!node) { 
				node = document.querySelector(selector);
			}
			return node;
		};
	},

	buildQueryString: function (obj) {
		var
			property,
			queryString;

		queryString = "?";

		for (property in obj) {
			if (!obj.hasOwnProperty(property)) { return; }


			queryString += encodeURIComponent(property) + "=" + encodeURIComponent(obj[property]) + "&";
		}

		return queryString;
	},

	show: function (node) {
		var classes = node.classList;

		classes.add("show");
		classes.add("active");
		classes.remove("hidden");
	},

	hide: function (node) {
		var classes = node.classList;

		classes.remove("show");
		classes.remove("active");
		classes.add("hidden");
	},

	pad00: function (str) {
		str = "" + str;
		while (str.length < 2) {
			str = "0" + str;
		}

		return str;
	}
};

window.Util = Util;

})(this);
