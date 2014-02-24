$(function() {
	$("#sidemenu").sidr({
		"onOpen" : function() {
			$("#header").css("left", "260px").find(".sidemenu-collapse").hide();
		},
		"onClose" : function() {
			$("#header").css("left", "0px").find(".sidemenu-collapse").show();
		}
	});
	$("#content").swipe({
		"swipeLeft": function() {
			$.sidr('close');
		},
		"swipeRight": function() {
			$.sidr('open');
		},
		"preventDefaultEvents": false
	});
})