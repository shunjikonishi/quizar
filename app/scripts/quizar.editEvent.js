function EditEvent(app, roomId, con) {
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
			eventId = data.id;
			eventStatus = data.status;
			$toggleBtn.text(eventStatus == EventStatus.Prepared ? MSG.start : MSG.finish);;
		} else {
			$toggleBtn.text(MSG.start);;
		}
	}
	function collectData() {
		var date = $("#event-date").val(),
			time = $("#event-time").val(),
			ret = {
				"id" : eventId || 0,
				"roomId" : roomId,
				"status" : eventStatus
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
		if (eventStatus != EventStatus.Prepared) {
			return;
		}
		if (!eventId) {
			updateEvent(true);
		} else {
			con.request({
				"command" : "openEvent",
				"data" : eventId,
				"success" : function(data) {
					if (data) {
						eventStatus = EventStatus.Running;
						$toggleBtn.text(MSG.finish);
						app.showQuestionList();
					} else {
						app.showMessage(MSG.failOpenEvent);
					}
				}
			})
		}
	}
	function closeEvent() {
		if (!eventId || eventStatus != EventStatus.Running) {
			return;
		}
		con.request({
			"command" : "closeEvent",
			"data" : eventId,
			"success" : function(data) {
				if (data) {
					eventId = 0;
					eventStatus = EventStatus.Prepared;
					clearField();
					$toggleBtn.text(MSG.start);
				}
			}
		})
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
						eventId = data.id;
						eventStatus = data.status;
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
		$toggleBtn = $("#event-toggle-btn").click(function() {
			if (eventStatus == EventStatus.Prepared) {
				openEvent();
			} else if (eventStatus == EventStatus.Running) {
				closeEvent();
			}
		})
		$("#event-update-btn").click(function() {
			updateEvent(false);
		});
		con.request({
			"command" : "getCurrentEvent",
			"success" : loadEvent
		})
	}
	function setEventStatus(id, status) {
		eventId = id;
		eventStatus = status;
	}
	function clear() {
		$form = null;
		validator = null;
		$toggleBtn = null;
	}
	var $form = null,
		validator = null,
		$toggleBtn = null,
		eventId = 0;
		eventStatus = EventStatus.Prepared;
	$.extend(this, {
		"init" : init,
		"clear" : clear
	});
}
