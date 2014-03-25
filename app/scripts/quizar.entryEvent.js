function EntryEvent(app, context, con) {
	function isEnable() {
		return context.isEventRunning() && !context.isEntryEvent();
	}
	function openEvent() {
		if (isEnable()) {
			$(".entry-event").show();
		}
	}
	function closeEvent() {
		$(".entry-event").hide();
	}
	function doEntry(passcode) {
		var data = {
			"userId" : context.userId,
			"username" : context.username,
			"userImage" : context.userImage,
			"eventId" : context.eventId
		};
		if (passcode) {
			data.passcode = passcode;
		}
		con.request({
			"command" : "entryEvent",
			"data" : data,
			"success" : function(data) {
				if (data.error) {
					app.showMessage(data.error);
				} else if (data.requirePass) {
					app.showPasscode();
				} else if (data.userEventId) {
					context.userEventId = data.userEventId;
					if (passcode) {
						app.showChat();
					}
				} else {
					alert("Invalid data: " + JSON.stringify(data));
				}
			}
		})
	}
	function entry() {
		if (isEnable()) {
			doEntry();
			$("#entry-event-alert").hide();
		}
	}
	function init($el) {
		$("#event-passcode-btn").click(function() {
			var passcode = $("#event-passcode-user").val();
			if (passcode) {
				doEntry(passcode);
			} else {
				app.showMessage(MSG.invalidPasscode);
			}
		})
		$("#event-cancel-btn").click(function() {
			app.showChat();
		})
	}
	function clear() {

	}
	$(".entry-event-btn").click(entry);
	$("#not-entry-event").click(function() {
		$("#entry-event-alert").hide();
	});
	if (isEnable()) {
		openEvent();
	}
	$.extend(this, {
		"init" : init,
		"clear" : clear,
		"openEvent" : openEvent,
		"closeEvent" : closeEvent
	})
}
