$.validator.addMethod("quizChoices", function(value, element) {
	if (!value || value.length == 0) {
		return false;
	}
	var array = value.split("\n").filter(function(v) { return v.length > 0});
	if (array.length <= 1 || array.length > 5) {
		return false;
	}
	return true;
}, MSG.invalidQuizChoices);
$.validator.addMethod("time", function(value, element) {
    return this.optional(element) || /^\d{2}:\d{2}$/.test(value);
}, MSG.invalidTime);
