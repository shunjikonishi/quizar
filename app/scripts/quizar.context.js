function Context(hash) {
	var self = this;
	function isLogined() { return !!self.userId;}
	function isEntryEvent() { return !!self.userEventId;}
	function isEventRunning() { return self.eventStatus == EventStatus.Running;}
	function isEventAdmin() { return !!self.eventAdmin;}
	function isInRoom() { return !!self.roomId;}
	function isRoomAdmin() { return !!self.roomAdmin;}
	function isPostQuestionAllowed() { return !!self.userQuiz;}
	function isDebug() { return !!self.debug;}
	function openEvent(eventId, admin, answerTime) {
		self.eventId = eventId;
		self.eventStatus = EventStatus.Running;
		self.eventAdmin = admin;
		self.answerTime = answerTime;
	}
	function closeEvent() {
		self.eventId = 0;
		self.eventStatus = EventStatus.Prepared;
		self.userEventId = 0;
		self.eventAdmin = false;
	}
	function entryEvent(userEventId) {
		self.userEventId = userEventId;
	}
	function canEntryEvent() {
		return isLogined() && isInRoom() && !isRoomAdmin();
	}
	function setNotifyTweet(value) {
		this.notifyTweet = value;
		$.cookie("notifyTweet", value ? 1 : 0, {
			"path" : "/",
			"expires" : 100
		});
	}

	$.extend(this, hash, {
		"isLogined" : isLogined,
		"isEntryEvent" : isEntryEvent,
		"isEventRunning" : isEventRunning,
		"isEventAdmin" : isEventAdmin,
		"isInRoom" : isInRoom,
		"isRoomAdmin" : isRoomAdmin,
		"isPostQuestionAllowed" : isPostQuestionAllowed,
		"isDebug" : isDebug,
		"openEvent" : openEvent,
		"closeEvent" : closeEvent,
		"entryEvent" : entryEvent,
		"canEntryEvent" : canEntryEvent,
		"setNotifyTweet" : setNotifyTweet
	});
	if (!this.eventStatus) {
		this.eventStatus = EventStatus.Prepared;
	}
	this.notifyTweet = $.cookie("notifyTweet") == 1;
	setNotifyTweet(this.notifyTweet);
}
