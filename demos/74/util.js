(function (exports) {

exports.Util = {
	cycle: function (array, index) {
		var len = array.length;

		index %= len;
		if (index < 0) { index += len }

		return array[index];
	}
};

})(window);
