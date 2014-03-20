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
