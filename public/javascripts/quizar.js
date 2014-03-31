if (typeof(flect) === "undefined") flect = {};

$(function() {
	function endsWith(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}
	/**
	 * settings
	 * - onOpen(event)
	 * - onClose(event)
	 * - onRequest(command, data)
	 * - onMessage(data, startTime)
	 * - onServerError(msg)
	 */
	flect.Connection = function(wsUri, logger) {
		var MAX_RETRY = 5;
		function useAjax() {
			if (arguments.length == 0) {
				return ajaxPrefix;
			}
			var arg = arguments[0];
			if (arg) {
				ajaxPrefix = arg;
			} else {
				ajaxPrefix = null;
			}
			return self;
		}
		function request(params) {
			/*
			if (!isConnected()) {
				if (retryCount < MAX_RETRY) {
					ready(function() {
						request(params);
					});
					socket = createWebSocket();
				}
				return;
			}
			*/
			if (settings.onRequest) {
				settings.onRequest(params.command, params.data);
			}
			if (ajaxPrefix) {
				ajaxRequest(params)
			} else {
				websocketRequest(params)
			}
			return self;
		}
		function ajaxRequest(params) {
			logger.log("ajax", params.command);
			var startTime = new Date().getTime(),
				id = ++requestId,
				url = params.url ? params.url : ajaxPrefix,
				orgSuccess = params.success;

			if (params.command) {
				if (!endsWith(url, "/")) {
					url += "/";
				}
				url += params.command;
				delete params.command;
			}
			url += "?id=" + id;
			if (params.log) {
				url += "&log=" + params.log;
				delete params.log;
			}
			params.url = url;
			if (!params.type) {
				params.type = "POST";
			}
			if (params.data) {
				var data = JSON.stringify(params.data);
				params.data = {
					"data" : data
				}
			}
			params.success = function(data) {
				if (settings.onMessage) {
					settings.onMessage(data, startTime);
				}
				if (!data) {
					return;
				}
				if (data.type == "error") {
					if (settings.onServerError) {
						settings.onServerError(data.data);
					}
					return;
				}
				var func = orgSuccess;
				if (!func) {
					func = listeners[params.command];
				}
				if (func) {
					func(data.data)
				}
			}
			$.ajax(params);
		}
		//command, log, data, success
		function websocketRequest(params) {
			logger.log("ws", params.command);
			var startTime = new Date().getTime(),
				id = ++requestId;
			times[id] = startTime;
			if (params.success) {
				listeners[id] = params.success;
			}
			var msg = {
				"id" : id,
				"command" : params.command,
				"data" : params.data
			}
			if (params.log) {
				msg.log = params.log;
			}
			socket.send(JSON.stringify(msg));
		}
		function addEventListener(name, func) {
			listeners[name] = func;
			return self;
		}
		function removeEventListener(name) {
			delete listeners[name];
			return self;
		}
		function onOpen(event) {
			retryCount = 0;
			for (var i=0; i<readyFuncs.length; i++) {
				readyFuncs[i]();
			}
			readyFuncs = [];
			if (settings.onOpen) {
				settings.onOpen(event);
			}
		}
		function onMessage(event) {
			var data = JSON.parse(event.data),
				startTime = times[data.id],
				func = null;
			if (startTime) {
				delete times[data.id];
			}
			if (settings.onMessage) {
				settings.onMessage(data, startTime);
			}
			if (data.type == "error") {
				if (settings.onServerError) {
					settings.onServerError(data.data);
				}
				return;
			}
			if (data.id && listeners[data.id]) {
				func = listeners[data.id];
				delete listeners[data.id];
			} else if (data.command && listeners[data.command]) {
				func = listeners[data.command];
			}
			if (func) {
				func(data.data);
			} else {
				logger.log("UnknownMessage", event.data)
			}
		}
		function onClose(event) {
			if (settings.onClose) {
				settings.onClose(event);
			}
			if (retryCount < MAX_RETRY) {
				retryCount++;
				setTimeout(function() {
					socket = createWebSocket();
				}, retryCount * 1000);
			}
		}
		function onError(event) {
			if (settings.onSocketError) {
				settings.onSocketError(event);
			}
		}
		function polling(interval, params) {
			return setInterval(function() {
				if (isConnected()) {
					request($.extend(true, {}, params));
				}
			}, interval);
		}
		function ready(func) {
			if (isConnected()) {
				func();
			} else {
				readyFuncs.push(func);
			}
		}
		function close() {
			if (isConnected()) {
				retryCount = MAX_RETRY;
				socket.close();
			}
		}
		function isConnected() {
			return socket.readyState == 1;//OPEN
		}
		function createWebSocket() {
			var socket = new WebSocket(wsUri);
			socket.onopen = onOpen;
			socket.onmessage = onMessage;
			socket.onerror = onError;
			socket.onclose = onClose;
			return socket;
		}
		var self = this,
			settings = {},
			requestId = 0,
			times = {},
			listeners = {},
			ajaxPrefix = null,
			readyFuncs = [],
			opened = false,
			retryCount = 0;
			socket = createWebSocket();


		$.extend(this, {
			"useAjax" : useAjax,
			"request" : request,
			"addEventListener" : addEventListener,
			"removeEventListener" : removeEventListener,
			"polling" : polling,
			"ready" : ready,
			"close" : close,
			"isConnected" : isConnected,
			"onOpen" : function(func) { settings.onOpen = func; return this},
			"onClose" : function(func) { settings.onClose = func; return this},
			"onRequest" : function(func) { settings.onRequest = func; return this},
			"onMessage" : function(func) { settings.onMessage = func; return this},
			"onSocketError" : function(func) { settings.onSocketError = func; return this},
			"onServerError" : function(func) { settings.onServerError = func; return this}
		})
	}
});
if (typeof(flect) === "undefined") flect = {};

$(function() {
	var EFFECT_TIME = 300;

	function MemoryStorage() {
		var cache = {};
		function getItem(key) {
			return cache[key];
		}
		function setItem(key, value) {
			cache[key] = value;
		}
		$.extend(this, {
			"getItem" : getItem,
			"setItem" : setItem
		})
	}

	flect.TemplateManager = function(con, $el) {
		function show(params) {
			if (typeof(params) === "string") {
				params = {
					"name" : params
				}
			}
			var name = params.name;
			if (typeof(name) === "function") {
				name = name();
			}
			var template = storage.getItem("template." + name);
			if (!template) {
				loadTemplate(name, function(data) {
					storage.setItem("template." + name, data);
					showTemplate(data, params);
				});
			} else {
				showTemplate(template, params);
			}
		}
		function loadTemplate(name, success) {
			con.request({
				"command" : "template",
				"log" : name,
				"data" : {
					"name" : name
				},
				"success" : success
			})
		}
		function showTemplate(template, params) {
			function doAfterShow() {
				if (params.afterShow) {
					params.afterShow($el);
				}
			}
			if (beforeHide) {
				beforeHide($el);
			}
			$el.hide();
			if (afterHide) {
				afterHide($el);
			}
			$el.empty();
			
			$el.html(template);
			if (params.beforeShow) {
				params.beforeShow($el);
			}
			beforeHide = params.beforeHide;
			afterHide = params.afterHide;

			setTimeout(function() {
				var dir = params.direction || "right",
					effect = params.effect;
				if (effect == "none") {
					$el.show(0, doAfterShow)
				} else {
					$el.show("slide", { "direction" : dir}, EFFECT_TIME, doAfterShow);
				}
			}, 0);
		}
		var storage = window.sessionStorage ? window.sessionStorage : new MemoryStorage(),
			beforeHide = null,
			afterHide = null;
		$.extend(this, {
			"show" : show,
			"loadTemplate" : loadTemplate
		});
	}
});
if (typeof(flect) === "undefined") flect = {};

$(function() {
	flect.MessageDialog = function($el) {
		function doShow(second) {
			second = second || 3;
			$el.css({
				"animation-name" : "fade",
				"-webkit-animation-name" : "fade",
				"animation-duration" : second + "s",
				"-webkit-animation-duration" : second + "s"
			});
			$el.show();
			setTimeout(function() {
				$el.hide();
				$el.css("animation-name", "");
				$el.css("-webkit-animation-name", "");
				shown = false;
				if (msgs.length > 0) {
					var temp = msgs;
					msgs = [];
					setTimeout(function() {
						show(temp);
					}, 10)
				} else if (tweets.length > 0) {
					var temp = tweets;
					tweets = [];
					setTimeout(function() {
						notifyTweet(temp);
					}, 10)
				}
			}, second * 1000);
		}
		function show(msg, second) {
			if (shown) {
				msgs.push(msg);
				return;
			}
			shown = true;
			if (!$.isArray(msg)) {
				msg = [msg];
			}
			$el.empty();
			for (var i=0; i<msg.length; i++) {
				var $span = $("<span class='message'></span>");
				$span.text(msg[i]);
				$el.append($span);
			}
			doShow(second);
		}
		function notifyTweet(data, second) {
			if (shown) {
				tweets.push(data);
				return;
			}
			shown = true;
			second = second || 3;
			if (!$.isArray(data)) {
				data = [data];
			}
			$el.empty();
			for (var i=0; i<data.length; i++) {
				var tweet = data[i],
					$div = $("<div class='tweet'><img/><p></p><p></p></div>");
				$div.find("img").attr("src", tweet.img);
				$div.find("p:first").text(tweet.username);
				$div.find("p:last").text(tweet.msg);
				$el.append($div);
			}
			doShow(second);
		}
		function notifyUserAction(user, msg) {
			notifyTweet({
				"userId" : user.id,
				"username" : user.name,
				"msg" : msg,
				"img" : user.imageUrl
			});
		}
		var shown = false,
			msgs = [],
			tweets = [];

		$.extend(this, {
			"show" : show,
			"notifyTweet" : notifyTweet,
			"notifyUserAction" : notifyUserAction
		})
	}
});
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

var EFFECT_TIME = 300;
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
		var $i = $ctrl.find("i");
		if ($i.hasClass("fa-caret-down")) {
			$i.removeClass("fa-caret-down").addClass("fa-caret-up");
			$ctrl.addClass("active");
		} else {
			$i.removeClass("fa-caret-up").addClass("fa-caret-down");
			$ctrl.removeClass("active");
		}
		$panel.slideToggle();
	})
}
function backButtonControl($el) {
	var $pagingBar = $el.find(".paging-bar");
	if ($pagingBar.length) {
		var $div = $pagingBar.parent(),
			$button = $pagingBar.find("button.back-btn");
		if ($button.length) {
			$div.swipe({
				"swipeRight": function(e) {
					$button.click();
					e.stopImmediatePropagation();
				},
				"tap": function (event, target) {
					if (SUPPORTS_TOUCH) {
						$(target).click();
					}
				}
			})
		}
	}
}
function roundTime(t) {
	return Math.round(t / 10) / 100;
}
function slideIn($el, direction) {
	$el.show("slide", {"direction" : direction}, EFFECT_TIME);
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

function PushState(app, context) {
	var ROOM_PREFIX = "/room/" + context.roomId,
		MAX_FUNCS = 20;
	function purgeFuncs() {
		var cnt = 0, min = Number.MAX_VALUE;
		for (var key in funcs) {
			if (min > key) {
				min = key;
			}
			cnt++;
		}
		if (cnt > MAX_FUNCS) {
			delete funcs[key];
		}
	}
	function getUrl(id) {
		switch (id) {
			case "home":
				return "/home";
			case "mypage":
				return "/mypage";
			case "user-setting":
				return "/userSetting";
			case "make-room":
				return "/makeRoom";
			case "help":
				return "/help";
			case "publish-question":
				return ROOM_PREFIX + "/question";
			case "ranking":
				return ROOM_PREFIX + "/ranking";
			case "edit-room":
				return ROOM_PREFIX + "/editRoom";
			case "edit-event":
				return ROOM_PREFIX + "/event";
			case "edit-question":
				return ROOM_PREFIX + "/questionList";
			case "post-question":
				return ROOM_PREFIX + "/postQuestion";
			case "chat":
				return ROOM_PREFIX + "/chat";
			case "debug":
				return ROOM_PREFIX;
		}
		return null;
	}
	function pushDynamic(id) {
		pushState({
			"method" : "dynamic",
			"id" : id
		}, getUrl(id));
	}
	function pushStatic(id) {
		pushState({
			"method" : "static",
			"id" : id
		}, getUrl(id));
	}
	function pushState(obj, url) {
		if (pushEnabled) {
			obj.seq = currentState == null ? 1 : currentState.seq + 1;
			if (obj.method == "function") {
				purgeFuncs();
				funcs[obj.seq] = obj.func;
				delete obj.func;
			}
			currentState = obj;
			history.pushState(obj, null, url);
		}
	}
	function isBackFromLookback(prev, current) {
		if (prev == null || current == null) {
			return false;
		}
		if (prev.method != "lookback" || current.method != "dynamic") {
			return false;
		}
		if (prev.seq <= current.seq) {
			return false;
		}
		return true;
	}
	function popState(event) {
		var obj = event.originalEvent.state;
		if (!obj && !currentState) {
			return;
		}
		pushEnabled = false;
		try {
			if (obj == null) {
				app.showInitial(false);
			} else if (obj.method == "dynamic") {
				if (isBackFromLookback(currentState, obj)) {
					app.backToMypage();
				} else {
					app.showDynamic(obj.id);
				}
			} else if (obj.method == "static") {
				app.showStatic(obj.id);
			} else if (obj.method == "function") {
				var func = funcs[obj.seq];
				if (func) {
					func();
				}
			} else if (obj.method == "lookback") {
				app.showLookback(obj.qa);
			} else {
				console.log("popState: " + JSON.stringify(obj));
			}
		} finally {
			currentState = obj;
			pushEnabled = true;
		}
	}
	var pushEnabled = true,
		funcs = {},
		currentState = null;
	$(window).on("popstate", popState);

	$.extend(this, {
		"pushState" : pushState,
		"pushDynamic" : pushDynamic,
		"pushStatic" : pushStatic
	})
}
function PagingBar($el, count, func, rowSize) {
	function prev() {
		if (offset > 0) {
			offset -= rowSize;
			func(offset, rowSize, false);
			buttonControl();
		}
	}
	function next() {
		if (offset + rowSize < count) {
			offset += rowSize;
			func(offset, rowSize, true);
			buttonControl();
		}
	}
	function buttonControl() {
		enableInput($btnPrev, offset > 0);
		enableInput($btnNext, offset + rowSize < count);
	}
	function recordCount() {
		if (arguments.length == 0) {
			return count;
		} else {
			count = arguments[0];
			return this;
		}
	}
	function swipeParams() {
		return {
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
		};
	}
	function release() {
		$btnPrev = null;
		$btnNext = null;
	}
	var offset = 0,
		$btnPrev = $el.find(".paging-bar-left"),
		$btnNext = $el.find(".paging-bar-right");
	rowSize = rowSize || 10;
	$btnPrev.click(prev);
	$btnNext.click(next);
	buttonControl();
	$el.parent().swipe({
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
	});

	$.extend(this, {
		"prev" : prev,
		"next" : next,
		"recordCount" : recordCount,
		"release" : release
	})
}
function EffectDialog($el) {
	function show(msg, second) {
		if (!second) {
			second = 5;
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
	function isEventAdmin() { return !!self.eventAdmin;}
	function isInRoom() { return !!self.roomId;}
	function isRoomAdmin() { return !!self.roomAdmin;}
	function isPostQuestionAllowed() { return !!self.userQuiz;}
	function isDebug() { return !!self.debug;}
	function openEvent(eventId, admin) {
		self.eventId = eventId;
		self.eventStatus = EventStatus.Running;
		self.eventAdmin = admin;
	}
	function closeEvent() {
		self.eventId = 0;
		self.eventStatus = EventStatus.Prepared;
		self.userEventId = 0;
		self.eventAdmin = false;
	}
	function entryEvent(userEventId) {
		self.userEventId = userEventId;
	}
	function canEntryEvent() {
		return isLogined() && isInRoom() && !isRoomAdmin();
	}
	function setNotifyTweet(value) {
		this.notifyTweet = value;
		$.cookie("notifyTweet", value ? 1 : 0, {
			"path" : "/",
			"expires" : 100
		});
	}

	$.extend(this, hash, {
		"isLogined" : isLogined,
		"isEntryEvent" : isEntryEvent,
		"isEventRunning" : isEventRunning,
		"isEventAdmin" : isEventAdmin,
		"isInRoom" : isInRoom,
		"isRoomAdmin" : isRoomAdmin,
		"isPostQuestionAllowed" : isPostQuestionAllowed,
		"isDebug" : isDebug,
		"openEvent" : openEvent,
		"closeEvent" : closeEvent,
		"entryEvent" : entryEvent,
		"canEntryEvent" : canEntryEvent,
		"setNotifyTweet" : setNotifyTweet
	});
	if (!this.eventStatus) {
		this.eventStatus = EventStatus.Prepared;
	}
	this.notifyTweet = $.cookie("notifyTweet") == 1;
	setNotifyTweet(this.notifyTweet);
}

function User(hash) {
	function getMiniImageUrl() { return this.imageUrl;}
	function getNormalImageUrl() { return this.imageUrl.replace("_mini", "_normal");}
	function getBiggerImageUrl() { return this.imageUrl.replace("_mini", "_bigger");}

	$.extend(this, hash, {
		"getMiniImageUrl" : getMiniImageUrl,
		"getNormalImageUrl" : getNormalImageUrl,
		"getBiggerImageUrl" : getBiggerImageUrl
	});
	clearHash(hash);
}

function Home(con, users, userId) {
	function enterRoom() {
		var id = $(this).attr("data-id");
		if (id) {
			location.href = "/room/" + id;
		}
	}
	function backToList() {
		var idx = $tab.tabs("option", "active"),
			$el = idx == 0 ? $("#event-future") : $("#event-yours");
		$("#event-detail").hide();
		slideIn($el, "left");
	}
	function showRoomInfo(room) {
		$("#room-detail-enter").attr("data-id", room.id);
		$("#room-detail-name").text(room.name);
		if (room.userQuiz) {
			$("#room-detail-userQuiz").attr("checked", "checked");
		}
		$("#room-detail-description").text(room.description || "");
		if (room.event) {
			$("#room-detail-event").show();
			$("#room-detail-title").text(room.event.title || "-");
			$("#room-detail-date").text(
				room.event.execDate ? 
					new DateTime(room.event.execDate).datetimeStr() : 
					"-"
			);
			$("#room-detail-capacity").text(MSG.format(MSG.numberWithPeople, room.event.capacity));
			$("#room-detail-description2").text(room.event.description || "");
		} else {
			$("#room-detail-event").hide();
		}
		$tab.find(".tab-pane").hide();
		slideIn($("#event-detail"), "right");
	}
	function bindEvent($el) {
		$el.find("tbody tr").click(function() {
			var room = $.data(this, "room");
			if (room) {
				showRoomInfo(room);
			}
			return false;
		});
		$el.find("tbody tr button").click(function() {
			var room = $.data($(this).parents("tr")[0], "room");
			if (room) {
				location.href = "/room/" + room.id;
			}
			return false;
		});
	}
	function buildTable($el, data) {
		var $tbody = $el.find("tbody"),
			cache = {};

		for (var i=0; i<data.length; i++) {
			var room = data[i],
				$tr = $("<tr><td class='event-date'></td>" +
					"<td class='event-title'><img src='" + DEFAULT_IMAGE + "'/></td>" +
					"<td class='event-capacity'></td>" +
					"<td class='event-enter'><button class='btn blue'>" + MSG.enter +
					"</button></td></tr>"),
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
					$tr.find(".event-date").addClass("in-session");
				} else if (room.event.execDate) {
					date = new DateTime(room.event.execDate).datetimeStr();
				}
				if (room.event.capacity) {
					capacity = MSG.format(MSG.numberWithPeople, room.event.capacity);
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
			$.data($tr[0], "room", room);
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
				$tab = $el.find(".tab-content").tabs({
					"beforeActivate" : function() {
						$tab.find(".tab-pane").hide();
					}
				}).show();
			}
		});
		if (userId) {
			con.request({
				"command" : "listRoom",
				"data" : {
					"limit" : 10,
					"offset" : 0,
					"userId" : userId
				},
				"success" : function(data) {
					buildTable($yours, data);
					bindEvent($yours);
				}
			})
		}
		$("#room-detail-enter").click(enterRoom);
		$("#room-detail-back").click(backToList);
		backButtonControl($("#event-detail"));
	}
	function clear() {
		$tab = null;
	}
	var $tab = null;
	$.extend(this, {
		"init" : init,
		"clear" : clear
	})
}

function UserSetting(app, context, users, con) {
	function update() {
		var username = $("#user-name").val();
		if (username && username != context.username) {
			con.request({
				"command" : "updateUser",
				"data" : {
					"userId" : context.userId,
					"name" : username
				},
				"success" : function(data) {
					if (data) {
						app.showMessage(MSG.successUpdate);
						setTimeout(function() {
							var href = context.isInRoom() ? "/room/" + context.roomId : "/";
							location.href = href;
						}, 3000);
					}
				}
			})
		}
	}
	function init() {
		$("#user-name").val(context.username);
		if (context.notifyTweet) {
			$("#user-notify-tweet").attr("checked", "checked");
		}
		$("#user-notify-tweet").change(function() {
			var b = $(this).is(":checked");
			context.setNotifyTweet(b);
		})
		$("#btn-user-setting").click(update);
	}
	function clear() {
	}
	$.extend(this, {
		"init" : init,
		"clear" : clear
	})
}
function Mypage(app, context, users, con) {
	var ENTRY_COLUMNS = ["r-room", "r-point", "r-correct"],
		OWNER_COLUMNS = ["r-room", "r-event", "r-question"],
		EVENT_COLUMNS = ["r-title", "r-point", "r-correct"],
		OWNER_EVENT_COLUMNS = ["r-title", "r-member", "r-publish"],
		QUESTION_COLUMNS = ["q-text", "q-correct"];

	function buildRank($td, rank, correctCount) {
		if (!correctCount) {
			$td.text("-");
		} else if (rank <= 3) {
			$td.html("<span class='badge circle rank-blue'>" + rank + "</span>");
		} else {
			$td.text(rank);
		}
		$td.attr("data-sortAs", rank);
	}
	function buildTable($tbody, columns, data) {
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = $("<tr></tr>");
			for (var j=0; j<columns.length; j++) {
				var clazz = columns[j],
					$td = $("<td></td>");
				$td.addClass(clazz);
				if (clazz == "r-room") {
					var $img = $("<img/>");
					$img.attr("src", rowData.ownerImage);
					$td.append($img);
					$td.append(rowData.roomName);
				} else if (clazz == "r-title") {
					$td.text(rowData.title || new DateTime(rowData.execDate).datetimeStr());
				} else if (clazz == "r-point") {
					$td.text(rowData.point);
				} else if (clazz == "r-correct") {
					$td.text(rowData.correctCount);
				} else if (clazz == "r-event") {
					$td.text(rowData.eventCount);
				} else if (clazz == "r-question") {
					$td.text(rowData.questionCount);
				} else if (clazz == "q-text") {
					$td.text(rowData.question);
				} else if (clazz == "r-member") {
					$td.text(MSG.format(MSG.numberWithPeople, rowData.userCount));
				} else if (clazz == "r-publish") {
					$td.text(rowData.publishCount);
				} else if (clazz == "q-correct") {
					if (rowData.userAnswer) {
						var icon = rowData.correct ? "fa-circle-o" : "fa-times",
							$i = $("<i class='fa'></i>");
						$i.addClass(icon);
						$td.append($i);
					}
				}
				if (rowData.owner && !users[rowData.owner]) {
					users[rowData.owner] = new User({
						"id" : rowData.owner,
						"name" : rowData.ownerName,
						"imageUrl" : rowData.ownerImage
					});
				}
				$tr.append($td);
			}
			$tbody.append($tr);
			$.data($tr[0], "obj", rowData);
		}
	}
	function buildEvents(roomInfo, events) {
		var $tbody = $("#mypage-events tbody");
		$("#mypage-events-roomName").text(roomInfo.name);
		$("#mypage-events-total").text(roomInfo.rank ? roomInfo.rank : "-");
		buildTable($tbody, EVENT_COLUMNS, events);
		$tbody.find("tr").click(showQuestions);
	}
	function showEvents() {
		var room = $.data(this, "obj"),
			$total = $("#mypage-events-total");
		$total.text("-");
		con.request({
			"command" : "getUserEvent",
			"data" : {
				"roomId" : room.roomId,
				"userId" : context.userId
			},
			"success" : function(data) {
				var $pane = $("#mypage-events"),
					$tbody = $pane.find("tbody");
				
				events = data;
				$("#mypage-events-roomName").text(room.roomName);
				buildTable($tbody, EVENT_COLUMNS, data);
				$tab.find(".tab-pane").hide();
				$tbody.find("tr").click(showQuestions);
				slideIn($pane, "right");
			}
		});
		con.request({
			"command" : "getUserTotalRanking",
			"data" : {
				"roomId" : room.roomId,
				"userId" : context.userId
			},
			"success" : function(data) {
				if (data) {
					$total.text(MSG.format(MSG.numberWithRank, data));
				}
				roomInfo = {
					"id" : room.roomId,
					"name" : room.roomName,
					"rank" : data
				}
			}
		})
	}
	function buildOwnersEvents(roomInfo, events) {
		var $tbody = $("#mypage-owners-events tbody");
		$("#mypage-owners-events-roomName").text(roomInfo.name);
		buildTable($tbody, OWNER_EVENT_COLUMNS, events);
		$tbody.find("tr").click(showQuestions);
	}
	function showOwnersEvents() {
		var room = $.data(this, "obj");
		$("#mypage-owners-events-roomName").text(room.roomName);
		con.request({
			"command" : "getEventWithCount",
			"data" : room.roomId,
			"success" : function(data) {
				var $pane = $("#mypage-owners-events"),
					$tbody = $pane.find("tbody");
				
				var newData = [];
				for (var i=0; i<data.length; i++) {
					var event = data[i].event;
					event.eventId = event.id;
					event.userCount = data[i].userCount;
					event.publishCount = data[i].publishCount;
					newData.push(event);
				}
				roomInfo = {
					"id" : room.roomId,
					"name" : room.roomName
				};
				events = newData;
				buildTable($tbody, OWNER_EVENT_COLUMNS, newData);
				$tab.find(".tab-pane").hide();
				$tbody.find("tr").click(showQuestions);
				slideIn($pane, "right");
			}
		});
	}
	function buildQuestions(questions) {
		var $tbody = $("#mypage-questions tbody");
		buildTable($tbody, QUESTION_COLUMNS, questions);
		$tbody.find("tr").click(showLookback);
	}
	function showQuestions() {
		var event = $.data(this, "obj");
		con.request({
			"command" : "getEventQuestions",
			"data" : {
				"eventId" : event.eventId,
				"userId" : context.userId
			},
			"success" : function(data) {
				var $pane = $("#mypage-questions"),
					$tbody = $pane.find("tbody");
				
				questions = data;
				buildTable($tbody, QUESTION_COLUMNS, data);
				$tbody.find("tr").click(showLookback);
				$tab.find(".tab-pane").hide();
				slideIn($pane, "right");
			}
		});
	}
	function showLookback() {
		var q = $.data(this, "obj");
		con.request({
			"command" : "getLookback",
			"data" : q.publishId,
			"success" : function(data) {
				data.userAnswer = q.userAnswer;
				app.showLookback(data);
			}
		})
	}
	function init($el) {
		$tab = $el.find(".tab-content").tabs({
			"beforeActivate" : function() {
				$tab.find(".tab-pane").hide();
			}
		}).show();
		con.request({
			"command" : "entriedRooms",
			"data" : {
				"limit" : 100,
				"offset" : 0,
				"userId" : context.userId
			},
			"success" : function(data) {
				var $tbody = $("#mypage-entries tbody");
				buildTable($tbody, ENTRY_COLUMNS, data);
				$tbody.find("tr").click(showEvents);
			}
		});
		con.request({
			"command" : "ownedRooms",
			"data" : {
				"limit" : 100,
				"offset" : 0,
				"userId" : context.userId
			},
			"success" : function(data) {
				var $tbody = $("#mypage-owners tbody");
				buildTable($tbody, OWNER_COLUMNS, data);
				$tbody.find("tr").click(showOwnersEvents);
			}
		});
		$("#mypage-events-back").click(function() {
			roomInfo = null;
			events = null;
			$tab.find(".tab-pane").hide();
			slideIn($("#mypage-entries"), "left");
		})
		$("#mypage-owners-events-back").click(function() {
			roomInfo = null;
			events = null;
			$tab.find(".tab-pane").hide();
			slideIn($("#mypage-owners"), "left");
		})
		$("#mypage-questions-back").click(function() {
			questions = null;
			$tab.find(".tab-pane").hide();
			if (roomInfo.rank) {
				slideIn($("#mypage-events"), "left");
			} else {
				slideIn($("#mypage-owners-events"), "left");
			}
		})
		if (roomInfo && events) {
			if (!roomInfo.rank) {
				$tab.tabs("option", "active", 1);
			}
			$tab.find(".tab-pane").hide();
			if (roomInfo.rank) {
				buildEvents(roomInfo, events);
			} else {
				buildOwnersEvents(roomInfo, events);
			}
			if (questions) {
				buildQuestions(questions);
				$("#mypage-questions").show();
			} else if (roomInfo.rank) {
				$("#mypage-events").show();
			} else {
				$("#mypage-owners-events").show();
			}
		}
		backButtonControl($("#mypage-events"));
		backButtonControl($("#mypage-owners-events"));
		backButtonControl($("#mypage-questions"));
	}
	function clear() {
		$tab = null;
	}
	function reset() {
		roomInfo = null;
		events = null;
		questions = null;
	}
	var $tab = null,
		roomInfo = null,
		events = null,
		questions = null;
	$.extend(this, {
		"init" : init,
		"clear" : clear,
		"reset" : reset
	})
}

function Chat($el, context, con) {
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
		return $el.is(":hidden") && context.notifyTweet;
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
			$ul.find("li:first").remove();
		}
		var clazz = (data.userId == userId ? "align-left" : "align-right"),
			$li = $("<li style='display:none;'>" +
				"<div class='contributor'><img/><span/></div>" +
				"<div class='balloon'><div class='balloon-border'>" +
					"<p class='text'></p>" +
				"</div></div></li>"),
			$img = $li.find("img"),
			$username = $li.find(".contributor span"),
			$msg = $li.find(".text");

		$li.addClass(clazz);
		$username.text(data.username);
		$img.attr("src", data.img);
		$msg.text(data.msg);
		$ul.append($li)
		$li.show("slow", function() {
			$tweetBox.scrollTop($tweetBox[0].scrollHeight - $tweetBox.height());
		});
	}
	function calcHeight() {
		var wh = $(window).height(),
			h = 0
		$el.children("div").each(function() {
			var $div = $(this),
				dh = $div.outerHeight();
			if (!$div.hasClass("tweet-box")) {
				if (dh > 0) {
					h += dh;
				}
			}
		});
		h += $("#toolbar").outerHeight();
		h += $("#tabbar").outerHeight();
		$tweetBox.css("height", wh - h - 24);
	}
	var cnt = 0,
		userId = context.userId,
		hashtag = context.hashtag,
		$text = $("#chat-text"),
		$twitter = $("#chat-twitter"),
		$len = $("#chat-text-len span"),
		$tweetBox = $el.find(".tweet-box"),
		$ul = $tweetBox.find("ul"),
		$member = $("#room-member");
	if (userId) {
		$("#btn-tweet").click(function() {
			var msg = $text.val(),
				withTwitter = $twitter.is(":checked");
			if (msg.length == 0 || msg.length > 140 || msg == hashtag) {
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
	$text.keyup();
	$.extend(this, {
		"member" : member,
		"append" : append,
		"tweet" : tweet,
		"isNotifyTweet" : isNotifyTweet,
		"calcHeight" : calcHeight
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
			$desc = $("#make-room-desc");
		if (editRoom) {
			$("#room-admin").show();
			$desc.text(MSG.makeRoomDescForEdit);
			$btnUpdate.text(MSG.update);
		} else {
			$("#room-admin").hide();
			$desc.text(MSG.makeRoomDescForCreate);
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

function QuestionList(app, users, context, con) {
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
				"<td class='q-text'></td>" +
				(published ? 
					"<td class='q-answerer'></td>" : 
					"<td class='q-publish'><button class='btn blue'>" + MSG.publish + "</button></td>"
				) + "</tr>"),
				$img = $tr.find("img");

			$tr.attr("data-id", q.id);
			$tr.attr("data-at", q.answerType);
			$tr.find(".q-text").text(q.question);
			if (users[q.createdBy]) {
				$img.attr("src", users[q.createdBy].getMiniImageUrl())
					.after(users[q.createdBy].name);
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
						$el.find("[data-userId=" + user.id + "]")
							.attr("src", user.getMiniImageUrl())
							.removeAttr("data-userId")
							.after(user.name);
					}
				})
			}
			if (published) {
				var answerer = q.correctCount + "/" + q.publishCount;
				$tr.find(".q-answerer").text(answerer);
				if (publishedQuestions[q.id]) {
					$tr.addClass("q-published");
				}
			} else if (context.isEventRunning()) {
				$tr.find("button").click(function() {
					var $tr = $(this).parents("tr"),
						id = parseInt($tr.attr("data-id")),
						answerType = $tr.attr("data-at");
					con.request({
						"command" : "publishQuestion",
						"data" : {
							"questionId" : id,
							"eventId" : context.eventId,
							"includeRanking" : answerType != AnswerType.NoAnswer
						},
						"success" : function(data) {
							if (data != "OK") {
								app.showMessage(data);
							}
						}
					})
				})
			} else {
				$tr.find("button").attr("disabled", "disabled")
					.removeClass("blue").addClass("disabled");
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
		if (context.isEventRunning()) {
			con.request({
				"command" : "getPublishedQuestions",
				"data" : context.eventId,
				"success" : function(data) {
					for (var i=0; i<data.length; i++) {
						publishedQuestions[data[i]] = true;
					}
				}
			})
		}
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
		publishedQuestions = {};
	}
	var stockTable = null;
		publishedTable = null,
		$tab = null,
		$btnPrev = null,
		$btnNext = null,
		publishedQuestions = {};

	$.extend(this, {
		"init" : init,
		"clear" : clear,
		"reload" : reload
	})
}

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
		if (validator && validator.form()) {
			var q = collectField();
			if (editQuestion && editQuestion.publishCount == 0) {
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
							if (context.isEventAdmin()) {
								app.showMessage(editQuestion ? MSG.successCopy : MSG.successUpdate);
								$btnUpdate.text(MSG.update);
								$publish.show("slow");
								enableInput($form.find(":input"), true);
								enableInput($btnPublish, true);
							} else {
								app.showQuestionList("left");
							}
							editQuestion = data;
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
			if (editQuestion.publishCount > 0) {
				enableInput($form.find(":input"), false);
				$btnUpdate.text(MSG.copy);
			} else {
				$btnUpdate.text(MSG.update);
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
	function showAnswerCounts(answerCounts) {
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
		if (time > TIMELIMIT) {
			app.showMessage(MSG.timeLimitExceeded);
			return;
		}
		applyAnswered($btn);
		$answerBtn = $btn;
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
		showAnswerCounts(answerCounts);
	}
	function receiveAnswer(answer) {
		var idx = "" + answer.answer,
			current = (answerCounts[idx] || 0) + 1;
		answerCounts[idx] = current;
		if (context.isEventAdmin() || answered) {
			setButtonCount(idx, current);
		}
	}
	function getCorrectAnswerButtons(answerDetail, answerCounts) {
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
				var text = $.isArray(answerDetail.answers) ?
					answerDetail.answers[0] : 
					answerDetail.answers.split("\n")[0];
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
						if ($(this).find(".answer-cnt .count").text() == cnt) {
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
	function buildAnswerDetail(answerDetail, answerCounts, effect) {
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
		var $correctBtns = getCorrectAnswerButtons(answerDetail, answerCounts);
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
			$desc.find("pre").text(answerDetail.description);
			$desc.show();
		}
		if (answerDetail.relatedUrl) {
			var $url = $("#publish-q-url"),
				$a = $url.find("a");
			$a.attr("href", answerDetail.relatedUrl).text(answerDetail.relatedUrl);
			$url.show();
		}
		if (effect) {
			$("#publish-q-detail").slideDown();
		} else {
			$("#publish-q-detail").show();
		}
	}
	function receiveAnswerDetail(data) {
		answerDetail = data;
		if (showAnswerDetail) {
			buildAnswerDetail(answerDetail, answerCounts, true);
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
				showAnswerCounts(answerCounts);
				if (answerDetail) {
					buildAnswerDetail(answerDetail, answerCounts, true);
				} else {
					showAnswerDetail = true;
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
		$buttons = $el.find(".btn-question").hide();
		if (lookback) {
			$seq.hide();
			$("#publish-q-progress").hide();
			$("#publish-q-ranking").hide();
			$el.find(".publish-q-animation").hide();
			$("#publish-q-back").show();
			$("#publish-q-back-btn").click(function() {
				app.backToMypage();
			})
			for (var i=0; i<lookback.answers.length; i++) {
				var $btn = $("#answer-" + (i+1)).show();
				$btn.find(".answer-seq").text((i+1) + ".");
				$btn.find(".answer").text(lookback.answers[i]);
			}
			if (lookback.userAnswer) {
				$answerBtn = $("#answer-" + lookback.userAnswer);
			}
			showAnswerCounts(lookback.answerCounts);
			applyDisabled($buttons);
			buildAnswerDetail(lookback, lookback.answerCounts, false);
			$text.text(lookback.question);
			backButtonControl($el);
		} else {
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
				$el.find(".publish-q-animation").css({
					"animation-name" : "",
					"-webkit-animation-name" : ""
				});
				showAnswerCounts(answerCounts);
				applyDisabled($buttons);
				buildAnswerDetail(answerDetail, answerCounts, false);
			} else if (question) {
				$el.find(".publish-q-animation").css({
					"animation-name" : "inout",
					"-webkit-animation-name" : "inout"
				});
				if (context.isEventAdmin()) {
					showAnswerCounts(answerCounts);
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
	}
	function afterShow() {
		if (!answerDetail && !lookback) {
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
		lookback = null;
	}
	function setLookback(qa) {
		lookback = qa;
	}
	var question = null,
		answerCounts = {},
		answerDetail = null,
		answered = false,
		startTime = 0,
		showAnswerDetail = false,
		lookback = null,
		$buttons = null,
		$answerBtn = null,
		$text = null;

	$.extend(this, {
		"init" : init,
		"afterShow" : afterShow,
		"clear" : clear,
		"receiveAnswer" : receiveAnswer,
		"receiveAnswerDetail" : receiveAnswerDetail,
		"setQuestion" : setQuestion,
		"setLookback" : setLookback
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
			if (passcode) {
				doEntry(passcode);
			} else {
				app.showMessage(MSG.invalidPasscode);
			}
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

function EditEvent(app, context, con) {
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
		}
	}
	function collectData() {
		var date = $("#event-date").val(),
			time = $("#event-time").val(),
			ret = {
				"id" : context.eventId || 0,
				"roomId" : context.roomId,
				"status" : context.eventStatus
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
		if (context.eventStatus != EventStatus.Prepared) {
			return;
		}
		if (!context.eventId) {
			updateEvent(true);
		} else {
			con.request({
				"command" : "openEvent",
				"data" : {
					"id" : context.eventId,
					"admin" : context.userId
				},
				"success" : function(data) {
					if (data) {
						app.showQuestionList();
					} else {
						app.showMessage(MSG.failOpenEvent);
					}
				}
			})
		}
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
						context.eventId = data.id;
						context.eventStatus = data.status;
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
		$("#event-start-btn").click(openEvent);
		$("#event-update-btn").click(function() {
			updateEvent(false);
		});
		con.request({
			"command" : "getCurrentEvent",
			"success" : loadEvent
		})
	}
	function clear() {
		$form = null;
		validator = null;
	}
	var $form = null,
		validator = null;
	$.extend(this, {
		"init" : init,
		"clear" : clear
	});
}

function EventMembers(app, context, con) {
	function buildMembers($tbody, data, offset) {
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = $("<tr><td class='r-rank'/><td class='r-name'/>" +
					"<td class='r-correct'/><td class='r-time'/></tr>"),
				$rank = $tr.find(".r-rank"),
				$name = $tr.find(".r-name"),
				$img = $("<img/>");

			$rank.text(rowData.correctCount > 0 ? offset + i + 1 : "-");
			$img.attr("src", rowData.imageUrl);
			$name.append($img);
			$name.append(rowData.username);
			if (rowData.correctCount) {
				$tr.find(".r-correct").text(rowData.correctCount);
				$tr.find(".r-time").text(roundTime(rowData.time));
			}
			$tbody.append($tr);
		}
	}
	function loadData(offset, rowSize, next) {
		var slideDir;
		if (typeof(next) === "boolean") {
			slideDir = next ? "right" : "left";
		}
		con.request({
			"command" : "getEventRanking",
			"data" : {
				"eventId" : context.eventId,
				"offset" : offset,
				"limit" : rowSize
			},
			"success" : function(data) {
				var $table = $("#event-members-tbl"),
					$tbody = $table.find("tbody");
				$tbody.empty();
				if (slideDir) {
					$table.hide();
				}
				buildMembers($tbody, data, offset);
				if (slideDir) {
					$table.show("slide", { "direction" : slideDir}, EFFECT_TIME);
				}
			}
		})

	}
	function closeEvent() {
		if (!context.isEventRunning()) {
			return;
		}
		con.request({
			"command" : "closeEvent",
			"data" : context.eventId,
			"success" : function(data) {
				if (data) {
					app.showRanking();
				}
			}
		})
	}
	function init($el) {
		$("#event-finish-btn").click(closeEvent);
		con.request({
			"command" : "getMemberCount",
			"data" : context.eventId,
			"success" : function(data) {
				pagingBar = new PagingBar($el.find(".paging-bar"), data, loadData, 10);
				loadData(0, 10);
			}
		})
	}	
	function clear() {
		pagingBar = null;
	}
	var pagingBar = null;
	$.extend(this, {
		"init" : init,
		"clear" : clear
	})
}
function Ranking(app, context, users, con) {
	var EVENT_COLUMNS = ["rank", "username", "correctCount", "time"],
		WINNER_COLUMNS = ["title", ["username", "r-winners"], "correctCount", "time"],
		TOTAL_COLUMNS = ["rank", "username", "point", "correctCount"],
		USER_COLUMNS = ["title", "rank", "point", "correctCount"],
		CLASS_MAP = {
			"username" : "r-name",
			"correctCount" : "r-correct"
		};
	function buildRank($td, rank, correctCount) {
		if (!correctCount) {
			$td.text("-");
		} else if (rank <= 3) {
			$td.html("<span class='badge circle rank-blue'>" + rank + "</span>");
		} else {
			$td.text(rank);
		}
		$td.attr("data-sortAs", rank);
	}
	function showEventRanking() {
		var $tr = $(this),
			eventId = parseInt($tr.attr("data-eventId"));
		con.request({
			"command" : "getEventRanking",
			"data" : {
				"eventId" : eventId,
				"limit" : 10
			},
			"success" : function(data) {
				buildRanking($("#ranking-event-detail-tbl"), data);
				$tab.find(".tab-pane").hide();
				$("#ranking-event-detail").show("slide", { "direction" : "right"}, EFFECT_TIME);
			}
		})
	}
	function showUserEvent() {
		var $tr = $(this),
			userId = parseInt($tr.attr("data-userId")),
			user = users[userId];

		con.request({
			"command" : "getUserEvent",
			"data" : {
				"roomId" : context.roomId,
				"userId" : userId
			},
			"success" : function(data) {
				buildUserEvent(data);
				$("#ranking-user-img").attr("src", user.getBiggerImageUrl());
				$("#ranking-user-name").text(user.name);
				$("#ranking-user-point").text($tr.attr("data-point"));

				$tab.find(".tab-pane").hide();
				$("#ranking-user").show("slide", { "direction" : "right"}, EFFECT_TIME);
			}
		})
	}
	function createTr(rowData, columns, rank) {
		var $tr = $("<tr></tr>");
		for (var i=0; i<columns.length; i++) {
			var $td = $("<td></td>"),
				colName = columns[i],
				clazz = null;
			if ($.isArray(colName)) {
				clazz = colName[1];
				colName = colName[0];
			}
			if (!clazz) {
				clazz = CLASS_MAP[colName];
			}
			if (!clazz) {
				clazz = "r-" + colName;
			}
			$td.addClass(clazz);
			if (colName == "username" && rowData.username) {
				var $img = $("<img/>");
				$img.attr("src", rowData.imageUrl);
				$td.append($img);
				$td.append(rowData.username);
			} else if (colName == "title") {
				$td.text(rowData.title || new DateTime(rowData.execDate).datetimeStr());
			} else if (colName == "rank") {
				buildRank($td, rank, rowData.correctCount);
			} else if (colName == "time" && rowData.time) {
				$td.text(roundTime(rowData.time));
			} else if (rowData[colName]) {
				$td.text(rowData[colName]);
			}
			$tr.append($td);
		}
		if (!users[rowData.userId]) {
			users[rowData.userId] = new User({
				"id" : rowData.userId,
				"name" : rowData.username,
				"imageUrl" : rowData.imageUrl
			})
		}
		return $tr;
	}
	function buildRanking($table, data, usePrev) {
		var $tbody = $table.find("tbody"),
			cache = {};
		$tbody.empty();
		if (usePrev && prevData) {
			for (var i=0; i<prevData.length; i++) {
				var rowData = prevData[i],
					$tr = createTr(rowData, EVENT_COLUMNS, i+11);
				cache[rowData.userId] = $tr;
				$tbody.append($tr);
			}
		}
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = cache[rowData.userId];
			if ($tr) {
				buildRank($tr.find(".r-rank"), i + 1, rowData.correctCount);
				$tr.find(".r-correct").text(rowData.correctCount);
				$tr.find(".r-time").text(roundTime(rowData.time));
			} else {
				$tr = createTr(rowData, EVENT_COLUMNS, i+1);
				$tbody.append($tr);
			}
			$tr.addClass("new");
		}
		if (usePrev) {
			setTimeout(function() {
				$table.tableSort({
					"sortBy" : ["numeric", "nosort", "nosort", "nosort"]
				});
				$table.find("thead th:first").click();
				setTimeout(function() {
					var $oldRows = $tbody.find("tr").not(".new");
					$oldRows.hide("slow", function() {
						$oldRows.remove();
					});
				}, 200);
			}, 200);
			prevData = data;
			nextData = null;
		}
	}
	function buildWinners(data) {
		var $tbody = $("#ranking-event-tbl").find("tbody");
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = null;
			if (rowData.eventId == context.eventId) {
				continue;
			}
			$tr = createTr(rowData, WINNER_COLUMNS);
			$tr.attr("data-eventId", rowData.eventId);
			$tr.click(showEventRanking);
			$tbody.append($tr);
		}
	}
	function buildTotal(data) {
		var $tbody = $("#ranking-total-tbl").find("tbody");
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = createTr(rowData, TOTAL_COLUMNS, i+1);
			$tr.attr("data-userId", rowData.userId);
			$tr.attr("data-point", rowData.point);
			$tr.click(showUserEvent);
			$tbody.append($tr);
		}
	}
	function buildUserEvent(data) {
		function getEventTitle(eventId) {
			for (var i=0; i<$events.length; i++) {
				var $tr = $($events[i]);
				if ($tr.attr("data-eventId") == eventId) {
					return $tr.find(".r-title").text();
				}
			}
			return "Unknown";
		}
		var $tbody = $("#ranking-user-tbl").find("tbody"),
			$events = $("#ranking-event-tbl").find("tbody tr");
		$tbody.empty();
		for (var i=0; i<data.length; i++) {
			var rowData = data[i],
				$tr = null,
				rank = rowData.point > 0 ? 10 - rowData.point + 1 : "-";
			if (rowData.eventId == context.eventId) {
				continue;
			}
			rowData.title = getEventTitle(rowData.eventId);
			$tr = createTr(rowData, USER_COLUMNS, rank);
			$tbody.append($tr);
		}
	}
	function init($el) {
		$tableNow = $("#ranking-now-tbl");
		if (context.isEventRunning()) {
			con.request({
				"command" : "getEventRanking",
				"data" : {
					"eventId" : context.eventId,
					"limit" : 10
				},
				"success" : function(data) {
					if (data.length) {
						nextData = data;
					}
				}
			})
		} else {
			$(".ranking-now").hide();
		}
		con.request({
			"command" : "getEventWinners",
			"data" : {
				"roomId" : context.roomId,
				"limit" : 10
			},
			"success" : buildWinners
		});
		con.request({
			"command" : "getTotalRanking",
			"data" : {
				"roomId" : context.roomId,
				"limit" : 10
			},
			"success" : buildTotal
		})
		$("#ranking-event-detail-back").click(function() {
			$tab.find(".tab-pane").hide();
			$("#ranking-event").show("slide", { "direction" : "left"}, EFFECT_TIME);
		});
		$("#ranking-user-back").click(function() {
			$tab.find(".tab-pane").hide();
			$("#ranking-total").show("slide", { "direction" : "left"}, EFFECT_TIME);
		});
		backButtonControl($("#ranking-event-detail"));
		backButtonControl($("#ranking-user"));
		$tab = $("#ranking-tab").tabs({
			"active" : context.isEventRunning() ? 0 : 1,
			"beforeActivate" : function() {
				$tab.find(".tab-pane").hide();
			}
		}).show();
	}
	function afterShow() {
		if (nextData) {
			buildRanking($tableNow, nextData, true);
		}
	}
	function clear() {
		$tab = null;
		$tableNow = null;
	}
	var prevData = null,
		nextData = null,
		$tab = null,
		$tableNow = null;
	$.extend(this, {
		"init" : init,
		"afterShow" : afterShow,
		"clear" : clear
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
		var $el = $(".publish-q-animation");
		$el.css({
			"animation-name" : "inout",
			"-webkit-animation-name" : "inout"
		});
		$el.hide();
		setTimeout(function() {
			$el.show();
		}, 0);
	});
	$.extend(this, {
		"log" : log
	})
}

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

});