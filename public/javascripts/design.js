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
	$("#content > div:first-child").show();
	$("#sidr a").click(function() {
		var id = $(this).attr("href");
		$("#content > div").hide();
		$.sidr("close", function() {
			$(id).show("slide", { "direction" : "right"}, 750, function() {
				if (id == "#ranking") {
					randomSortRanking();
				}
			});
		});
	})
	$("#tab-ranking a").on("shown.bs.tab", function(e) {
		if ($(e.target).attr("href") == "#ranking-current") {
			randomSortRanking();
		}
	})
})