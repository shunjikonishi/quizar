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