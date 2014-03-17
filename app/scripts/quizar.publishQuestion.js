function PublishQuestion(app, context, con) {
	var TIMELIMIT = 10000,
		BUTTON_COUNT = 5;
	function showAnswerCounts() {
		if ($buttons) {
			for (var i=0; i<BUTTON_COUNT; i++) {
				var idx = "" + (i+1),
					cnt = answerCounts[idx] || 0;
				$("#answer-" + idx).find(".answer-cnt").text(cnt);
			}
		}
	}
	function answer() {
		var time = new Date().getTime() - startTime,
			$btn = $(this),
			n = parseInt($btn.attr("id").substring(7));
		if (answered) {
			return;
		}
		$btn.addClass("btn-primary");
		answered = true;
		enableInput($buttons, false);
		$answerBtn = $btn;
		if (time > TIMELIMIT) {
			app.showMessage("timeLimitExceeded");
			return;
		}
		con.request({
			"command" : "answer",
			"data" : {
				"userId" : context.userId,
				"publishId" : question.id,
				"eventId" : context.eventId,
				"userEventId" : context.userEventId,
				"answer" : n,
				"time" : time
			}
		});
		showAnswerCounts();
	}
	function receiveAnswer(answer) {
		var idx = "" + answer.answer,
			current = (answerCounts[idx] || 0) + 1;
		answerCounts[idx] = current;
		if (context.isRoomAdmin() || answered) {
			$("#answer-" + idx).find(".answer-cnt").text(current);
		}
	}
	function getCorrectAnswerButtons() {
		function minCount() {
			var ret = -1;
			for (var name in answerCounts) {
				var cnt = answerCounts[name] || 0;
				if (cnt != 0 && (ret == -1 || cnt < ret)) {
					ret = cnt;
				}
			}
			return ret;
		}
		function maxCount() {
			var ret = -1;
			for (var name in answerCounts) {
				var cnt = answerCounts[name] || 0;
				if (cnt != 0 && cnt > ret) {
					ret = cnt;
				}
			}
			return ret;
		}
		switch (answerDetail.answerType) {
			case AnswerType.FirstRow:
				var text = answerDetail.answers.split("\n")[0];
				for (var i=0; i<$buttons.length; i++) {
					var $btn = $($buttons[i]);
					if ($btn.find(".answer").text() == text) {
						return $btn;
					}
				}
				break;
			case AnswerType.Most:
			case AnswerType.Least:
				var cnt = answerDetail.answerType == AnswerType.Most ? maxCount() : minCount();
				if (cnt == -1) {
					return null;
				} else {
					var ret = [];
					$buttons.each(function() {
						if ($(this).find(".answer-cnt").text() == cnt) {
							ret.push(this);
						}
					})
					return $(ret);
				}
				break;
			case AnswerType.NoAnswer:
				return null;
		}
		throw "IllegalState: " + answerDetail.answerType;
	}
	function buildAnswerDetail(effect) {
		function isCorrect($ab, $cbs) {
			var ret = false,
				id = $ab.attr("id");
			$cbs.each(function() {
				if (id == $(this).attr("id")) {
					ret = true;
				}
			})
			return ret;
		}
		if (!$buttons) {
			return;
		}
		var $correctBtns = getCorrectAnswerButtons();
		if ($correctBtns) {
			if ($answerBtn) {
				$answerBtn.removeClass("btn-primary");
				var correct = isCorrect($answerBtn, $correctBtns);
					msg = correct ? MSG.correctAnswer : MSG.wrongAnswer;
				if (!correct) {
					$answerBtn.addClass("btn-danger");
				}
				if (effect) {
					app.showEffect(msg, 1);
				}
			}
			$correctBtns.addClass("btn-success");
		}
		if (answerDetail.description) {
			var $desc = $("#publish-q-description");
			$desc.find("textarea").val(answerDetail.description);
			$desc.show();
		}
		if (answerDetail.relatedUrl) {
			var $url = $("#publish-q-url"),
				$a = $url.find("a");
			$a.attr("href", answerDetail.relatedUrl).text(answerDetail.relatedUrl);
			$url.show();
		}
		$("#publish-q-ranking").show();
	}
	function receiveAnswerDetail(data) {
		answerDetail = data;
		if (showAnswerDetail) {
			buildAnswerDetail(true);
		}
	}
	function progress() {
		function doProgress() {
			n--;
			$progress.css("width", n + "%");
			if (n < 20) {
				$progress.removeClass("progress-bar-warning").addClass("progress-bar-danger");
			} else if (n < 60) {
				$progress.removeClass("progress-bar-success").addClass("progress-bar-warning");
			}
			if (answered) {
				if (n2 == -1) n2 = n;
				$progressAnswered.css("width", (n2 - n) + "%");
			}
			if (n > 0) {
				setTimeout(doProgress, interval);
			} else {
				enableInput($buttons, false);
				showAnswerDetail = true;
				if (answerDetail) {
					buildAnswerDetail(true);
				}
			}
		}
		var n = 100,
			n2 = -1,
			interval = TIMELIMIT / 100,
			$progress = $("#publish-q-progress"),
			$progressAnswered = $("#publish-q-progress-answered");
		$progress.css("width", "100%");
		$progressAnswered.css("width", "0%");
		setTimeout(doProgress, interval);
	}
	function init($el) {
		var $seq = $("#publish-q-seq");
		$text = $("#publish-q-text");
		$("#publish-q-none").hide();
		$buttons = $el.find(".btn-question").hide();
		if (question) {
			$seq.text(MSG.format(MSG.questionSeq, question.seq));
			for (var i=0; i<question.answers.length; i++) {
				var $btn = $("#answer-" + (i+1)).show();
				$btn.find(".answer").text(question.answers[i]);
			}
			$text.text(question.question).hide();
		}

		if (answerDetail) {
			showAnswerCounts();
			enableInput($buttons, false);
			buildAnswerDetail(false);
		} else if (question) {
			$seq.css({
				"animation-name" : "inout",
				"-webkit-animation-name" : "inout"
			});
			if (context.isRoomAdmin()) {
				$buttons.find(".answer-cnt").text("0");
			} else if (context.userEventId) {
				$buttons.click(answer);
			} else {
				enableInput($buttons, false);
			}
			$text.hide();
		} else {
			$("#publish-q-default").hide();
			$("#publish-q-none").show();
		}
	}
	function afterShow() {
		if (!answerDetail) {
			startTime = new Date().getTime();
			$text.show("blind", { "direction" : "left"}, 1000);
			progress();
		}
	}
	function clear() {
		$buttons = null;
		$answerBtn = null;
		$text = null;
	}
	function setQuestion(q) {
		question = q;
		answerCounts = {};
		answerDetail = null;
		answered = false;
		startTime = 0;
		showAnswerDetail = false;
	}
	var question = null,
		answerCounts = {},
		answerDetail = null,
		answered = false,
		startTime = 0,
		showAnswerDetail = false,
		$buttons = null,
		$answerBtn = null;
		$text = null;

	$.extend(this, {
		"init" : init,
		"afterShow" : afterShow,
		"clear" : clear,
		"receiveAnswer" : receiveAnswer,
		"receiveAnswerDetail" : receiveAnswerDetail,
		"setQuestion" : setQuestion
	})
}
