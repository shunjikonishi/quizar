function Chat($el, userId, hashtag, con) {
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
		return $el.is(":hidden") && $("#chat-notify").is(":checked");
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
			$tbody.find("tr:last").remove();
		}
		var clazz = cnt % 2 == 0 ? "chat-left" : "chat-right",
			$tr = $("<tr style='display:none;'>" +
				"<td class='chat-img'></td>" +
				"<td class='chat-msg'></td>" +
				"<td class='chat-img'></td></tr>"),
			$img = $("<img/>"),
			$tdMsg = $tr.find("td.chat-msg");

		$tdMsg.addClass(clazz);
		$tdMsg.html(data.username + "<br>" + data.msg);
		$img.attr("src", data.img);
		if (clazz == "chat-left") {
			$tr.find("td.chat-img:first").append($img);
		} else {
			$tr.find("td.chat-img:last").append($img);
		}
		$tbody.prepend($tr)
		$tr.show("slow");
		cnt++;
	}
	var cnt = 0,
		$text = $("#chat-text"),
		$twitter = $("#chat-twitter"),
		$len = $("#chat-text-len"),
		$tbody = $el.find("table tbody"),
		$member = $("#room-member");
	if (userId) {
		$("#btn-tweet").click(function() {
			var msg = $text.val(),
				withTwitter = $twitter.is(":checked");
			if (msg.length == 0 || msg.length > 140) {
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
	$.extend(this, {
		"member" : member,
		"append" : append,
		"tweet" : tweet,
		"isNotifyTweet" : isNotifyTweet
	})
}
