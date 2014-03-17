var SUPPORTS_TOUCH = 'ontouchstart' in window,
	EFFECT_TIME = 300,
	DEFAULT_IMAGE = "/assets/images/twitter_default_profile.png",
	AnswerType = {
		"FirstRow" : 0,
		"Most" : 1,
		"Least" : 2,
		"NoAnswer" : 3
	},
	EventStatus = {
		"Prepared" : 0,
		"Running" : 1,
		"Finished" : 2
	};
