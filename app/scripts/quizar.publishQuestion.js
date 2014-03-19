function PublishQuestion(app, context, con) {
	var TIMELIMIT = 10000,
		BUTTON_COUNT = 5;
	function setButtonCount(idx, cnt) {
		$("#answer-" + idx).find(".answer-cnt .count").text(cnt);
	}
	function applyAnswered($btn) {
		$btn.removeClass("white disabled").addClass("blue");
		$btn.find("li:first").empty().append("<i class='fa fa-check fa-2x'></i>")
	}
	function applyDisabled($btn) {
		enableInput($btn, false);
		$btn.removeClass("white").addClass("disabled");
	}
	function applyCorrect($btn) {
		$btn.removeClass("white blue disabled").addClass("green");
		$btn.find("li:first").empty().append("<i class='fa fa-circle-o fa-2x'></i>")
	}
	function applyWrong($btn) {
		$btn.removeClass("white blue disabled").addClass("red");
		$btn.find("li:first").empty().append("<i class='fa fa-times fa-2x'></i>")
	}
	function showAnswerCounts() {
		if ($buttons) {
			for (var i=0; i<BUTTON_COUNT; i++) {
				var idx = "" + (i+1),
					cnt = answerCounts[idx] || 0;
				setButtonCount(idx, cnt);
			}
		}
		$buttons.find(".answer-cnt").show();
	}
	function answer() {
		var time = new Date().getTime() - startTime,
			$btn = $(this),
			n = parseInt($btn.attr("id").substring(7));
		if (answered) {
			return;
		}
		answered = true;
		applyDisabled($buttons);
		applyAnswered($btn);
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
		if (context.isEventAdmin() || answered) {
			setButtonCount(idx, current);
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
						if ($(this).find(".answer-cnt count").text() == cnt) {
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
				var correct = isCorrect($answerBtn, $correctBtns);
					msg = correct ? MSG.correctAnswer : MSG.wrongAnswer;
				if (!correct) {
					applyWrong($answerBtn);
				}
				if (effect) {
					app.showEffect(msg, 1);
				}
			}
			applyCorrect($correctBtns);
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
		if (effect) {
			$("#publish-q-detail").show("slow");
		} else {
			$("#publish-q-detail").show();
		}
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
				if (n2 == -1) n2 = n + 1;
				$progressAnswered.css("width", (n2 - n) + "%");
			}
			if (n > 0) {
				setTimeout(doProgress, interval);
			} else {
				applyDisabled($buttons);
				showAnswerCounts();
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
			$progressAnswered = $("#publish-q-progress-answered"),
			$cur = null,
			curInterval = 0,
			len = 0;
		$progress.css("width", "100%");
		$progressAnswered.css("width", "0%");
		setTimeout(doProgress, interval);

		//Text
		$text.contents().each(function() {
			$(this).replaceWith($(this).text()
				.replace(/(\S)/g, '<span>$1</span>'));
		});
		$text.append('<span class="cur">_</span>');
		$cur = $text.find(".cur");
		curInterval = setInterval(function() {
			if ($cur) {
				$cur.toggle();
			}
		}, 200);
		len = $text.children().size();
		for (var i=0; i<len; i++) {
			var $span = $text.children('span:eq('+i+')');
			if (i == len - 1) {
				setTimeout(function() {
					$span.hide();
					clearInterval(curInterval);
				}, 50 * i + 2000);
			} else {
				$span.delay(50*i).fadeIn(10);
			}
		}
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
				$btn.find(".answer-seq").text((i+1) + ".");
				$btn.find(".answer").text(question.answers[i]);
			}
			$text.text(question.question);
		}

		if (answerDetail) {
			showAnswerCounts();
			applyDisabled($buttons);
			buildAnswerDetail(false);
		} else if (question) {
			$(".publish-q-animation").css({
				"animation-name" : "inout",
				"-webkit-animation-name" : "inout"
			});
			if (context.isEventAdmin()) {
				showAnswerCounts();
			} else if (context.userEventId) {
				$buttons.click(answer);
			} else {
				applyDisabled($buttons);
			}
		} else {
			$("#publish-q-default").hide();
			$("#publish-q-none").show();
		}
		$("#publish-q-ranking").click(function() {
			app.showRanking();
		});
	}
	function afterShow() {
		if (!answerDetail) {
			startTime = new Date().getTime();
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
		$answerBtn = null,
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
