function EditEvent(app, context, con) {
	function loadEvent(data) {
		if (data) {
			for (var name in data) {
				var $input = $("#event-" + name);
				if ($input.length) {
					$input.val(data[name]);
				}
			}
			if (data.execDate) {
				var d = new DateTime(data.execDate);
				$("#event-date").val(d.dateStr());
				$("#event-time").val(d.timeStr());
			}
		}
	}
	function collectData() {
		var date = $("#event-date").val(),
			time = $("#event-time").val(),
			ret = {
				"id" : context.eventId || 0,
				"roomId" : context.roomId,
				"status" : context.eventStatus
			};
		$form.find(":input.auto-collect").each(function() {
			var $input = $(this),
				name = $input.attr("id").substring(6),
				value = $input.val();
			if (value) {
				ret[name] = $input.val();
			}
		});
		if (date) {
			if (time) {
				date += " " + time;
			}
			ret["execDate"] = new Date(date).getTime();
		}
		ret.capacity = parseInt(ret.capacity);
		return ret;
	}
	function clearField() {
		$("#event-date").val("");
		$("#event-time").val("");
		$form.find(":input.auto-collect").each(function() {
			var $input = $(this),
				name = $input.attr("id").substring(6);
			if (name != "capacity") {
				$(this).val("");
			}
		});
	}
	function openEvent() {
		if (context.eventStatus != EventStatus.Prepared) {
			return;
		}
		if (!context.eventId) {
			updateEvent(true);
		} else {
			con.request({
				"command" : "openEvent",
				"data" : {
					"id" : context.eventId,
					"admin" : context.userId
				},
				"success" : function(data) {
					if (data) {
						app.showQuestionList();
					} else {
						app.showMessage(MSG.failOpenEvent);
					}
				}
			})
		}
	}
	function updateEvent(start) {
		if (validator && validator.form()) {
			var data = collectData();
			if (data.id) {
				con.request({
					"command" : "updateEvent",
					"data" : data,
					"success" : function() {
						app.showMessage(MSG.successUpdate);
					}
				});
			} else {
				con.request({
					"command" : "createEvent",
					"data" : data,
					"success" : function(data) {
						context.eventId = data.id;
						context.eventStatus = data.status;
						if (start) {
							openEvent();
						} else {
							app.showMessage(MSG.successUpdate);
						}
					}
				});
			}
		}
	}
	function init($el) {
		$form = $el.find("form");
		copyIdToName($form.find(":input"));
		validator = $form.validate({
			"rules" : {
				"event-capacity" : {
					"required" : true,
					"digits" : true
				},
				"event-title" : {
					"maxlength" : 100
				},
				"event-date" : {
					"date" : true
				},
				"event-time" : {
					"time" : true
				},
				"event-passcode" : {
					"maxlength" : 100
				},
				"event-description" : {
					"maxlength" : 400
				}
			},
			"focusInvalid" : true
		});
		optionControl($el);
		$("#event-start-btn").click(openEvent);
		$("#event-update-btn").click(function() {
			updateEvent(false);
		});
		con.request({
			"command" : "getCurrentEvent",
			"success" : loadEvent
		})
	}
	function clear() {
		$form = null;
		validator = null;
	}
	var $form = null,
		validator = null;
	$.extend(this, {
		"init" : init,
		"clear" : clear
	});
}
