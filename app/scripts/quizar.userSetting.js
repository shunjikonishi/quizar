function UserSetting(app, context, users, con) {
	function update() {
		var username = $("#user-name").val();
		if (username && username != context.username) {
			con.request({
				"command" : "updateUser",
				"data" : {
					"userId" : context.userId,
					"name" : username
				},
				"success" : function(data) {
					if (data) {
						app.showMessage(MSG.successUpdate);
						setTimeout(function() {
							var href = context.isInRoom() ? "/room/" + context.roomId : "/";
							location.href = href;
						}, 3000);
					}
				}
			})
		}
	}
	function init() {
		$("#user-name").val(context.username);
		if (context.notifyTweet) {
			$("#user-notify-tweet").attr("checked", "checked");
		}
		$("#user-notify-tweet").change(function() {
			var b = $(this).is(":checked");
			context.setNotifyTweet(b);
		})
		$("#btn-user-setting").click(update);
	}
	function clear() {
	}
	$.extend(this, {
		"init" : init,
		"clear" : clear
	})
}