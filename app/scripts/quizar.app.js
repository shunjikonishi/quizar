flect.QuizApp = function(serverParams) {
	var self = this;
	function showDynamic(id, noEffect) {
		var params = $.extend({
				"name" : id
			}, TemplateLogic[id]);
		if (noEffect) {
			params.effect = "none";
		}
		$content.children("div").hide();
		templateManager.show(params);
	}
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
	function backToMypage() {
		var params = {
			"name" : "mypage",
			"direction" : "left",
			"beforeShow" : mypage.init,
			"afterHide" : mypage.clear
		};
		$content.children("div").hide();
		templateManager.show(params);
	}
	function showLookback(qa) {
		var params = {
			"name" : "publish-question",
			"beforeShow" : function($el) {
				publishQuestion.setLookback(qa);
				publishQuestion.init($el);
			},
			"afterHide" : function() {
				publishQuestion.clear();
				publishQuestion.setLookback(null);
			}
		};
		$content.children("div").hide();
		templateManager.show(params);
	}
	function showQuestion(data) {
		if (publishQuestion) {
			var params = {
				"name" : "publish-question",
				"effect" : "none",
				"beforeShow" : function($el) {
					if (data) {
						publishQuestion.setQuestion(data);
					}
					publishQuestion.init($el);
				},
				"afterShow" : publishQuestion.afterShow,
				"afterHide" : publishQuestion.clear
			};
			$content.children("div").hide();
			templateManager.show(params);
		}
	}
	function showRanking() {
		showDynamic("ranking");
	}
	function showQuestionList(direction) {
		if (questionList) {
			var params = $.extend({
				"name" : "edit-question"
			}, TemplateLogic["edit-question"]);
			if (direction) {
				if (direction == "none") {
					params.effect = "none";
				} else {
					params.direction = direction;
				}
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
		home = new Home(con, users, context.userId);
		templateManager = new flect.TemplateManager(con, $("#content-dynamic"));
		publishQuestion = new PublishQuestion(self, context, con);
		$content = $("#content");

		if (context.isDebug()) {
			debug.setImpl(new PageDebugger($("#debug"), con, messageDialog));
			$("#btn-debug").click(function() {
				showStatic("debug", true);
				return false;
			})
			con.onOpen(function(event) {
				console.log("onOpen");
				console.log(event)
			}).onClose(function(event) {
				console.log("onClose");
				console.log(event);
			}).onSocketError(function(event) {
				console.log("onSocketError");
				console.log(event);
			}).onServerError(function(data) {
				console.log(data);
				alert(data);
			});
		}
		con.addEventListener("redirect", function(data) {
			location.href = data;
		})
		if (context.isLogined()) {
			users[context.userId] = new User({
				"id" : context.userId,
				"name" : context.username,
				"imageUrl" : context.userImage
			});
			mypage = new Mypage(self, context, users, con);
			makeRoom = new MakeRoom(app, context.userId, con);
		}

		if (context.isInRoom()) {
			var $chat = $("#chat");
			chat = new Chat($chat, context.userId, context.hashtag, con);
			$(".menu-chat").click(function() {
				showStatic("chat", $(this).parents("#sidr").length > 0);
				return false;
			});
			$("#toolbar-ranking").click(function() {
				showRanking();
				return false;
			})
			$("#toolbar-question").click(function() {
				if (context.isEventAdmin()) {
					showQuestionList();
				} else {
					showQuestion();
				}
				return false;
			})
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
				var eventId = data.id,
					adminId = data.admin;
				effectDialog.show(MSG.start);
				context.openEvent(eventId, adminId == context.userId);
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

			con.addEventListener("question", function(data) {
				showQuestion(data);
			});
			con.addEventListener("answer", publishQuestion.receiveAnswer);
			con.addEventListener("answerDetail", publishQuestion.receiveAnswerDetail);

			ranking = new Ranking(self, context, users, con);
		}
		if (context.isRoomAdmin() || context.isPostQuestionAllowed()) {
			makeQuestion = new MakeQuestion(self, context, con);
			if (context.isEventRunning()) {
				makeQuestion.openEvent(context.eventId);
			}
		}
		if (context.isRoomAdmin()) {
			questionList = new QuestionList(self, users, context, con);
			editEvent = new EditEvent(self, context, con);
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
			eventMembers = new EventMembers(self, context, con);
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
	function showInitial() {
		function redirectToDefault() {
			location.href = "/room/" + context.roomId;
		}
		var path = location.pathname;
		if (path == "/" || path == "/home") {
			showDynamic("home", true);
		} else if (path == "/makeRoom") {
			showDynamic("make-room", true);
		} else if (path == "/help") {
			showDynamic("help", true);
		} else {
			var array = path.substring(1).split("/");
			if (array.length == 2) {
				if (context.isRoomAdmin()) {
					array.push("questionList");
				} else {
					array.push("chat");
				}
			}
			switch (array[2]) {
				case "question":
					showQuestion();
					break;
				case "ranking":
					showDynamic("ranking", true);
					break;
				case "chat":
					$("#chat").show();
					break;
				case "editRoom":
					if (context.isRoomAdmin()) {
						showDynamic("edit-room", true);
					} else {
						redirectToDefault();
					}
					break;
				case "event":
					if (context.isRoomAdmin()) {
						showDynamic("edit-event", true);
					} else {
						redirectToDefault();
					}
					break;
				case "questionList":
					if (context.isRoomAdmin()) {
						showQuestionList("none");
					} else {
						redirectToDefault();
					}
					break;
				case "postQuestion":
					if (!context.isRoomAdmin() && context.isPostQuestionAllowed()) {
						showDynamic("post-question", true);
					} else {
						redirectToDefault();
					}
					break;
			}
		}
	}
	var context = new Context(serverParams),
		debug,
		messageDialog,
		effectDialog,
		con,
		home,
		mypage,
		makeQuestion,
		makeRoom,
		editEvent,
		eventMembers,
		entryEvent,
		templateManager,
		chat,
		questionList,
		publishQuestion,
		ranking,
		$content,
		users = {};
	init();
	debug.log("params", context);
	var TemplateLogic = {
		"home" : {
			"beforeShow" : home.init,
			"afterHide" : home.clear
		}
	}
	if (context.isLogined()) {
		$.extend(TemplateLogic, {
			"mypage" : {
				"beforeShow" : function($el) {
					mypage.reset();
					mypage.init($el);
				},
				"afterHide" : mypage.clear
			},
			"make-room" : {
				"beforeShow" : function($el) {
					makeRoom.clear();
					makeRoom.init($el);
				},
				"afterHide" : makeRoom.clear
			},
			"publish-question" : {
				"name" : "publish-question",
				"beforeShow" : publishQuestion.init,
				"afterHide" : publishQuestion.clear
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
		});
	}
	if (context.isRoomAdmin()) {
		$.extend(TemplateLogic, {
			"edit-question" : {
				"beforeShow" : questionList.init,
				"afterHide" : questionList.clear
			}
		})
		$.extend(TemplateLogic, {
			"edit-event" : {
				"beforeShow" : function($el) {
					if (context.isEventRunning()) {
						eventMembers.init($el);
					} else {
						editEvent.init($el);
					}
				},
				"name" : function() {
					return context.isEventRunning() ? "event-members" : "edit-event";
				},
				"afterHide" : function() {
					if (context.isEventRunning()) {
						eventMembers.clear();
					} else {
						editEvent.clear();
					}
				}
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
			"ranking" : {
				"name" : "ranking",
				"beforeShow" : ranking.init,
				"afterShow" : ranking.afterShow,
				"afterHide" : ranking.clear
			}
		})
	}
	$.extend(this, {
		"showQuestionList" : showQuestionList,
		"showMakeQuestion" : showMakeQuestion,
		"showPasscode" : showPasscode,
		"showChat" : showChat,
		"showRanking" : showRanking,
		"showQuestion" : showQuestion,
		"showLookback" : showLookback,
		"showMessage" : showMessage,
		"showEffect" : showEffect,
		"backToMypage" : backToMypage,
		"tweet" : tweet
	});
	con.ready(showInitial);
}
