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
	 * - onError(msg)
	 */
	flect.Connection = function(wsUri, logger) {
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
					if (settings.onError) {
						settings.onError(data.data);
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
			opened = true;
			for (var i=0; i<readyFuncs.length; i++) {
				readyFuncs[i]();
			}
			readyFuncs = null;
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
				if (settings.onError) {
					settings.onError(data.data);
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
		}
		function polling(interval, params) {
			return setInterval(function() {
				request($.extend(true, {}, params));
			}, interval);
		}
		function ready(func) {
			if (opened) {
				func();
			} else {
				readyFuncs.push(func);
			}
		}
		function close() {
			if (opened) {
				socket.close();
				opened = false;
			}
		}
		var self = this,
			settings = {},
			requestId = 0,
			times = {},
			listeners = {},
			ajaxPrefix = null,
			readyFuncs = [],
			opened = false,
			socket = new WebSocket(wsUri)

		socket.onopen = onOpen;
		socket.onmessage = onMessage;
		socket.onclose = onClose;

		$.extend(this, {
			"useAjax" : useAjax,
			"request" : request,
			"addEventListener" : addEventListener,
			"removeEventListener" : removeEventListener,
			"polling" : polling,
			"ready" : ready,
			"close" : close,
			"onOpen" : function(func) { settings.onOpen = func; return this},
			"onClose" : function(func) { settings.onClose = func; return this},
			"onRequest" : function(func) { settings.onRequest = func; return this},
			"onMessage" : function(func) { settings.onMessage = func; return this},
			"onError" : function(func) { settings.onError = func; return this}
		})
	}
});