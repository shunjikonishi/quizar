function Home(con, users) {
	function bindEvent($el) {
		$el.find("tbody tr").click(function() {
			var id = $(this).attr("data-room");
			if (id) {
				location.href = "/room/" + id;
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
				$el.find(".tab-content").tabs().show();
			}
		})
	}
	function clear() {
	}
	$.extend(this, {
		"init" : init,
		"clear" : clear
	})
}
