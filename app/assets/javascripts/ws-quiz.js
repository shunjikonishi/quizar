if (typeof(flect) === "undefined") flect = {};

$(function() {
	var SUPPORTS_TOUCH = 'ontouchstart' in window;
	flect.QuizApp = function(params) {
		$("#btn-menu").sidr({
			"onOpen" : function() {
				$("#toolbar").css("left", "260px").find(".header-center").hide();
			},
			"onClose" : function() {
				$("#toolbar").css("left", "0px").find(".header-center").show();
			}
		});
		$("#content").swipe({
			"swipeLeft": function(e) {
				$.sidr('close');
			},
			"swipeRight": function() {
				$.sidr('open');
			},
			"tap": function (event, target) {
				if (SUPPORTS_TOUCH) {
					$(target).click();
				}
			}
		})
		var con = new flect.connection(params.uri);

		if (params.uri)



		var item = sessionStorage.getItem("test");
		$("#test1").append(item);
		sessionStorage.setItem("test", "hoge: " + new Date());
		item = sessionStorage.getItem("test");
		$("#test2").append(item);
		$("#test3").click(function() {
			con.request({
				"command" : "echo",
				"data" : "hoge",
				"success" : function(data) {
					console.log(data);
				}
			})
		})
	}
});