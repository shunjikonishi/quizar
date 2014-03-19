function MakeQuestion(app, context, con) {
	function clearField() {
		$("#make-q-question").val("");
		$("#make-q-answers").val("");
		$("#make-q-answerType").val(AnswerType.FirstRow);
		$("#make-q-tags").val("");
		$("#make-q-description").val("");
		$("#make-q-relatedUrl").val("");
	}
	function collectField() {
		var data = {
			"id" : 0,
			"roomId" : context.roomId,
			"createdBy" : context.userId
		};
		if (editQuestion) {
			data.id = editQuestion.id;
			data.createdBy = editQuestion.createdBy;
		}
		$form.find(":input").each(function() {
			var $input = $(this),
				name = getParameterName($input),
				value = $input.val();
			if (name == "answerType") {
				value = parseInt(value);
			}
			data[name] = value;
		});
		data.answers = normalizeMultiline(data.answers);
		return data;
	}
	function getParameterName($input) {
		return $input.attr("id").substring(7)
	}
	function openEvent() {
		if (arguments.length == 0) {
			return eventId;
		} else {
			eventId = arguments[0];
			return this;
		}
	}
	function closeEvent() {
		eventId = 0;
		return this;
	}
	function update() {
		if (editQuestion && editQuestion.publishCount > 0) {
			app.showMessage("Can not update published question");
		}
		if (validator && validator.form()) {
			var q = collectField();
			if (editQuestion) {
				con.request({
					"command" : "updateQuestion",
					"data" : q,
					"success" : function(data) {
						editQuestion = q;
						if (!eventId) {
							app.showQuestionList("left");
						} else {
							app.showMessage(MSG.successUpdate);
						}
						enableInput($btnPublish, true);
					}
				});
			} else {
				con.request({
					"command" : "createQuestion",
					"data" : q,
					"success" : function(data) {
						if (context.isRoomAdmin()) {
							editQuestion = data;
							if (context.isEventAdmin()) {
								app.showMessage(MSG.successUpdate);
								$btnUpdate.text(MSG.update);
								$publish.show("slow");
								enableInput($btnPublish, true);
							} else {
								app.showQuestionList("left");
							}
						} else {
							app.showMessage(MSG.questionPosted);
							clearField();
						}
					}
				});
			}
		}
	}
	function publish() {
		con.request({
			"command" : "publishQuestion",
			"data" : {
				"questionId" : editQuestion.id,
				"eventId" : eventId,
				"includeRanking" : $includeRank.is(":checked")
			},
			"success" : function(data) {
				if (data != "OK") {
					app.showMessage(data);
				}
			}
		})
	}
	function enableIncludeRank(b) {
		enableInput($includeRank, b);
		if (!b) {
			$includeRank.removeAttr("checked");
		}
	}
	function init($el) {
		$form = $("#make-q-form");
		copyIdToName($form.find(":input")).each(function() {
			var $input = $(this);
			if (editQuestion) {
				var name = getParameterName($input);
				if (editQuestion[name]) {
					$input.val(editQuestion[name]);
				}
			}
		})
		validator = $form.validate({
			"rules" : {
				"make-q-question" : {
					"required" : true
				},
				"make-q-answers" : {
					"quizChoices" : true,
					"required" : true
				},
				"make-q-tags" : {
					"maxlength" : 100
				},
				"make-q-relatedUrl" : {
					"url" : true,
					"maxlength" : 256
				}
			},
			"focusInvalid" : true
		});
		$form.find(":input").change(function() {
			enableInput($btnPublish, false);
		})
		$btnUpdate = $("#make-q-update-btn").click(update);
		$publish = $("#make-q-publish");
		$includeRank = $("#make-q-includeRank");
		if (editQuestion && eventId) {
			$publish.show();
		}
		$btnPublish = $("#make-q-publish-btn").click(publish);
		optionControl($el);
		if (editQuestion) {
			$("#make-q-desc").text(eventId ? MSG.editAndPublishQuestion : MSG.editQuestion);
			$btnUpdate.text(MSG.update);
			if (editQuestion.publishCount > 0) {
				enableInput($form.find(":input"), false);
				enableInput($btnUpdate, false);
			}
			if (editQuestion.answerType == AnswerType.NoAnswer) {
				enableIncludeRank(false);
			}
		}
		$("#make-q-answerType").change(function() {
			var value = $(this).val();
			enableIncludeRank(value != AnswerType.NoAnswer);
		});
		if (context.isRoomAdmin()) {
			$("#make-q-back-btn").click(function() {
				app.showQuestionList("left");
			}).show();
		} else {
			$btnUpdate.text(MSG.post);
		}
	}
	function clear() {
		editQuestion = null;
		$form = null;
		$btnUpdate = null;
		$btnPublish = null;
		$includeRank = null;
		$publish = null;
		validator = null;
	}
	var eventId = 0,
		editQuestion = null,
		$form = null,
		$btnUpdate = null,
		$btnPublish = null,
		$includeRank = null,
		$publish = null,
		validator = null;
	$.extend(this, {
		"openEvent" : openEvent,
		"closeEvent" : closeEvent,
		"init" : init,
		"clear" : clear,
		"edit" : function(q) { editQuestion = q;}
	})
}
