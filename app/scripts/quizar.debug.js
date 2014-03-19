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
