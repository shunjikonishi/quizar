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
			$ul.find("li:last").remove();
		}
		var clazz = (data.userId == userId ? "align-left" : "align-right"),
			$li = $("<li style='display:none;'>" +
				"<div class='contributor'><img/><span/></div>" +
				"<div class='balloon'><div class='balloon-border'>" +
					"<p class='text'></p>" +
				"</div></div></li>"),
			$img = $li.find("img"),
			$username = $li.find(".contributor span"),
			$msg = $li.find(".text");

		$li.addClass(clazz);
		$username.text(data.username);
		$img.attr("src", data.img);
		$msg.text(data.msg);
		$ul.prepend($li)
		$li.show("slow");
		cnt++;
	}
	var cnt = 0,
		$text = $("#chat-text"),
		$twitter = $("#chat-twitter"),
		$len = $("#chat-text-len"),
		$ul = $el.find(".tweet-box ul"),
		$member = $("#room-member");
	if (userId) {
		$("#btn-tweet").click(function() {
			var msg = $text.val(),
				withTwitter = $twitter.is(":checked");
			if (msg.length == 0 || msg.length > 140 || msg == hashtag) {
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
