if (typeof(flect) === "undefined") flect = {};

$(function() {
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
				"log" : "name=" + name,
				"data" : {
					"name" : name
				},
				"success" : success
			})
		}
		function showTemplate(template, params) {
			$el.empty().hide();
			$el.html(template);
			if (params.before) {
				params.before($el);
			}
			var dir = params.direction || "right";
			$el.show("slide", { "direction" : dir}, 750, function() {
				if (params.after) {
					params.after($el);
				}
			});
		}
		var storage = window.sessionStorage ? window.sessionStorage : new MemoryStorage();
		$.extend(this, {
			"show" : show,
			"loadTemplate" : loadTemplate
		});
	}
});