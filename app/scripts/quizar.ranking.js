function Ranking(app, context, users, con) {
	var EVENT_COLUMNS = ["rank", "username", "correctCount", "time"],
		WINNER_COLUMNS = ["title", ["username", "r-winners"], "correctCount", "time"],
		TOTAL_COLUMNS = ["rank", "username", "point", "correctCount"],
		CLASS_MAP = {
			"username" : "r-name",
			"correctCount" : "r-correct"
		};
	function buildRank($td, rank) {
		if (rank <= 3) {
			$td.html("<span class='badge circle rank-blue'>" + rank + "</span>");
		} else {
			$td.text(rank);
		}
		$td.attr("data-sortAs", rank);
	}
	function createTr(rowData, columns, rank) {
		var $tr = $("<tr></tr>");
		for (var i=0; i<columns.length; i++) {
			var $td = $("<td></td>"),
				colName = columns[i],
				clazz = null;
			if ($.isArray(colName)) {
				clazz = colName[1];
				colName = colName[0];
			}
			if (!clazz) {
				clazz = CLASS_MAP[colName];
			}
			if (!clazz) {
				clazz = "r-" + colName;
			}
			$td.addClass(clazz);
			if (colName == "username" && rowData.username) {
				var $img = $("<img/>");
				$img.attr("src", rowData.imageUrl);
				$td.append($img);
				$td.append(rowData.username);
			} else if (colName == "title") {
				$td.text(rowData.title || new DateTime(rowData.execDate).datetimeStr());
			} else if (colName == "rank") {
				buildRank($td, rank);
			} else if (colName == "time" && rowData.time) {
				$td.text(roundTime(rowData.time));
			} else if (rowData[colName]) {
				$td.text(rowData[colName]);
			}
			$tr.append($td);
		}
		if (!users[rowData.userId]) {
			users[rowData.userId] = new User({
				"id" : rowData.userId,
				"name" : rowData.username,
				"imageUrl" : rowData.imageUrl
			})
		}
		return $tr;
	}
	function buildRanking($table, data, usePrev) {
		var $tbody = $table.find("tbody"),
			cache = {};
		$tbody.empty();
		if (usePrev && prevData) {
			for (var i=0; i<prevData.length; i++) {
				var rowData = prevData[i],
					$tr = createTr(rowData, EVENT_COLUMNS, i+11);
				cache[rowData.userId] = $tr;
				$tbody.append($tr);
			}
		}
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = cache[rowData.userId];
			if ($tr) {
				buildRank($tr.find(".r-rank"), i + 1);
				$tr.find(".r-correct").text(rowData.correctCount);
				$tr.find(".r-time").text(rowData.time + "ms");
			} else {
				$tr = createTr(rowData, EVENT_COLUMNS, i+1);
				$tbody.append($tr);
			}
			$tr.addClass("new");
		}
		if (usePrev) {
			setTimeout(function() {
				$table.tableSort({
					"sortBy" : ["numeric", "nosort", "nosort", "nosort"]
				});
				$table.find("thead th:first").click();
				setTimeout(function() {
					var $oldRows = $tbody.find("tr").not(".new");
					$oldRows.hide("slow", function() {
						$oldRows.remove();
					});
				}, 200);
			}, 200);
			prevData = data;
			nextData = null;
		}
	}
	function buildWinners(data) {
		var $tbody = $("#ranking-event-tbl").find("tbody");
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = createTr(rowData, WINNER_COLUMNS);
			$tbody.append($tr);
		}
	}
	function buildTotal(data) {
		var $tbody = $("#ranking-total-tbl").find("tbody");
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = createTr(rowData, TOTAL_COLUMNS, i+1);
			$tbody.append($tr);
		}
	}
	function init($el) {
		$tableNow = $("#ranking-now-tbl");
		if (context.isEventRunning()) {
			con.request({
				"command" : "getEventRanking",
				"data" : {
					"eventId" : context.eventId,
					"limit" : 10
				},
				"success" : function(data) {
					if (data.length) {
						nextData = data;
						$tab.show();
					}
				}
			})
		} else {
			$(".ranking-now").hide();
		}
		con.request({
			"command" : "getEventWinners",
			"data" : {
				"roomId" : context.roomId,
				"limit" : 10
			},
			"success" : buildWinners
		});
		con.request({
			"command" : "getTotalRanking",
			"data" : {
				"roomId" : context.roomId,
				"limit" : 10
			},
			"success" : buildTotal
		})
		$tab = $("#ranking-tab").tabs({
			"active" : context.isEventRunning() ? 0 : 1
		}).show();
	}
	function afterShow() {
		if (nextData) {
			buildRanking($tableNow, nextData, true);
		}
	}
	function clear() {
		$tab = null;
		$tableNow = null;
		console.log("Ranking#clear");
	}
	var prevData = null,
		nextData = null,
		$tab = null,
		$tableNow = null;
	$.extend(this, {
		"init" : init,
		"afterShow" : afterShow,
		"clear" : clear
	})

}
