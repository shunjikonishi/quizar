if (typeof(flect) === "undefined") flect = {};

$(function() {
	function endsWith(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}
	/**
	 * settings
	 * - onOpen(event)
	 * - onMessage(event, startTime)
	 * - onClose(event)
	 */
	flect.connection = function(wsUri, settings) {
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
			if (ajaxPrefix) {
				ajaxRequest(params)
			} else {
				websocketRequest(params)
			}
			return self;
		}
		function ajaxRequest(params) {
			if (!params.url) {
				var url = ajaxPrefix;
				if (params.command) {
					if (!endsWith(url, "/")) {
						url += "/";
					}
					url += params.command;
					delete params.command;
				}
			}
			if (!params.type) {
				params.type = "POST";
			}
			$.ajax(params);
		}
		//command, data, success
		function webSocketRequest(params) {
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
			if (params.subCommand) {
				msg.subCommand = params.subCommand;
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
			if (settings.onOpen) {
				settings.onOpen(event);
			}
		}
		function onMessage(event) {
			var data = JSON.parse(event.data),
				startTime = times[data.id];
			if (startTime) {
				delete times[data.id];
			}
			if (settings.onMessage) {
				settings.onMessage(event, startTime);
			}
			if (data.id && listeners[data.id]) {
				listeners[data.id](data.data);
				delete listeners[data.id];
			} else if (data.command && listeners[data.command]) {
				listeners[data.command](data.data);
			}
		}
		function onClose(event) {
			if (settings.onClose) {
				settings.onClose(event);
			}
		}
		function polling(interval, params) {
			return setInterval(function() {
				request(params);
			}, interval);
		}
		var self = this,
			requestId = 0,
			times = {},
			listeners = {},
			ajaxPrefix = null,
			socket = new WebSocket(wsUri);
		if (!settings) {
			settings = {};
		}

		socket.onopen = onOpen;
		socket.onmessage = onMessage;
		socket.onclose = onClose;

		$.extend(this, {
			"useAjax" : useAjax,
			"request" : request,
			"addEventListener" : addEventListener,
			"removeEventListener" : removeEventListener,
			"polling" : polling
		})
	}
});