if (typeof(flect) === "undefined") flect = {};

$(function() {
	var SUPPORTS_TOUCH = 'ontouchstart' in window;

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
	function QuestionList(userId, userImage, con, templateManager) {
		function appendTr($tbody, q) {
			var $tr = $("<tr><td class='question-creator'><img src='/assets/images/twitter_default_profile.png'/></td>" +
				"<td class='question-text'></td></tr>"),
				$img = $tr.find("img");

			$tr.find(".question-text").text(q.question);
			if (images[q.createdBy]) {
				$img.attr("src", images[q.createdBy]);
			} else {
				$img.attr("data-userId", q.createdBy);
				con.request({
					"command" : "userImage",
					"data" : q.createdBy,
					"success" : function(data) {
						if (data.url) {
							images[data.id] = data.url;
							$el.find("[data-userId=" + data.id + "]").attr("src", data.url).removeAttr("data-userId");
						}
					}
				})
			}
			$tbody.append($tr);
		}
		function loadData(published, offset, limit) {
			var $tbody = published ? $publishedBody : $stockBody;
			con.request({
				"command" : "listQuestion",
				"data" : {
					"published" : published,
					"offset" : offset,
					"limit" : limit
				},
				"success" : function(data) {
					$tbody.empty();
					for (var i=0; i<data.length; i++) {
						appendTr($tbody, data[i]);
					}
				}
			});
		}
		function init($el) {
			$el.find(".tab-content").tabs();
			con.request({
				"command" : "countQuestion",
				"success" : function(data) {
					publishCount = data.published;
					stockCount = data.count - publishCount;
					$("#question-stock-count").text(stockCount);
					$("#question-published-count").text(publishCount);
				}
			});
			loadData(false, 0, 0);
			loadData(true, 0, 0);
			$("#edit-question-new").click(function() {
				templateManager.show("make-question");
			})
		}
		var stockCount = -1,
			publishCount = -1,
			$stockBody = $("#edit-question-stock").find("table tbody"),
			$publishedBody = $("#edit-question-published").find("table tbody"),
			images = {};
		images[userId] = userImage;

		$.extend(this, {
			"init" : init
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
		function showStatic(id, sidr) {
			function doShowStatic() {
				if (!$el.is(":visible")) {
					$content.children("div").hide();
					$el.show("slide", { "direction" : "right"}, 750);
				}
			}
			var $el = $("#" + id);
			if (sidr) {
				$.sidr("close", doShowStatic);
			} else {
				doShowStatic();
			}
		}
		function init() {
			if (window.sessionStorage) {
				sessionStorage.clear();
			}

			debug = new DebuggerWrapper();
			msgDialog = new MessageDialog($("#msg-dialog"));
			con = new flect.Connection(params.uri, debug);
			home = new Home(con);
			makeRoom = new MakeRoom(params.userId, con, msgDialog);
			templateManager = new flect.TemplateManager(con, $("#content-dynamic"));
			$content = $("#content");

			if (params.debug) {
				debug.setImpl(new PageDebugger($("#debug"), con, msgDialog));
				$("#btn-debug").click(function() {
					showStatic("debug", true);
					return false;
				})
			}
			
			if (params.roomId) {
				var $chat = $("#chat");
				chat = new Chat($chat, params.userId, con);
				$(".menu-chat").click(function() {
					showStatic("chat", $(this).parents("#sidr").length > 0);
					return false;
				});
				con.addEventListener("chat", chat.append);
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
			if (params.roomAdmin) {
				questionList = new QuestionList(params.userId, params.userImage, con, templateManager)
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
			var TemplateLogic = {
				"make-room" : {
					"beforeShow" : function($el) {
						makeRoom.clear();
						makeRoom.init($el);
					},
					"afterHide" : function($el) {
						makeRoom.clear();
					}
				},
				"edit-room" : {
					"name" : "make-room",
					"beforeShow" : function($el) {
						makeRoom.clear();
						makeRoom.edit(params.roomId);
						makeRoom.init($el)
					},
					"afterHide" : function($el) {
						makeRoom.clear();
					}
				}
			};
			if (params.roomAdmin) {
				$.extend(TemplateLogic, {
					"edit-question" : {
						"beforeShow" : questionList.init
					}
				})
			}
		}
		var debug,
			msgDialog,
			con,
			home,
			makeRoom,
			templateManager,
			chat,
			questionList,
			$content;
		init();
	}
});