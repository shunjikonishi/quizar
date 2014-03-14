if (typeof(flect) === "undefined") flect = {};

$(function() {
	flect.MessageDialog = function($el) {
		function doShow(second) {
			second = second || 3;
			$el.css({
				"animation-name" : "fade",
				"-webkit-animation-name" : "fade",
				"animation-duration" : second + "s",
				"-webkit-animation-duration" : second + "s"
			});
			$el.show();
			setTimeout(function() {
				$el.hide();
				$el.css("animation-name", "");
				$el.css("-webkit-animation-name", "");
				shown = false;
				if (msgs.length > 0) {
					var temp = msgs;
					msgs = [];
					setTimeout(function() {
						show(temp);
					}, 10)
				} else if (tweets.length > 0) {
					var temp = tweets;
					tweets = [];
					setTimeout(function() {
						notifyTweet(temp);
					}, 10)
				}
			}, second * 1000);
		}
		function show(msg, second) {
			if (shown) {
				msgs.push(msg);
				return;
			}
			shown = true;
			if (!$.isArray(msg)) {
				msg = [msg];
			}
			$el.empty();
			for (var i=0; i<msg.length; i++) {
				var $span = $("<span class='message'></span>");
				$span.text(msg[i]);
				$el.append($span);
			}
			doShow(second);
		}
		function notifyTweet(data, second) {
			if (shown) {
				tweets.push(data);
				return;
			}
			shown = true;
			second = second || 3;
			if (!$.isArray(data)) {
				data = [data];
			}
			$el.empty();
			for (var i=0; i<data.length; i++) {
				var tweet = data[i],
					$div = $("<div class='tweet'><img/><p></p><p></p></div>");
				$div.find("img").attr("src", tweet.img);
				$div.find("p:first").text(tweet.username);
				$div.find("p:last").text(tweet.msg);
				$el.append($div);
			}
			doShow(second);
		}
		function notifyUserAction(user, msg) {
			notifyTweet({
				"userId" : user.id,
				"username" : user.name,
				"msg" : msg,
				"img" : user.imageUrl
			});
		}
		var shown = false,
			msgs = [],
			tweets = [];

		$.extend(this, {
			"show" : show,
			"notifyTweet" : notifyTweet,
			"notifyUserAction" : notifyUserAction
		})
	}
});