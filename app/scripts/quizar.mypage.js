function Mypage(app, context, users, con) {
	function buildTable(data) {
		var $entries = $("#mypage-entries tbody"),
			$owners = $("#mypage-owners tbody"),
			cache = {};

		for (var i=0; i<data.length; i++) {
			var room = data[i],
				$tr = $("<tr><td class='event-title'><img src='" + 
					DEFAULT_IMAGE + "'/></td></tr>"),
				$img = $tr.find("img");
			$tr.find(".event-title").append(room.name);
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
			if (room.owner == context.userId) {
				$owners.append($tr);
			} else {
				$entries.append($tr);
			}
		}
	}
	function init($el) {
		con.request({
			"command" : "listRoom",
			"data" : {
				"limit" : 10,
				"offset" : 0,
				"userId" : context.userId
			},
			"success" : function(data) {
				buildTable(data);
				$tab = $el.find(".tab-content").tabs().show();
			}
		});
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
