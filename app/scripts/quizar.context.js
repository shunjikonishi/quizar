function Context(hash) {
	var self = this;
	function isLogined() { return !!self.userId;}
	function isEntryEvent() { return !!self.userEventId;}
	function isEventRunning() { return self.eventStatus == EventStatus.Running;}
	function isInRoom() { return !!self.roomId;}
	function isRoomAdmin() { return !!self.roomAdmin;}
	function isPostQuestionAllowed() { return !!self.userQuiz;}
	function isDebug() { return !!self.debug;}
	function openEvent(eventId) {
		self.eventId = eventId;
		self.eventStatus = EventStatus.Running;
	}
	function closeEvent() {
		self.eventId = 0;
		self.eventStatus = EventStatus.Prepared;
		self.userEventId = 0;
	}
	function entryEvent(userEventId) {
		self.userEventId = userEventId;
	}
	function canEntryEvent() {
		return isLogined() && isInRoom() && !isRoomAdmin();
	}

	$.extend(this, hash, {
		"isLogined" : isLogined,
		"isEntryEvent" : isEntryEvent,
		"isEventRunning" : isEventRunning,
		"isInRoom" : isInRoom,
		"isRoomAdmin" : isRoomAdmin,
		"isPostQuestionAllowed" : isPostQuestionAllowed,
		"isDebug" : isDebug,
		"openEvent" : openEvent,
		"closeEvent" : closeEvent,
		"entryEvent" : entryEvent,
		"canEntryEvent" : canEntryEvent
	})
}
