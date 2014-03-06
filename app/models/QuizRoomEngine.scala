package models

import flect.websocket.CommandInvoker

class QuizRoomEngine(session: SessionInfo) extends CommandInvoker {

  init()

  private def init() = {
    addHandler("template", TemplateManager(session))
    addHandler("noop") { c => None}
    addHandler("makeRoom", RoomManager.createCommand)
  }
}