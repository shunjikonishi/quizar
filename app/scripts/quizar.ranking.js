function Ranking(app, context, users, con) {
	var EVENT_COLUMNS = ["rank", "username", "correctCount", "time"];
	function createTr(rowData, columns, rank) {
		var $tr = $("<tr></tr>");
		for (var i=0; i<columns.length; i++) {
			var $td = $("<td></td>"),
				colName = columns[i];
			$td.addClass(colName);
			if (colName == "username") {
				var $img = $("<img/>");
				$img.attr("src", rowData.img);
				$td.append($img);
				$td.append(rowData.username);
			} else if (colName == "rank") {
				$td.text(rank);
			} else if (colName == "time") {
				$td.text(rowData.time + "ms");
			} else {
				$td.text(rowData[colName]);
			}
			$tr.append($td);
		}
		if (!users[rowData.userId]) {
			users[rowData.userId] = new User({
				"id" : rowData.userId,
				"name" : rowData.username,
				"imageUrl" : rowData.img
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
				$tr.find(".rank").text(i+1);
				$tr.find(".correctCount").text(rowData.correctCount);
				$tr.find(".time").text(rowData.time + "ms");
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

	}
	function buildTotal(data) {

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
			$("#ranking-now").hide();
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
		$tab = $("#ranking-tab").tabs().show();
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
