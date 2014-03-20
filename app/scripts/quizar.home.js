function Home(con, users, userId) {
	function enterRoom() {
		var id = $(this).attr("data-id");
		if (id) {
			location.href = "/room/" + id;
		}
	}
	function backToList() {
		var idx = $tab.tabs("option", "active"),
			$el = idx == 0 ? $("#event-future") : $("#event-yours");
		$("#event-detail").hide();
		slideIn($el, "left");
	}
	function showRoomInfo(room) {
		$("#room-detail-enter").attr("data-id", room.id);
		$("#room-detail-name").text(room.name);
		if (room.userQuiz) {
			$("#room-detail-userQuiz").attr("checked", "checked");
		}
		$("#room-detail-description").val(room.description || "");
		if (room.event) {
			$("#room-detail-event").show();
			$("#room-detail-title").text(room.event.title || "-");
			$("#room-detail-date").text(
				room.event.exceDate ? 
					new DateTime(room.event.execDate).datetimeStr() : 
					"-"
			);
			$("#room-detail-capacity").text(room.event.capacity);
			$("#room-detail-description2").val(room.event.description || "");
		} else {
			$("#room-detail-event").hide();
		}
		$tab.find(".tab-pane").hide();
		slideIn($("#event-detail"), "right");
	}
	function bindEvent($el) {
		$el.find("tbody tr").click(function() {
			var room = $.data(this, "room");
			if (room) {
				showRoomInfo(room);
			}
		});
	}
	function buildTable($el, data) {
		var $tbody = $el.find("tbody"),
			cache = {};

		for (var i=0; i<data.length; i++) {
			var room = data[i],
				$tr = $("<tr><td class='event-date'></td><td class='event-title'><img src='" + 
					DEFAULT_IMAGE + "'/></td><td class='event-capacity'></td></tr>"),
				$img = $tr.find("img"),
				date = MSG.undecided,
				title = room.name,
				capacity = "";
			if (room.event) {
				if (room.event.title) {
					title += "(" + room.event.title + ")";
				}
				if (room.event.status == EventStatus.Running) {
					date = MSG.eventRunning;
				} else if (room.event.execDate) {
					date = new DateTime(room.event.execDate).datetimeStr();
				}
				if (room.event.capacity) {
					capacity = "" + room.event.capacity + MSG.people;
				}
			}
			$tr.attr("data-room", room.id);
			$tr.find(".event-date").text(date);
			$tr.find(".event-title").append(title);
			$tr.find(".event-capacity").text(capacity);
			if (users[room.owner]) {
				$img.attr("src", users[room.owner].getMiniImageUrl());
			} else if (cache[room.owner]) {
				$img.attr("data-userId", room.owner);
			} else {
				cache[room.owner] = true;
				$img.attr("data-userId", room.owner);
				con.request({
					"command" : "getUser",
					"data" : room.owner,
					"success" : function(data) {
						var user = new User(data);
						users[user.id] = user;
						$el.find("[data-userId=" + user.id + "]").attr("src", user.getMiniImageUrl()).removeAttr("data-userId");
					}
				})
			}
			$.data($tr[0], "room", room);
			$tbody.append($tr);
		}
	}
	function init($el) {
		var $futures = $("#event-future"),
			$yours = $("#event-yours");
		con.request({
			"command" : "listRoom",
			"data" : {
				"limit" : 10,
				"offset" : 0
			},
			"success" : function(data) {
				buildTable($futures, data);
				bindEvent($futures);
				$tab = $el.find(".tab-content").tabs().show();
			}
		});
		if (userId) {
			con.request({
				"command" : "listRoom",
				"data" : {
					"limit" : 10,
					"offset" : 0,
					"userId" : userId
				},
				"success" : function(data) {
					buildTable($yours, data);
					bindEvent($yours);
				}
			})
		}
		$("#room-detail-enter").click(enterRoom);
		$("#room-detail-back").click(backToList);
	}
	function clear() {
		$tab = null;
	}
	var $tab = null;
	$.extend(this, {
		"init" : init,
		"clear" : clear
	})
}
