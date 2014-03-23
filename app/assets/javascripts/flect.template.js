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