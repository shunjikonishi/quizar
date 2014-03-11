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
			var template = storage.getItem("template." + params.name);
			if (!template) {
				loadTemplate(params.name, function(data) {
					storage.setItem("template." + params.name, data);
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
				var dir = params.direction || "right";
				$el.show("slide", { "direction" : dir}, EFFECT_TIME, function() {
					if (params.afterShow) {
						params.afterShow($el);
					}
				});
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