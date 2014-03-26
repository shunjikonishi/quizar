function PushState(app, context) {
	var ROOM_PREFIX = "/room/" + context.roomId,
		MAX_FUNCS = 20;
	function purgeFuncs() {
		var cnt = 0, min = Number.MAX_VALUE;
		for (var key in funcs) {
			if (min > key) {
				min = key;
			}
console.log("purge: " + min);
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
console.log("popState1: " + JSON.stringify(obj) + JSON.stringify(currentState));
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