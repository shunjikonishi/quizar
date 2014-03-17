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
		DEFAULT_IMAGE = "/assets/images/twitter_default_profile.png",
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
	function clearHash(hash) {
		for (var name in hash) {
			delete hash[name];
		}
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
		function show(msg, second) {
			if (!second) {
				second = 3;
			}
			$el.animateDialog(msg, {
				"name" : "rotateZoom",
				"duration" : second + "s"
			});
		}
		$.extend(this, {
			"show" : show
		});
	}
	function Context(hash) {
		var self = this;
		function isLogined() { return !!self.userId;}
		function isEntryEvent() { return !!self.userEventId;}
		function isEventRunning() { return self.eventStatus == EventStatus.Running;}
		function isInRoom() { return !!self.roomId;}
		function isRoomAdmin() { return !!self.roomAdmin;}
		function isPostQuestionAllowed() { return !!self.userQuiz;}
		function isDebug() { return !!self.debug;}
		function openEvent(eventId) {
			self.eventId = eventId;
			self.eventStatus = EventStatus.Running;
		}
		function closeEvent() {
			self.eventId = 0;
			self.eventStatus = EventStatus.Prepared;
			self.userEventId = 0;
		}
		function entryEvent(userEventId) {
			self.userEventId = userEventId;
		}
		function canEntryEvent() {
			return isLogined() && isInRoom() && !isRoomAdmin();
		}

		$.extend(this, hash, {
			"isLogined" : isLogined,
			"isEntryEvent" : isEntryEvent,
			"isEventRunning" : isEventRunning,
			"isInRoom" : isInRoom,
			"isRoomAdmin" : isRoomAdmin,
			"isPostQuestionAllowed" : isPostQuestionAllowed,
			"isDebug" : isDebug,
			"openEvent" : openEvent,
			"closeEvent" : closeEvent,
			"entryEvent" : entryEvent,
			"canEntryEvent" : canEntryEvent
		})
	}
	function User(hash) {
		function getMiniImageUrl() { return this.imageUrl;}

		$.extend(this, hash, {
			"getMiniImageUrl" : getMiniImageUrl
		});
		clearHash(hash);
	}
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
			function appendTr(q, cache) {
				var $tr = $("<tr><td class='q-creator'><img src='" + DEFAULT_IMAGE + "'/></td>" +
					"<td class='q-text'></td></tr>"),
					$img = $tr.find("img");

				$tr.attr("data-id", q.id);
				$tr.find(".q-text").text(q.question);
				if (users[q.createdBy]) {
					$img.attr("src", users[q.createdBy].getMiniImageUrl());
				} else if (cache[q.createdBy]) {
					$img.attr("data-userId", q.createdBy);
				} else {
					cache[q.createdBy] = true;
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
						var $table = $tbody.parents("table"),
							cache = {};
						questions = data;
						$tbody.empty();
						if (slideDir) {
							$table.hide();
						}
						for (var i=0; i<data.length; i++) {
							appendTr(data[i], cache);
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
	flect.QuizApp = function(serverParams) {
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
		function showEffect(msg, time) {
			effectDialog.show(msg, time);
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
			con = new flect.Connection(context.uri, debug);
			home = new Home(con, users);
			makeRoom = new MakeRoom(app, context.userId, con);
			templateManager = new flect.TemplateManager(con, $("#content-dynamic"));
			$content = $("#content");

			if (context.isDebug()) {
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
			if (context.isLogined()) {
				users[context.userId] = new User({
					"id" : context.userId,
					"name" : context.username,
					"imageUrl" : context.userImage
				});
			}

			if (context.isInRoom()) {
				var $chat = $("#chat");
				chat = new Chat($chat, context.userId, context.hashtag, con);
				$(".menu-chat").click(function() {
					showStatic("chat", $(this).parents("#sidr").length > 0);
					return false;
				});
				con.addEventListener("chat", function(data) {
					chat.append(data);
					if (data.userId != context.userId && chat.isNotifyTweet()) {
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
					context.openEvent(data);
					if (makeQuestion) {
						makeQuestion.openEvent(context.eventId);
					}
					if (entryEvent) {
						setTimeout(entryEvent.openEvent, 3000);
					}
				})
				con.addEventListener("finishEvent", function(data) {
					effectDialog.show(MSG.finish);
					context.closeEvent();
					if (makeQuestion) {
						makeQuestion.closeEvent();
					}
					if (entryEvent) {
						entryEvent.closeEvent();
					}
				});

				publishQuestion = new PublishQuestion(self, context, con);
				con.addEventListener("question", function(data) {
					showQuestion(data);
				});
				con.addEventListener("answer", publishQuestion.receiveAnswer);
				con.addEventListener("answerDetail", publishQuestion.receiveAnswerDetail);
			}
			if ($("#home").length) {
				con.ready(function() {
					home.init($("#home"));
				});
			}
			if (context.isRoomAdmin() || context.isPostQuestionAllowed()) {
				makeQuestion = new MakeQuestion(self, context.roomId, context.userId, context.isRoomAdmin(), con);
				if (context.isEventRunning()) {
					makeQuestion.openEvent(context.eventId);
				}
			}
			if (context.isRoomAdmin()) {
				questionList = new QuestionList(self, users, context.userId, con);
				editEvent = new EditEvent(self, context.roomId, con);
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
			}
			if (context.canEntryEvent()) {
				entryEvent = new EntryEvent(self, context, con);
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
				"log" : "user=" + (context.isLogined() ? context.username : "(Anonymous)")
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
		var context = new Context(serverParams),
			debug,
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
		debug.log("params", context);

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
					makeRoom.edit(context.roomId);
					makeRoom.init($el)
				},
				"afterHide" : makeRoom.clear
			}
		};
		if (context.isRoomAdmin()) {
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
		} else if (context.isPostQuestionAllowed()) {
			$.extend(TemplateLogic, {
				"post-question" : {
					"name" : "make-question",
					"beforeShow" : makeQuestion.init,
					"afterHide" : makeQuestion.clear
				}
			})
		}
		if (context.isInRoom()) {
			$.extend(TemplateLogic, {
				"publish-question" : {
					"name" : "publish-question",
					"beforeShow" : publishQuestion.init,
					"afterHide" : publishQuestion.clear
				}
			})
		}
		$.extend(this, {
			"showQuestionList" : showQuestionList,
			"showMakeQuestion" : showMakeQuestion,
			"showPasscode" : showPasscode,
			"showChat" : showChat,
			"showMessage" : showMessage,
			"showEffect" : showEffect,
			"tweet" : tweet
		})
	}
});