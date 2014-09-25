flect.QuizApp = function(serverParams) {
	var self = this;
	function showDynamic(id, initial) {
		$.sidr("close");
		var params = $.extend({
				"name" : id
			}, TemplateLogic[id]);
		if (initial) {
			params.effect = "none";
		} else {
			pushState.pushDynamic(id);
		}
		$content.children("div").hide();
		templateManager.show(params);
	}
	function showStatic(id, sidr, func) {
		function doShowStatic() {
			$.sidr("close");
			if (!$el.is(":visible")) {
				$content.children("div").hide();
				$el.show("slide", { "direction" : "right"}, EFFECT_TIME, func);
				pushState.pushStatic(id);
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
		showStatic("chat", false, chat.calcHeight);
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
		pushState.pushState({
			"method" : "function",
			"func" : backToMypage
		}, "/mypage");
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
		pushState.pushState({
			"method" : "lookback",
			"qa" : qa
		}, "/room/" + context.roomId + "/question");
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
			pushState.pushDynamic("publish-question");
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
			pushState.pushDynamic("edit-question");
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
			pushState.pushState({
				"method" : "function",
				"func" : function() {
					showMakeQuestion(q);
				}
			})
		}
	}
	function showPasscode() {
		showDynamic("passcode");
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
		pushState = new PushState(self, context);
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
			userSetting = new UserSetting(self, context, users, con);
			makeRoom = new MakeRoom(self, context.userId, con);
			$("#menu-mypage").click(function() {
				showDynamic("mypage");
				return false;
			})
			$("#menu-settings").click(function() {
				showDynamic("user-setting");
				return false;
			})
		}

		if (context.isInRoom()) {
			var $chat = $("#chat");
			chat = new Chat($chat, context, con);
			$(".menu-chat").click(function() {
				showStatic("chat", $(this).parents("#sidr").length > 0, chat.calcHeight);
				return false;
			});
			$("#toolbar-ranking").click(function() {
				showRanking();
				return false;
			})
			$("#toolbar-question").click(function() {
				if (context.isRoomAdmin()) {
					if (!context.isEventRunning() || context.isEventAdmin()) {
						showQuestionList();
					}
					return false;
				}
				showQuestion();
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
					adminId = data.admin,
					answerTime = data.answerTime;
				effectDialog.show(MSG.start);
				context.openEvent(eventId, adminId == context.userId, answerTime);
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
				$("#toolbar").css("left", "260px");
				$("#tabbar").css("left", "260px");
			},
			"onClose" : function() {
				$("#toolbar").css("left", "0px");
				$("#tabbar").css("left", "0px");
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
				$.sidr('close');
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
			var id = $(this).attr("href").substring(1);
			$.sidr("close", function() {
				showDynamic(id);
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
	function showInitial(initial) {
		function redirectToDefault() {
			if (context.isInRoom()) {
				location.href = "/room/" + context.roomId;
			} else {
				location.href = "/";
			}
		}
		var path = location.pathname;
		if (path == "/" || path == "/home") {
			showDynamic("home", initial);
		} else if (path == "/mypage") {
			if (context.isLogined()) {
				showDynamic("mypage", initial);
			} else {
				redirectToDefault();
			}
		} else if (path == "/makeRoom") {
			if (context.isLogined()) {
				showDynamic("make-room", initial);
			} else {
				redirectToDefault();
			}
		} else if (path == "/userSetting") {
			if (context.isLogined()) {
				showDynamic("user-setting", initial);
			} else {
				redirectToDefault();
			}
		} else if (path == "/help") {
			showDynamic("help", initial);
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
					showDynamic("publish-question", initial);
					break;
				case "ranking":
					showDynamic("ranking", initial);
					break;
				case "chat":
					if (initial) {
						$("#chat").show();
						chat.calcHeight();
					} else {
						showChat();
					}
					break;
				case "editRoom":
					if (context.isRoomAdmin()) {
						showDynamic("edit-room", initial);
					} else {
						redirectToDefault();
					}
					break;
				case "event":
					if (context.isRoomAdmin()) {
						showDynamic("edit-event", initial);
					} else {
						redirectToDefault();
					}
					break;
				case "questionList":
					if (context.isRoomAdmin()) {
						showDynamic("edit-question", initial);
					} else {
						redirectToDefault();
					}
					break;
				case "postQuestion":
					if (!context.isRoomAdmin() && context.isPostQuestionAllowed()) {
						showDynamic("post-question", initial);
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
		userSetting,
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
		pushState,
		users = {};
	if (!window.WebSocket) {
		$("#content").prepend("<div class='alert alert-danger'>" + MSG.websocketNotSupported + "</div>");
		return;
	}
	init();
	debug.log("params", context);
	var TemplateLogic = {
		"home" : {
			"beforeShow" : home.init,
			"afterHide" : home.clear
		},
		"publish-question" : {
			"name" : "publish-question",
			"beforeShow" : publishQuestion.init,
			"afterHide" : publishQuestion.clear
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
			"user-setting" : {
				"beforeShow" : userSetting.init,
				"afterHide" : userSetting.clear
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
	if (entryEvent) {
		$.extend(TemplateLogic, {
			"passcode" : {
				"name" : "passcode",
				"beforeShow" : entryEvent.init,
				"afterHide" : entryEvent.clear
			}
		});
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
		"showDynamic" : showDynamic,
		"showStatic" : showStatic,
		"showInitial" : showInitial,
		"backToMypage" : backToMypage,
		"tweet" : tweet
	});
	con.ready(function() {
		showInitial(true);
	});
}
