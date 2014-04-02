function Chat($el, context, con) {
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
		return $el.is(":hidden") && context.notifyTweet;
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
			$ul.find("li:first").remove();
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
		$ul.append($li)
		$li.show("slow", function() {
			$tweetBox.scrollTop($tweetBox[0].scrollHeight - $tweetBox.height());
		});
		cnt++;
		$len.text(cnt);
	}
	function calcHeight() {
		var wh = $(window).height(),
			h = 0
		$el.children("div").each(function() {
			var $div = $(this),
				dh = $div.outerHeight();
			if (!$div.hasClass("tweet-box")) {
				if (dh > 0) {
					h += dh;
				}
			}
		});
		h += $("#toolbar").outerHeight();
		h += $("#tabbar").outerHeight();
		$tweetBox.css("height", wh - h - 24);
	}
	var cnt = 0,
		userId = context.userId,
		hashtag = context.hashtag,
		$text = $("#chat-text"),
		$twitter = $("#chat-twitter"),
		$len = $("#chat-text-len span"),
		$tweetBox = $el.find(".tweet-box"),
		$ul = $tweetBox.find("ul"),
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
	$text.keyup();
	$.extend(this, {
		"member" : member,
		"append" : append,
		"tweet" : tweet,
		"isNotifyTweet" : isNotifyTweet,
		"calcHeight" : calcHeight
	})
}
