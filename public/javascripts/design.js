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
	function showContent(id, dir) {
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
			}
		});
	}
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
	})
	$("#content > div").hide();
	//$("#content > div:first-child").show();
	$("#make-room").show();
	$("#sidr a").click(function() {
		var id = $(this).attr("href");
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