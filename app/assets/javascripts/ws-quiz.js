if (typeof(flect) === "undefined") flect = {};

$(function() {
	$.validator.addMethod("quizChoices", function(value, element) {
		if (!value || value.length == 0) {
			return false;
		}
		var array = value.split("\n").filter(function(v) { return v.length > 0});
		if (array.length <= 1 || array.length > 5) {
			return false;
		}
		return true;
	}, MSG.invalidQuizChoices);
	$.validator.addMethod("time", function(value, element) {
        return this.optional(element) || /^\d{2}:\d{2}$/.test(value);
	}, MSG.invalidTime);

	var SUPPORTS_TOUCH = 'ontouchstart' in window,
		EFFECT_TIME = 300,
		AnswerType = {
			"FirstRow" : 0,
			"Most" : 1,
			"Least" : 2,
			"NoAnswer" : 3
		},
		EventStatus = {
			"Prepared" : 0,
			"Running" : 1,
			"Finished" : 2
		};

	//Common functions
	function enableInput($input, b) {
		if (b) {
			$input.removeAttr("disabled");
		} else {
			$input.attr("disabled", "disabled");
		}
	}
	function normalizeMultiline(str) {
		return str.split("\n").filter(function(v) { return v.length > 0}).join("\n");
	}
	function copyIdToName($el) {
		$el.each(function() {
			var $input = $(this),
					id = $input.attr("id");
			if (id) {
				$input.attr("name", id);
			}
		});
		return $el;
	}
	function optionControl($ctrl, $panel) {
		if (!$panel) {
			$panel = $ctrl.find(".option-panel");
			$ctrl = $ctrl.find(".option-ctrl");
		}
		$ctrl.click(function() {
			$(this).find("i").toggle();
			$panel.toggle();
		})
	}
	function DateTime() {
		function dateStr() {
			var y = value.getFullYear(),
				m = value.getMonth() + 1,
				d = value.getDate();
			if (m < 10) {
				m = "0" + m;
			} 
			if (d < 10) {
				d = "0" + d;
			} 
			return y + "-" + m + "-" + d;
		}
		function timeStr() {
			var h = value.getHours(),
				m = value.getMinutes();
			if (h < 10) {
				h = "0" + h;
			}
			if (m < 10) {
				m = "0" + m;
			}
			return h + ":" + m;
		}
		function datetimeStr() {
			return dateStr().substring(5) + " " + timeStr();
		}
		function getTime() {
			return value.getTime();
		}
		var value;
		switch (arguments.length) {
			case 1: 
				value = new Date(arguments[0]);
				break;
			case 2:
				value = new Date(arguments[0] + " " + arguments[1]);
				break;
		}
		$.extend(this, {
			"dateStr" : dateStr,
			"timeStr" : timeStr,
			"datetimeStr" : datetimeStr,
			"getTime" : getTime
		})
	}
	function EffectDialog($el) {
		function show(msg) {
			$el.animateDialog(msg, {
				"name" : "rotateZoom"
			});
		}
		$.extend(this, {
			"show" : show
		});
	}
	function User(hash) {
		function getMiniImageUrl() { return this.imageUrl;}

		$.extend(this, hash, {
			"getMiniImageUrl" : getMiniImageUrl
		});
	}
	function Home(con) {
		function bindEvent($el) {
			$el.find("tbody tr").click(function() {
				var id = $(this).attr("data-room");
				if (id) {
					location.href = "/room/" + id;
				}
			});
		}
		function buildTable($el, data) {
			var $tbody = $el.find("tbody");
			for (var i=0; i<data.length; i++) {
				var room = data[i],
					$tr = $("<tr><td class='event-date'></td><td class='event-title'></td><td class='event-capacity'></td></tr>"),
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
				$tr.find(".event-title").text(title);
				$tr.find(".event-capacity").text(capacity);
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
	function Chat($el, userId, hashtag, con) {
		var MAX_LOG = 20;
		function tweet(msg, withTwitter) {
			if (userId) {
				con.request({
					"command" : "tweet",
					"data" : {
						"userId" : userId,
						"msg" : msg,
						"twitter" : withTwitter
					}
				})
			}
		}
		function isNotifyTweet() {
			return $el.is(":hidden") && $("#chat-notify").is(":checked");
		}
		function member(data) {
			if (arguments.length == 0) {
				return $member.text();
			} else {
				$member.text(data);
			}
		}
		function append(data) {
			if (cnt > MAX_LOG) {
				$tbody.find("tr:last").remove();
			}
			var clazz = cnt % 2 == 0 ? "chat-left" : "chat-right",
				$tr = $("<tr style='display:none;'>" +
					"<td class='chat-img'></td>" +
					"<td class='chat-msg'></td>" +
					"<td class='chat-img'></td></tr>"),
				$img = $("<img/>"),
				$tdMsg = $tr.find("td.chat-msg");

			$tdMsg.addClass(clazz);
			$tdMsg.html(data.username + "<br>" + data.msg);
			$img.attr("src", data.img);
			if (clazz == "chat-left") {
				$tr.find("td.chat-img:first").append($img);
			} else {
				$tr.find("td.chat-img:last").append($img);
			}
			$tbody.prepend($tr)
			$tr.show("slow");
			cnt++;
		}
		var cnt = 0,
			$text = $("#chat-text"),
			$twitter = $("#chat-twitter"),
			$len = $("#chat-text-len"),
			$tbody = $el.find("table tbody"),
			$member = $("#room-member");
		if (userId) {
			$("#btn-tweet").click(function() {
				var msg = $text.val(),
					withTwitter = $twitter.is(":checked");
				if (msg.length == 0 || msg.length > 140) {
					return;
				}
				$text.val(hashtag);
				tweet(msg, withTwitter);
			});
			$text.keyup(function() {
				var len = 140 - $text.val().length;
				if (len <= 0) {
					$len.addClass("error");
				} else {
					$len.removeClass("error");
				}
				$len.text(len);
			})
		}
		if (hashtag) {
			if (hashtag.charAt(0) != "#") {
				hashtag = "#" + hashtag;
			}
		} else {
			hashtag = "";
		}
		$text.val(hashtag);
		$.extend(this, {
			"member" : member,
			"append" : append,
			"tweet" : tweet,
			"isNotifyTweet" : isNotifyTweet
		})
	}
	function MakeRoom(app, userId, con) {
		function getParameterName($input) {
			return $input.attr("id").substring(5);
		}
		function update() {
			if (validator && validator.form()) {
				var data = editRoom || {
					"id" : -1, 
					"owner" : userId
				};
				$form.find(":input").each(function() {
					var $input = $(this),
						name = getParameterName($input);
					if ($input.is(":checkbox")) {
						data[name] = $input.is(":checked");
					} else if ($input.val()) {
						data[name] = $input.val();
					}
				})
				if (editRoom) {
					con.request({
						"command" : "updateRoom",
						"data" : data,
						"success" : function(data) {
							app.showMessage(MSG.successUpdate);
						}
					})
				} else {
					con.request({
						"command" : "makeRoom",
						"data" : data,
						"success" : function(data) {
							if (data.id) {
								con.close();
								location.href = "/room/" + data.id;
							}
						}
					})
				}
			}
		}
		function init($el) {
			if (roomId && !editRoom) {
				con.request({
					"command" : "getRoom",
					"data" : roomId,
					"success" : function(data) {
						editRoom = data;
						init($el);
					}
				})
				return;
			}
			$form = $("#make-room-form");
			copyIdToName($form.find(":input")).each(function() {
				var $input = $(this);
				if (editRoom) {
					var name = getParameterName($input);
					if (editRoom[name]) {
						if ($input.is(":checkbox")) {
							$input.attr("checked", "checked");
						} else {
							$input.val(editRoom[name]);
						}
					}
				}
			})
			validator = $form.validate({
				"rules" : {
					"room-name" : {
						"required" : true,
						"maxlength" : 100
					},
					"room-tags" : {
						"maxlength" : 100
					},
					"room-hashtag" : {
						"maxlength" : 20
					},
					"room-description" : {
						"maxlength" : 400
					}
				},
				"focusInvalid" : true
			});
			var $btnUpdate = $("#btn-make-room").click(update),
				$h1 = $("#make-room-h1");
			if (editRoom) {
				$("#room-admin").show();
				$h1.text(MSG.editRoom);
				$btnUpdate.text(MSG.update);
			} else {
				$("#room-admin").hide();
				$h1.text(MSG.makeRoom);
				$btnUpdate.text(MSG.create);
			}
			optionControl($el);
		}
		function clear() {
			$form = null;
			validator = null;
			roomId = 0;
			editRoom = null;
		}
		var $form = null,
			roomId = 0,
			editRoom = null,
			validator = null;

		$.extend(this, {
			"init" : init,
			"clear" : clear,
			"edit" : function(id) { roomId = id;}
		})
	}
	function QuestionList(app, users, userId, con) {
		var ROWSIZE = 10;
		function QuestionTable($el, published) {
			function getQuestion(id) {
				for (var i=0; i<questions.length; i++) {
					var q = questions[i];
					if (q.id == id) {
						return q;
					}
				}
				return null;
			}
			function appendTr(q) {
				var $tr = $("<tr><td class='q-creator'><img src='/assets/images/twitter_default_profile.png'/></td>" +
					"<td class='q-text'></td></tr>"),
					$img = $tr.find("img");

				$tr.attr("data-id", q.id);
				$tr.find(".q-text").text(q.question);
				if (users[q.createdBy]) {
					$img.attr("src", users[q.createdBy].getMiniImageUrl());
				} else {
					$img.attr("data-userId", q.createdBy);
					con.request({
						"command" : "getUser",
						"data" : q.createdBy,
						"success" : function(data) {
							var user = new User(data);
							users[user.id] = user;
							$el.find("[data-userId=" + user.id + "]").attr("src", user.getMiniImageUrl()).removeAttr("data-userId");
						}
					})
				}
				$tr.click(function() {
					var id = $(this).attr("data-id");
					app.showMakeQuestion(getQuestion(id));
				})
				$tbody.append($tr);
			}
			function load(offset, limit, slideDir) {
				con.request({
					"command" : "listQuestion",
					"data" : {
						"published" : published,
						"offset" : offset,
						"limit" : limit
					},
					"success" : function(data) {
						var $table = $tbody.parents("table");
						questions = data;
						$tbody.empty();
						if (slideDir) {
							$table.hide();
						}
						for (var i=0; i<data.length; i++) {
							appendTr(data[i]);
						}
						if (slideDir) {
							$table.show("slide", { "direction" : slideDir}, EFFECT_TIME);
						}
					}
				});
			}
			function prev() {
				if (offset > 0) {
					offset -= ROWSIZE;
					load(offset, ROWSIZE, "left");
					activate();
				}
			}
			function next() {
				if (offset + ROWSIZE < cnt) {
					offset += ROWSIZE;
					load(offset, ROWSIZE, "right");
					activate();
				}
			}
			function count() {
				if (arguments.length == 0) {
					return cnt;
				} else {
					cnt = arguments[0];
					return this;
				}
			}
			function activate() {
				enableInput($btnPrev, offset > 0);
				enableInput($btnNext, offset + ROWSIZE < cnt);
			}
			var cnt = 0,
				offset = 0,
				questions = [],
				$tbody = $el.find("table tbody");
			$el.swipe({
				"swipeLeft": function(e) {
					next();
					e.stopImmediatePropagation();
				},
				"swipeRight": function(e) {
					prev();
					e.stopImmediatePropagation();
				},
				"tap": function (event, target) {
					if (SUPPORTS_TOUCH) {
						$(target).click();
					}
				}
			})
			$.extend(this, {
				"prev" : prev,
				"next" : next,
				"load" : load,
				"count" : count,
				"activate" : activate
			})
		}
		function getActiveTable() {
			var index = $tab.tabs("option", "active");
			return index == 0 ? stockTable : publishedTable;
		}
		function countQuestions(activate) {
			con.request({
				"command" : "countQuestion",
				"success" : function(data) {
					stockTable.count(data.count - data.published);
					publishedTable.count(data.published);
					$("#question-stock-count").text(stockTable.count());
					$("#question-published-count").text(publishedTable.count());
					if (activate) {
						stockTable.activate();
					}
				}
			});
		}
		function init($el) {
			stockTable = new QuestionTable($("#edit-question-stock"), false);
			publishedTable = new QuestionTable($("#edit-question-published"), true);

			$tab = $el.find(".tab-content").tabs({
				"activate" : function() {
					getActiveTable().activate();
				}
			});
			countQuestions(true);
			stockTable.load(0, ROWSIZE);
			publishedTable.load(0, ROWSIZE);
			$("#edit-question-new").click(function() {
				app.showMakeQuestion();
			})
			$btnPrev = $("#edit-question-left").click(function() {
				getActiveTable().prev();
			})
			$btnNext = $("#edit-question-right").click(function() {
				getActiveTable().next();
			})
		}
		function reload() {
			if (stockTable) {
				countQuestions(getActiveTable() == stockTable);
				stockTable.load(0, ROWSIZE);
			}
		}
		function clear() {
			stockTable = null;
			publishedTable = null;
			$tab = null;
			$btnPrev = null;
			$btnNext = null;
		}
		var stockTable = null;
			publishedTable = null,
			$tab = null,
			$btnPrev = null,
			$btnNext = null;

		$.extend(this, {
			"init" : init,
			"clear" : clear,
			"reload" : reload
		})
	}
	function MakeQuestion(app, roomId, userId, admin, con) {
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
				"roomId" : roomId,
				"createdBy" : userId
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
							if (admin) {
								editQuestion = data;
								if (eventId) {
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
				$("#make-q-h1").text(eventId ? MSG.editAndPublishQuestion : MSG.editQuestion);
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
			if (admin) {
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
	function PublishQuestion(app, params, con) {
		var TIMELIMIT = 10000;
		function answer() {
			var time = new Date().getTime() - startTime,
				$btn = $(this),
				n = parseInt($btn.attr("id").substring(7));
			if (answered) {
				return;
			}
			answered = true;
			enableInput($buttons, false);
			if (time > TIMELIMIT) {
				app.showMessage("timeLimitExceeded");
				return;
			}
			con.request({
				"command" : "answer",
				"data" : {
					"userId" : params.userId,
					"publishId" : question.id,
					"eventId" : params.eventId,
					"userEventId" : params.userEventId,
					"answer" : n,
					"time" : time
				}
			});
		}
		function receiveAnswer(answer) {
			var n = answer.answer,
				$cnt = $("#answer-" + n).find(".answer-cnt"),
				current = parseInt($cnt.text());
			$cnt.text(current + 1);
		}
		function progress() {
			function doProgress() {
				if (answered) {
					return;
				}
				n--;
				$progress.css("width", n + "%");
				if (n < 20) {
					$progress.removeClass("progress-bar-warning").addClass("progress-bar-danger");
				} else if (n < 60) {
					$progress.removeClass("progress-bar-success").addClass("progress-bar-warning");
				}
				if (n > 0) {
					setTimeout(doProgress, interval);
				} else {
					enableInput($buttons, false);
				}
			}
			var n = 100,
				interval = TIMELIMIT / 100,
				$progress = $("#progress");
			$progress.css("width", "100%");
			setTimeout(doProgress, interval);
		}
		function init($el) {
			$("#publish-question-seq").text(MSG.format(MSG.questionSeq, question.seq));
			$buttons = $el.find(".btn-question").hide();
			if (params.roomAdmin) {
				$buttons.find(".answer-cnt").text("0");
			} else if (params.userEventId) {
				$buttons.click(answer);
			} else {
				enableInput($buttons, false);
			}

			for (var i=0; i<question.answers.length; i++) {
				var $btn = $("#answer-" + i).show();
				$btn.find(".answer").text(question.answers[i]);
			}
			$text = $("#question-text").text(question.question).hide();
		}
		function afterShow() {
			startTime = new Date().getTime();
			$text.show("blind", { "direction" : "left"}, 1000);
			progress();
		}
		function clear() {
			question = null;
			$buttons = null;
			$text = null;
			startTime = 0;
			answered = false;
			console.log("a clear");
		}
		function setQuestion(q) {
			question = q;
		}
		var question = null,
			$buttons = null,
			$text = null,
			startTime = 0,
			answered = false;

		$.extend(this, {
			"init" : init,
			"afterShow" : afterShow,
			"clear" : clear,
			"receiveAnswer" : receiveAnswer,
			"setQuestion" : setQuestion
		})
	}
	function EntryEvent(app, params, con) {
		function isEnable() {
			return params.eventId && !params.userEventId && params.eventStatus == EventStatus.Running;
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
				"userId" : params.userId,
				"username" : params.username,
				"userImage" : params.userImage,
				"eventId" : params.eventId
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
						params.userEventId = data.userEventId;
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
				doEntry(passcode);
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
	function DebuggerWrapper() {
		var impl = null;
		function log(type, value, time) {
			if (impl) {
				impl.log(type, value, time);
			}
		}
		function setImpl(v) {
			impl = v;
		}
		$.extend(this, {
			"log" : log,
			"setImpl" : setImpl
		})
	}
	function PageDebugger($el, con, messageDialog) {
		var MAX_LOG = 10;
		function log(type, value, time) {
			if (typeof(value) === "object") {
				value = JSON.stringify(value);
			}
			if (cnt > MAX_LOG) {
				$tbody.find("tr:first").remove();
			}
			var $tr = $("<tr><td></td><td></td><td><div class='pull-right'></div></td></tr>"),
				$td = $tr.find("td");
			$($td.get(0)).text(type);
			$($td.get(1)).text(value);
			if (time) {
				$($td.get(2)).find("div").text(time);
			}
			$tbody.append($tr);
			cnt++;
			console.log(type + ", " + value + (time ? ", " + time + "ms" : ""));
		}
		var $tbody = $el.find("table tbody"),
			cnt = 0;
		con.onRequest(function(command, data) {
			var value = command;
			if (data) {
				value += ", " + JSON.stringify(data);
			}
			log("send", value);
		}).onMessage(function(data, startTime) {
			var now = new Date().getTime();
			log("receive", JSON.stringify(data), now - startTime);
		})
		$("#chk-use-ajax").bootstrapSwitch().on("switchChange", function() {
			var useAjax = $(this).is(":checked");
			if (useAjax) {
				con.useAjax("/ajax");
			} else {
				con.useAjax(false);
			}
		});
		$("#btn-debug-msg").click(function() {
			/*
			var msg = $("#debug-msg").val(),
				sec = $("#debug-msg-sec").val(),
				img = "http://pbs.twimg.com/profile_images/442961765647650816/UmCaKfSq_mini.jpeg";
			messageDialog.notifyTweet({
				"userId" : 1,
				"username" : "@shunjikonishi",
				"msg" : msg,
				"img" : img
			}, sec);
			*/
			$("#effect-dialog").animateDialog("Start!", {
				"name" : "rotateZoom"
			})
		});
		$.extend(this, {
			"log" : log
		})
	}
	flect.QuizApp = function(params) {
		var self = this;
		function showStatic(id, sidr) {
			function doShowStatic() {
				if (!$el.is(":visible")) {
					$content.children("div").hide();
					$el.show("slide", { "direction" : "right"}, EFFECT_TIME);
				}
			}
			var $el = $("#" + id);
			if (sidr) {
				$.sidr("close", doShowStatic);
			} else {
				doShowStatic();
			}
		}
		function showChat() {
			showStatic("chat", false);
		}
		function showQuestion(data) {
			if (publishQuestion) {
				var params = {
					"name" : "publish-question",
					"effect" : "none",
					"beforeShow" : function($el) {
						publishQuestion.setQuestion(data);
						publishQuestion.init($el);
					},
					"afterShow" : publishQuestion.afterShow,
					"afterHide" : publishQuestion.clear
				};
				$content.children("div").hide();
				templateManager.show(params);
			}
		}
		function showQuestionList(direction) {
			if (questionList) {
				var params = $.extend({
					"name" : "edit-question"
				}, TemplateLogic["edit-question"]);
				if (direction) {
					params.direction = direction;
				}
				$content.children("div").hide();
				templateManager.show(params);
			}
		}
		function showMakeQuestion(q) {
			if (makeQuestion) {
				if (q) {
					makeQuestion.edit(q);
				}
				$content.children("div").hide();
				templateManager.show({
					"name" : "make-question",
					"beforeShow" : makeQuestion.init,
					"afterHide" : makeQuestion.clear
				});
			}
		}
		function showPasscode() {
			if (entryEvent) {
				$content.children("div").hide();
				templateManager.show({
					"name" : "passcode",
					"beforeShow" : entryEvent.init,
					"afterHide" : entryEvent.clear
				});
			}
		}
		function showMessage(msg, time) {
			messageDialog.show(msg, time);
		}
		function tweet(msg, withTwitter) {
			if (chat) {
				chat.tweet(msg, withTwitter);
			}
		}
		function init() {
			if (window.sessionStorage) {
				sessionStorage.clear();
			}

			debug = new DebuggerWrapper();
			messageDialog = new flect.MessageDialog($("#msg-dialog"));
			effectDialog = new EffectDialog($("#effect-dialog"));
			con = new flect.Connection(params.uri, debug);
			home = new Home(con);
			makeRoom = new MakeRoom(app, params.userId, con);
			templateManager = new flect.TemplateManager(con, $("#content-dynamic"));
			$content = $("#content");

			if (params.debug) {
				debug.setImpl(new PageDebugger($("#debug"), con, messageDialog));
				$("#btn-debug").click(function() {
					showStatic("debug", true);
					return false;
				})
				con.onError(function(data) {
					console.log(data);
					alert(data);
				});
			}
			if (params.userId) {
				users[params.userId] = new User({
					"id" : params.userId,
					"name" : params.username,
					"imageUrl" : params.userImage
				});
			}

			if (params.roomId) {
				var $chat = $("#chat");
				chat = new Chat($chat, params.userId, params.hashtag, con);
				$(".menu-chat").click(function() {
					showStatic("chat", $(this).parents("#sidr").length > 0);
					return false;
				});
				con.addEventListener("chat", function(data) {
					chat.append(data);
					if (data.userId != params.userId && chat.isNotifyTweet()) {
						messageDialog.notifyTweet(data);
					}
				});
				con.addEventListener("member", chat.member);
				con.addEventListener("newEntry", function(data) {
					var user = new User(data);
					users[user.id] = user;
					messageDialog.notifyUserAction(user, MSG.newEntry);
				})
				con.ready(function() {
					if (chat.member() == 0) {
						con.request({
							"command" : "member"
						})
					}
				});
				con.addEventListener("startEvent", function(data) {
					effectDialog.show(MSG.start);
					params.eventId = data;
					params.eventStatus = EventStatus.Running;
					if (makeQuestion) {
						makeQuestion.openEvent(params.eventId);
					}
					if (entryEvent) {
						setTimeout(entryEvent.openEvent, 3000);
					}
				})
				con.addEventListener("finishEvent", function(data) {
					effectDialog.show(MSG.finish);
					params.eventId = 0;
					params.eventStatus = EventStatus.Prepared;
					params.userEventId = 0;
					if (makeQuestion) {
						makeQuestion.closeEvent();
					}
					if (entryEvent) {
						entryEvent.closeEvent();
					}
				});

				publishQuestion = new PublishQuestion(self, params, con);
				con.addEventListener("question", function(data) {
					showQuestion(data);
				});
			}
			if ($("#home").length) {
				con.ready(function() {
					home.init($("#home"));
				});
			}
			if (params.roomAdmin || params.userQuiz) {
				makeQuestion = new MakeQuestion(self, params.roomId, params.userId, params.roomAdmin, con);
				if (params.eventId && params.eventStatus == EventStatus.Running) {
					makeQuestion.openEvent(params.eventId);
				}
			}
			if (params.roomAdmin) {
				questionList = new QuestionList(self, users, params.userId, con);
				editEvent = new EditEvent(self, params.roomId, con);
				con.addEventListener("postQuestion", function(data) {
					var userId = data,
						user = users[userId];

					questionList.reload();
					if (user) {
						messageDialog.notifyUserAction(user, MSG.postQuestionMessage);
					} else {
						con.request({
							"command" : "getUser",
							"data" : userId,
							"success" : function(data) {
								var user = new User(data);
								users[user.id] = user;
								messageDialog.notifyUserAction(user, MSG.postQuestionMessage);
							}
						});
					}
				});
				con.addEventListener("answer", publishQuestion.receiveAnswer);
			}
			if (params.userId && params.roomId && !params.roomAdmin) {
				entryEvent = new EntryEvent(self, params, con);
			}

			$("#btn-menu").sidr({
				"onOpen" : function() {
					$("#toolbar").css("left", "260px").find(".header-center").hide();
				},
				"onClose" : function() {
					$("#toolbar").css("left", "0px").find(".header-center").show();
				}
			});
			$("#content").swipe({
				"swipeLeft": function(e) {
					$.sidr('close');
				},
				"swipeRight": function() {
					$.sidr('open');
				},
				"tap": function (event, target) {
					if (SUPPORTS_TOUCH) {
						$(target).click();
					}
				}
			})
			con.polling(25000, {
				"command" : "noop",
				"log" : "user=" + (params.username ? params.username : "(Anonymous)")
			})
			$("#sidr a.dynamic").click(function() {
				var id = $(this).attr("href").substring(1),
					params = $.extend({
						"name" : id
					}, TemplateLogic[id]);;
				$.sidr("close", function() {
					$content.children("div").hide();
					templateManager.show(params);
				});
				return false;
			})
			$(".dropdown-button").click(function() {
				$(this).next("ul").toggle();
				return false;
			})
			$(".dropdown-menu a").click(function() {
				var $a = $(this);
				$a.parents(".dropdown-menu").hide();
				return $a.attr("href") != "#";
			})
		}
		var debug,
			messageDialog,
			effectDialog,
			con,
			home,
			makeQuestion,
			makeRoom,
			editEvent,
			entryEvent,
			templateManager,
			chat,
			questionList,
			publishQuestion,
			$content,
			users = {};
		init();
		debug.log("params", params);

		var TemplateLogic = {
			"home" : {
				"beforeShow" : home.init,
				"afterHide" : home.clear
			},
			"make-room" : {
				"beforeShow" : function($el) {
					makeRoom.clear();
					makeRoom.init($el);
				},
				"afterHide" : makeRoom.clear
			},
			"edit-room" : {
				"name" : "make-room",
				"beforeShow" : function($el) {
					makeRoom.clear();
					makeRoom.edit(params.roomId);
					makeRoom.init($el)
				},
				"afterHide" : makeRoom.clear
			}
		};
		if (params.roomAdmin) {
			$.extend(TemplateLogic, {
				"edit-question" : {
					"beforeShow" : questionList.init,
					"afterHide" : questionList.clear
				}
			})
			$.extend(TemplateLogic, {
				"edit-event" : {
					"beforeShow" : editEvent.init,
					"afterHide" : editEvent.clear
				}
			})
		} else if (params.userQuiz) {
			$.extend(TemplateLogic, {
				"post-question" : {
					"name" : "make-question",
					"beforeShow" : makeQuestion.init,
					"afterHide" : makeQuestion.clear
				}
			})
		}
		$.extend(this, {
			"showQuestionList" : showQuestionList,
			"showMakeQuestion" : showMakeQuestion,
			"showPasscode" : showPasscode,
			"showChat" : showChat,
			"showMessage" : showMessage,
			"tweet" : tweet
		})
	}
});