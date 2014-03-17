function DateTime() {
	function dateStr() {
		var y = value.getFullYear(),
			m = value.getMonth() + 1,
			d = value.getDate();
		if (m < 10) {
			m = "0" + m;
		} 
		if (d < 10) {
			d = "0" + d;
		} 
		return y + "-" + m + "-" + d;
	}
	function timeStr() {
		var h = value.getHours(),
			m = value.getMinutes();
		if (h < 10) {
			h = "0" + h;
		}
		if (m < 10) {
			m = "0" + m;
		}
		return h + ":" + m;
	}
	function datetimeStr() {
		return dateStr().substring(5) + " " + timeStr();
	}
	function getTime() {
		return value.getTime();
	}
	var value;
	switch (arguments.length) {
		case 1: 
			value = new Date(arguments[0]);
			break;
		case 2:
			value = new Date(arguments[0] + " " + arguments[1]);
			break;
	}
	$.extend(this, {
		"dateStr" : dateStr,
		"timeStr" : timeStr,
		"datetimeStr" : datetimeStr,
		"getTime" : getTime
	})
}
