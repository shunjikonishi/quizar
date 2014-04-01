function Ranking(app, context, users, con) {
	var EVENT_COLUMNS = ["rank", "username", "correctCount", "time"],
		WINNER_COLUMNS = ["title", ["username", "r-winners"], "correctCount", "time"],
		TOTAL_COLUMNS = ["rank", "username", "point", "correctCount"],
		USER_COLUMNS = ["title", "rank", "point", "correctCount"],
		CLASS_MAP = {
			"username" : "r-name",
			"correctCount" : "r-correct"
		};
	function buildRank($td, rank, correctCount) {
		if (!correctCount) {
			$td.text("-");
		} else if (rank <= 3) {
			$td.html("<span class='badge circle rank-blue'>" + rank + "</span>");
		} else {
			$td.text(rank);
		}
		$td.attr("data-sortAs", rank);
	}
	function showEventRanking() {
		var $tr = $(this),
			eventId = parseInt($tr.attr("data-eventId"));
		con.request({
			"command" : "getEventRanking",
			"data" : {
				"eventId" : eventId,
				"limit" : 10
			},
			"success" : function(data) {
				buildRanking($("#ranking-event-detail-tbl"), data);
				$tab.find(".tab-pane").hide();
				$("#ranking-event-detail").show("slide", { "direction" : "right"}, EFFECT_TIME);
			}
		})
	}
	function showUserEvent() {
		var $tr = $(this),
			userId = parseInt($tr.attr("data-userId")),
			user = users[userId];

		con.request({
			"command" : "getUserEvent",
			"data" : {
				"roomId" : context.roomId,
				"userId" : userId
			},
			"success" : function(data) {
				buildUserEvent(data);
				$("#ranking-user-img").attr("src", user.getBiggerImageUrl());
				$("#ranking-user-name").text(user.name);
				$("#ranking-user-point").text($tr.attr("data-point"));

				$tab.find(".tab-pane").hide();
				$("#ranking-user").show("slide", { "direction" : "right"}, EFFECT_TIME);
			}
		})
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
				buildRank($td, rank, rowData.correctCount);
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
				buildRank($tr.find(".r-rank"), i + 1, rowData.correctCount);
				$tr.find(".r-correct").text(rowData.correctCount);
				$tr.find(".r-time").text(roundTime(rowData.time));
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
				$tr = null;
			if (rowData.eventId == context.eventId) {
				continue;
			}
			$tr = createTr(rowData, WINNER_COLUMNS);
			$tr.attr("data-eventId", rowData.eventId);
			$tr.click(showEventRanking);
			$tbody.append($tr);
		}
	}
	function buildTotal(data) {
		var $tbody = $("#ranking-total-tbl").find("tbody");
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = createTr(rowData, TOTAL_COLUMNS, i+1);
			$tr.attr("data-userId", rowData.userId);
			$tr.attr("data-point", rowData.point);
			$tr.click(showUserEvent);
			$tbody.append($tr);
		}
	}
	function buildUserEvent(data) {
		function getEventTitle(eventId) {
			for (var i=0; i<$events.length; i++) {
				var $tr = $($events[i]);
				if ($tr.attr("data-eventId") == eventId) {
					return $tr.find(".r-title").text();
				}
			}
			return "Unknown";
		}
		var $tbody = $("#ranking-user-tbl").find("tbody"),
			$events = $("#ranking-event-tbl").find("tbody tr");
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = null,
				rank = rowData.point > 0 ? 10 - rowData.point + 1 : "-";
			if (rowData.eventId == context.eventId) {
				continue;
			}
			rowData.title = getEventTitle(rowData.eventId);
			$tr = createTr(rowData, USER_COLUMNS, rank);
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
					}
					if (showed) {
						buildRanking($tableNow, nextData, true);
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
		$("#ranking-event-detail-back").click(function() {
			$tab.find(".tab-pane").hide();
			$("#ranking-event").show("slide", { "direction" : "left"}, EFFECT_TIME);
		});
		$("#ranking-user-back").click(function() {
			$tab.find(".tab-pane").hide();
			$("#ranking-total").show("slide", { "direction" : "left"}, EFFECT_TIME);
		});
		backButtonControl($("#ranking-event-detail"));
		backButtonControl($("#ranking-user"));
		$tab = $("#ranking-tab").tabs({
			"active" : context.isEventRunning() ? 0 : 1,
			"beforeActivate" : function() {
				$tab.find(".tab-pane").hide();
			}
		}).show();
	}
	function afterShow() {
		if (nextData) {
			buildRanking($tableNow, nextData, true);
		}
		showed = true;
	}
	function clear() {
		$tab = null;
		$tableNow = null;
		showed = false;
	}
	var prevData = null,
		nextData = null,
		$tab = null,
		$tableNow = null,
		showed = false;
	$.extend(this, {
		"init" : init,
		"afterShow" : afterShow,
		"clear" : clear
	})

}
