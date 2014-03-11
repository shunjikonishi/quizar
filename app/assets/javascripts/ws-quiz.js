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

	var SUPPORTS_TOUCH = 'ontouchstart' in window,
		EFFECT_TIME = 300,
		AnswerType = {
			"FirstRow" : 0,
			"Most" : 1,
			"Least" : 2,
			"NoAnswer" : 3
		};

	function User(hash) {
		function getMiniImageUrl() { return this.imageUrl;}

		$.extend(this, hash, {
			"getMiniImageUrl" : getMiniImageUrl
		});
	}
	function Home(con) {
		function init($el, load) {
			$("#event-future tbody tr, #event-yours tbody tr").click(function() {
				var id = $(this).attr("data-room");
				if (id) {
					location.href = "/room/" + id;
				}
			});
			$el.find(".tab-content").tabs();
		}
		function clear() {
		}
		$.extend(this, {
			"init" : init,
			"clear" : clear
		})
	}
	function MessageDialog($el) {
		function show(msg, second) {
			second = second || 3;
			$el.css({
				"animation-duration" : second + "s",
				"-webkit-animation-duration" : second + "s"
			})
			$el.find("span").text(msg);
			$el.show();
			setTimeout(function() {
				$el.hide();
			}, second * 1000);
		}
		$.extend(this, {
			"show" : show
		})
	}
	function Chat($el, userId, con) {
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
				$tr = $("<tr style='display:none;'><td><div></div></div></td></tr>"),
				$div = $tr.find("div"),
				$span = $("<span/>"),
				$img = $("<img/>");
			$div.addClass(clazz);
			$span.text(data.msg);
			$img.attr("src", data.img);
			if (clazz == "chat-left") {
				$div.append($img);
				$div.append($span);
			} else {
				$div.append($span);
				$div.append($img);
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
				$text.val("");
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
		$.extend(this, {
			"member" : member,
			"append" : append,
			"tweet" : tweet
		})
	}
	function MakeRoom(userId, con, messageDialog) {
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
							messageDialog.show(MSG.successUpdate);
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
					"data" : { "id" : roomId},
					"success" : function(data) {
						editRoom = data;
						init($el);
					}
				})
				return;
			}
			$form = $("#make-room-form");
			$form.find(":input").each(function() {
				var $input = $(this),
					id = $input.attr("id");
				$input.attr("name", id);
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
					"description" : {
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
			$("#make-room-option-btn").click(function() {
				$(this).find("i").toggle();
				$("#make-room-option").toggle();
			})
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
				if (offset == 0) {
					$btnPrev.attr("disabled", "disabled");
				} else {
					$btnPrev.removeAttr("disabled");
				}
				if (offset + ROWSIZE >= cnt) {
					$btnNext.attr("disabled", "disabled");
				} else {
					$btnNext.removeAttr("disabled");
				}
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
		function init($el) {
			stockTable = new QuestionTable($("#edit-question-stock"), false);
			publishedTable = new QuestionTable($("#edit-question-published"), true);

			$tab = $el.find(".tab-content").tabs({
				"activate" : function() {
					getActiveTable().activate();
				}
			});
			con.request({
				"command" : "countQuestion",
				"success" : function(data) {
					stockTable.count(data.count - data.published);
					publishedTable.count(data.published);
					$("#question-stock-count").text(stockTable.count());
					$("#question-published-count").text(publishedTable.count());
					stockTable.activate();
				}
			});
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
			"clear" : clear
		})
	}
	function MakeQuestion(app, roomId, userId, admin, con) {
		function clearField() {
			$("#make-q-question").val("");
			$("#make-q-answers").val("");
			$("#make-q-answerType").val(AnswerType.FistRow);
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
			})
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
		function update() {
			if (validator && validator.form()) {
				var data = collectField();
				if (editQuestion) {
					con.request({
						"command" : "updateQuestion",
						"data" : data,
						"success" : function(data) {
							editQuestion = data;
							if (!eventId) {
								app.showQuestionList("left");
							}
						}
					});
				} else {
					con.request({
						"command" : "createQuestion",
						"data" : data,
						"success" : function(data) {
							if (admin) {
								editQuestion = data;
								if (eventId) {
									$btnUpdate.text(MSG.update);
									$publish.show();
								} else {
									app.showQuestionList("left");
								}
							} else {
								app.showMessage(MSG.questionPosted);
								app.tweet(MSG.postQuestionMessage, false);
								clearField();
							}
						}
					});
				}
			}
		}
		function publish() {
			alert("Not implemented yet.")
		}
		function init() {
			$form = $("#make-q-form");
			$form.find(":input").each(function() {
				var $input = $(this),
					id = $input.attr("id");
				$input.attr("name", id);
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
			$btnUpdate = $("#make-q-update-btn").click(function() {
				update();
			});
			$publish = $("#make-q-publish");
			if (editQuestion && eventId) {
				$publish.show();
			}
			$btnPublish = $("#make-q-publish-btn").click(publish);
			$("#make-q-option-btn").click(function() {
				$(this).find("i").toggle();
				$("#make-q-option").toggle();
			})
			if (editQuestion) {
				$("#make-q-h1").text(eventId ? MSG.editAndPublishQuestion : MSG.editQuestion);
				$btnUpdate.text(MSG.update);
			}
			if (admin) {
				$("#make-q-back-btn").click(function() {
					app.showQuestionList("left");
				}).show();
			}
		}
		function clear() {
			editQuestion = null;
			$form = null;
			validator = null;
			$btnUpdate = null;
			$btnPublish = null;
			$publish = null;
		}
		var eventId = 0,
			editQuestion = null,
			$form = null,
			$btnUpdate = null,
			$btnPublish = null,
			$publish = null,
			validator = null;
		$.extend(this, {
			"openEvent" : openEvent,
			"init" : init,
			"clear" : clear,
			"edit" : function(q) { editQuestion = q;}
		})
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
			var msg = $("#debug-msg").val(),
				sec = $("#debug-msg-sec").val();
			messageDialog.show(msg, sec);
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
			messageDialog = new MessageDialog($("#msg-dialog"));
			con = new flect.Connection(params.uri, debug);
			home = new Home(con);
			makeRoom = new MakeRoom(params.userId, con, messageDialog);
			templateManager = new flect.TemplateManager(con, $("#content-dynamic"));
			$content = $("#content");

			if (params.debug) {
				debug.setImpl(new PageDebugger($("#debug"), con, messageDialog));
				$("#btn-debug").click(function() {
					showStatic("debug", true);
					return false;
				})
				con.onError(function(data) {
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
				chat = new Chat($chat, params.userId, con);
				$(".menu-chat").click(function() {
					showStatic("chat", $(this).parents("#sidr").length > 0);
					return false;
				});
				con.addEventListener("chat", function(data) {
					chat.append(data);
					if (data.userId != params.userId) {
						showMessage(data.msg);
					}
				});
				con.addEventListener("member", chat.member);
				con.ready(function() {
					if (chat.member() == 0) {
						con.request({
							"command" : "member"
						})
					}
				})
			}
			if ($("#home").length) {
				home.init($("#home"), false);
			}
			if (params.roomAdmin || params.userQuiz) {
				makeQuestion = new MakeQuestion(self, params.roomId, params.userId, params.roomAdmin, con)
			}
			if (params.roomAdmin) {
				questionList = new QuestionList(self, users, params.userId, con)
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
		}
		var debug,
			messageDialog,
			con,
			home,
			makeQuestion,
			makeRoom,
			templateManager,
			chat,
			questionList,
			$content,
			users = {};
		init();

		var TemplateLogic = {
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
			"showMessage" : showMessage,
			"tweet" : tweet
		})
	}
});