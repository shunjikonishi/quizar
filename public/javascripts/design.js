$(function() {
	var sorted = false;
	function randomSortRanking() {
		if (sorted) {
			return;
		}
		var $table = $("#tbl-ranking-current"),
			tds = [];
		$table.find("tbody tr").each(function(index, el) {
			var $td = $(this).find("td:first"),
				num = Math.random();
			tds.push({
				"td" : $td,
				"num" : num
			});
		});
		tds.sort(function(a, b) {
			return a.num < b.num ? -1 : 1;
		})
		for (var i=0; i<tds.length; i++) {
			tds[i].td.text(i+1);
		}
		setTimeout(function() {
			$table.tableSort({
				"sortBy" : ["numeric", "nosort", "nosort", "nosort"]
			});
			$table.find("thead th:first").click();
		}, 100);
		sorted = true;
	}
	function isRoomContent(id) {
		switch (id) {
			case "#home":
			case "#make-room":
				return false;
			default:
				return true;
		}
	}
	function headerControl(id) {
		if (isRoomContent(id)) {
			$("#title").hide();
			$("#room-icons").show();
		} else {
			$("#title").show();
			$("#room-icons").hide();
		}
	}
	function progress(str) {
		function doProgress() {
			n--;
			$progress.css("width", n + "%");
			if (n < 20) {
				$progress.removeClass("progress-bar-warning").addClass("progress-bar-danger");
			} else if (n < 60) {
				$progress.removeClass("progress-bar-success").addClass("progress-bar-warning");
			}
			if (n > 0) {
				setTimeout(doProgress, 100);
			}
		}
		var n = 100,
			idx = 0,
			$text = $("#question-text").hide().text(str),
			$progress = $("#progress");
		$progress.css("width", "100%")
			.removeClass("progress-bar-danger")
			.addClass("progress-bar-success");
		setTimeout(doProgress, 100);
		$text.show("blind", { "direction" : "left"}, 1000);
	}
	function showContent(id, dir) {
		headerControl(id);
		if (id == "#make-room") {
			$("#room-admin").hide();
			$("#btn-make-room").text("作成");
		} else if (id == "#edit-room") {
			$("#room-admin").show();
			$("#btn-make-room").text("変更");
			id = "#make-room";
		}
		dir = dir || "right";
		$("#content > div").hide();
		$(id).show("slide", { "direction" : dir}, 750, function() {
			if (id == "#ranking") {
				randomSortRanking();
			} else if (id == "#question") {
				progress("ソチオリンピックで金メダルを取ったのは羽生結弦ですが、銀メダルを取ったレジェンドと言えば？");
			}
		});
	}
	$("#sidemenu").sidr({
		"onOpen" : function() {
			$("#header").css("left", "260px").find(".header-center").hide();
		},
		"onClose" : function() {
			$("#header").css("left", "0px").find(".header-center").show();
		}
	});
	$("#sidehelp").click(function() {
		showContent("#help");
	})
	$("#btn-question").click(function() {
		showContent("#question");
	})
	$("#btn-ranking").click(function() {
		showContent("#ranking");
	})
	$("#btn-tweet").click(function() {
		showContent("#tweet");
	})
	$("#content").swipe({
		"swipeLeft": function() {
			$.sidr('close');
		},
		"swipeRight": function() {
			$.sidr('open');
		},
		"preventDefaultEvents": false
	})
	$("#content > div").hide();
	//$("#content > div:first-child").show();
	$("#home").show();
	$("#sidr a").click(function() {
		var id = $(this).attr("href");
		headerControl(id);
		$.sidr("close", function() {
			showContent(id);
		});
	})
	$("#tab-ranking a").on("shown.bs.tab", function(e) {
		if ($(e.target).attr("href") == "#ranking-current") {
			randomSortRanking();
		}
	});
	$("#tbl-ranking-event tbody tr").click(function() {
		showContent("#ranking-past");
	})
	$("#tbl-ranking-current tbody tr").click(function() {
		showContent("#ranking-person");
	})
	$(".backToRanking").click(function() {
		showContent("#ranking", "left");
	})
})