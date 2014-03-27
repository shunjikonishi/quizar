function Mypage(app, context, users, con) {
	var ENTRY_COLUMNS = ["r-room", "r-point", "r-correct"],
		OWNER_COLUMNS = ["r-room", "r-event", "r-question"],
		EVENT_COLUMNS = ["r-title", "r-point", "r-correct"],
		OWNER_EVENT_COLUMNS = ["r-title", "r-member", "r-publish"],
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
				} else if (clazz == "r-member") {
					$td.text(MSG.format(MSG.numberWithPeople, rowData.userCount));
				} else if (clazz == "r-publish") {
					$td.text(rowData.publishCount);
				} else if (clazz == "q-correct") {
					if (rowData.userAnswer) {
						var icon = rowData.correct ? "fa-circle-o" : "fa-times",
							$i = $("<i class='fa'></i>");
						$i.addClass(icon);
						$td.append($i);
					}
				}
				if (rowData.owner && !users[rowData.owner]) {
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
	function buildEvents(roomInfo, events) {
		var $tbody = $("#mypage-events tbody");
		$("#mypage-events-roomName").text(roomInfo.name);
		$("#mypage-events-total").text(roomInfo.rank ? roomInfo.rank : "-");
		buildTable($tbody, EVENT_COLUMNS, events);
		$tbody.find("tr").click(showQuestions);
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
					$total.text(MSG.format(MSG.numberWithRank, data));
				}
				roomInfo = {
					"id" : room.roomId,
					"name" : room.roomName,
					"rank" : data
				}
			}
		})
	}
	function buildOwnersEvents(roomInfo, events) {
		var $tbody = $("#mypage-owners-events tbody");
		$("#mypage-owners-events-roomName").text(roomInfo.name);
		buildTable($tbody, OWNER_EVENT_COLUMNS, events);
		$tbody.find("tr").click(showQuestions);
	}
	function showOwnersEvents() {
		var room = $.data(this, "obj");
		$("#mypage-owners-events-roomName").text(room.roomName);
		con.request({
			"command" : "getEventWithCount",
			"data" : room.roomId,
			"success" : function(data) {
				var $pane = $("#mypage-owners-events"),
					$tbody = $pane.find("tbody");
				
				var newData = [];
				for (var i=0; i<data.length; i++) {
					var event = data[i].event;
					event.eventId = event.id;
					event.userCount = data[i].userCount;
					event.publishCount = data[i].publishCount;
					newData.push(event);
				}
				roomInfo = {
					"id" : room.roomId,
					"name" : room.roomName
				};
				events = newData;
				buildTable($tbody, OWNER_EVENT_COLUMNS, newData);
				$tab.find(".tab-pane").hide();
				$tbody.find("tr").click(showQuestions);
				slideIn($pane, "right");
			}
		});
	}
	function buildQuestions(questions) {
		var $tbody = $("#mypage-questions tbody");
		buildTable($tbody, QUESTION_COLUMNS, questions);
		$tbody.find("tr").click(showLookback);
	}
	function showQuestions() {
		var event = $.data(this, "obj");
console.log("test1: " + event.eventId);
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
				$tbody.find("tr").click(showLookback);
				$tab.find(".tab-pane").hide();
				slideIn($pane, "right");
			}
		});
	}
	function showLookback() {
		var q = $.data(this, "obj");
		con.request({
			"command" : "getLookback",
			"data" : q.publishId,
			"success" : function(data) {
				data.userAnswer = q.userAnswer;
				app.showLookback(data);
			}
		})
	}
	function init($el) {
		$tab = $el.find(".tab-content").tabs({
			"beforeActivate" : function() {
				$tab.find(".tab-pane").hide();
			}
		}).show();
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
				$tbody.find("tr").click(showOwnersEvents);
			}
		});
		$("#mypage-events-back").click(function() {
			roomInfo = null;
			events = null;
			$tab.find(".tab-pane").hide();
			slideIn($("#mypage-entries"), "left");
		})
		$("#mypage-owners-events-back").click(function() {
			roomInfo = null;
			events = null;
			$tab.find(".tab-pane").hide();
			slideIn($("#mypage-owners"), "left");
		})
		$("#mypage-questions-back").click(function() {
			questions = null;
			$tab.find(".tab-pane").hide();
			if (roomInfo.rank) {
				slideIn($("#mypage-events"), "left");
			} else {
				slideIn($("#mypage-owners-events"), "left");
			}
		})
		if (roomInfo && events) {
			if (!roomInfo.rank) {
				$tab.tabs("option", "active", 1);
			}
			$tab.find(".tab-pane").hide();
			if (roomInfo.rank) {
				buildEvents(roomInfo, events);
			} else {
				buildOwnersEvents(roomInfo, events);
			}
			if (questions) {
				buildQuestions(questions);
				$("#mypage-questions").show();
			} else if (roomInfo.rank) {
				$("#mypage-events").show();
			} else {
				$("#mypage-owners-events").show();
			}
		}
	}
	function clear() {
		$tab = null;
	}
	function reset() {
		roomInfo = null;
		events = null;
		questions = null;
	}
	var $tab = null,
		roomInfo = null,
		events = null,
		questions = null;
	$.extend(this, {
		"init" : init,
		"clear" : clear,
		"reset" : reset
	})
}
