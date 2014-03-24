function Mypage(app, context, users, con) {
	var ENTRY_COLUMNS = ["r-room", "r-point", "r-correct"],
		OWNER_COLUMNS = ["r-room", "r-event", "r-question"],
		EVENT_COLUMNS = ["r-title", "r-point", "r-correct"],
		QUESTION_COLUMNS = ["q-text", "q-correct"];

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
	function buildTable($tbody, columns, data) {
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = $("<tr></tr>");
			for (var j=0; j<columns.length; j++) {
				var clazz = columns[j],
					$td = $("<td></td>");
				$td.addClass(clazz);
				if (clazz == "r-room") {
					var $img = $("<img/>");
					$img.attr("src", rowData.ownerImage);
					$td.append($img);
					$td.append(rowData.roomName);
				} else if (clazz == "r-title") {
					$td.text(rowData.title || new DateTime(rowData.execDate).datetimeStr());
				} else if (clazz == "r-point") {
					$td.text(rowData.point);
				} else if (clazz == "r-correct") {
					$td.text(rowData.correctCount);
				} else if (clazz == "r-event") {
					$td.text(rowData.eventCount);
				} else if (clazz == "r-question") {
					$td.text(rowData.questionCount);
				} else if (clazz == "q-text") {
					$td.text(rowData.question);
				} else if (clazz == "q-correct") {
					if (rowData.answered) {
						var icon = rowData.correct ? "fa-circle-o" : "fa-times",
							$i = $("<i class='fa'></i>");
						$i.addClass(icon);
						$td.append($i);
					}
				}
				if (!users[rowData.owner]) {
					users[rowData.owner] = new User({
						"id" : rowData.owner,
						"name" : rowData.ownerName,
						"imageUrl" : rowData.ownerImage
					});
				}
				$tr.append($td);
			}
			$tbody.append($tr);
			$.data($tr[0], "obj", rowData);
		}
	}
	function enterRoom() {
		var room = $.data(this, "obj");
		location.href = "/room/" + room.roomId;
	}
	function buildEvents(roomInfo, events) {
		$("#mypage-events-roomName").text(roomInfo.name);
		$("#mypage-events-total").text(roomInfo.rank ? roomInfo.rank : "-");
		buildTable($("#mypage-events tbody"), EVENT_COLUMNS, events);
	}
	function showEvents() {
		var room = $.data(this, "obj"),
			$total = $("#mypage-events-total");
		$total.text("-");
		con.request({
			"command" : "getUserEvent",
			"data" : {
				"roomId" : room.roomId,
				"userId" : context.userId
			},
			"success" : function(data) {
				var $pane = $("#mypage-events"),
					$tbody = $pane.find("tbody");
				
				events = data;
				$("#mypage-events-roomName").text(room.roomName);
				buildTable($tbody, EVENT_COLUMNS, data);
				$tab.find(".tab-pane").hide();
				$tbody.find("tr").click(showQuestions);
				slideIn($pane, "right");
			}
		});
		con.request({
			"command" : "getUserTotalRanking",
			"data" : {
				"roomId" : room.roomId,
				"userId" : context.userId
			},
			"success" : function(data) {
				if (data) {
					$total.text(data);
				}
				roomInfo = {
					"id" : room.roomId,
					"name" : room.roomName,
					"rank" : data
				}
			}
		})
	}
	function showQuestions() {
		var event = $.data(this, "obj");
console.log(event);
		con.request({
			"command" : "getEventQuestions",
			"data" : {
				"eventId" : event.eventId,
				"userId" : context.userId
			},
			"success" : function(data) {
				var $pane = $("#mypage-questions"),
					$tbody = $pane.find("tbody");
				
				questions = data;
				buildTable($tbody, QUESTION_COLUMNS, data);
				$tab.find(".tab-pane").hide();
				slideIn($pane, "right");
			}
		});
	}
	function init($el) {
		con.request({
			"command" : "entriedRooms",
			"data" : {
				"limit" : 100,
				"offset" : 0,
				"userId" : context.userId
			},
			"success" : function(data) {
				var $tbody = $("#mypage-entries tbody");
				buildTable($tbody, ENTRY_COLUMNS, data);
				$tbody.find("tr").click(showEvents);
				$tab = $el.find(".tab-content").tabs({
					"beforeActivate" : function() {
						$tab.find(".tab-pane").hide();
					}
				}).show();
			}
		});
		con.request({
			"command" : "ownedRooms",
			"data" : {
				"limit" : 100,
				"offset" : 0,
				"userId" : context.userId
			},
			"success" : function(data) {
				var $tbody = $("#mypage-owners tbody");
				buildTable($tbody, OWNER_COLUMNS, data);
				$tbody.find("tr").click(enterRoom);
			}
		});
		$("#mypage-events-back").click(function() {
			roomInfo = null;
			events = null;
			$tab.find(".tab-pane").hide();
			slideIn($("#mypage-entries"), "left");
		})
		$("#mypage-questions-back").click(function() {
			questions = null;
			$tab.find(".tab-pane").hide();
			slideIn($("#mypage-events"), "left");
		})
	}
	function clear() {
		$tab = null;
	}
	var $tab = null,
		roomInfo = null,
		events = null,
		questions = null;
	$.extend(this, {
		"init" : init,
		"clear" : clear
	})
}
