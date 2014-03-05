if (typeof(flect) === "undefined") flect = {};

$(function() {
	var SUPPORTS_TOUCH = 'ontouchstart' in window,
		TemplateLogic = {
			"make-room" : {
				"before" : function($el) {
					$("#room-admin").hide();
					$("#btn-make-room").text(MSG.create);
				}
			},
			"edit-room" : {
				"before" : function($el) {
					$("#room-admin").show();
					$("#btn-make-room").text(MSG.update);
				},
				"name" : "make-room"
			}
		};
	function DebuggerWrapper() {
		var impl = null;
		function log(type, value, time) {
			if (impl) {
				impl.log(type, value, time);
			}
		}
		function setImpl(v) {
			impl = v;
		}
		$.extend(this, {
			"log" : log,
			"setImpl" : setImpl
		})
	}
	function PageDebugger($el) {
		var MAX_LOG = 10;
		function log(type, value, time) {
			if (cnt > MAX_LOG) {
				$tbody.find("tr:first").remove();
			}
			var $tr = $("<tr><td></td><td></td><td><div class='pull-right'></div></td></tr>"),
				$td = $tr.find("td");
			$($td.get(0)).text(type);
			$($td.get(1)).text(value);
			if (time) {
				$($td.get(2)).find("div").text(time);
			}
			$tbody.append($tr);
		}
		var $tbody = $el.find("table tbody"),
			cnt = 0;
		$.extend(this, {
			"log" : log
		})
	}
	flect.QuizApp = function(params) {
		function showStatic(id) {
			$.sidr("close", function() {
				$content.children("div").hide();
				$("#" + id).show("slide", { "direction" : "right"}, 750);
			});
		}
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
		var debug = new DebuggerWrapper(),
			con = new flect.Connection(params.uri, debug),
			templateManager = new flect.TemplateManager(con, $("#content-dynamic")),
			$content = $("#content");

		if (params.devMode) {
			if (window.sessionStorage) {
				sessionStorage.clear();
			}
		}
		con.polling(25000, {
			"command" : "noop",
			"log" : "user=" + (params.username ? params.username : "(Anonymous)")
		})
		if (params.debug) {
			var $btnDebug = $("#btn-debug").show();
			con.ready(function() {
				templateManager.loadTemplate("debug", function(data) {
					$content.append(data);
					debug.setImpl(new PageDebugger($("#debug")));
					$btnDebug.find("a").click(function() {
						showStatic("debug");
						return false;
					});
					con.onRequest(function(command, data) {
						var value = command + ", " + JSON.stringify(data);
						debug.log("send", value, "");
					}).onMessage(function(data, startTime) {
						var now = new Date().getTime();
						debug.log("receive", JSON.stringify(data), now - startTime);
					})
					$("#chk-use-ajax").click(function() {
						var useAjax = $(this).is(":checked");
						if (useAjax) {
							con.useAjax("/ajax");
						} else {
							con.useAjax(false);
						}
					}).bootstrapSwitch();
				});
			});
		}
		$("#sidr a.dynamic").click(function() {
			var id = $(this).attr("href").substring(1),
				params = $.extend({
					"name" : id
				}, TemplateLogic[id]);;
			$.sidr("close", function() {
				$content.children("div").hide();
				templateManager.show(params);
			});
			return false;
		})
	}
});