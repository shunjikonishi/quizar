package models

import play.api.libs.json._
import flect.websocket.CommandInvoker
import flect.websocket.CommandResponse

class QuizRoomEngine(session: SessionInfo) extends CommandInvoker {

  init()

  private def init() = {
    addHandler("template", TemplateManager(session))
    addHandler("noop") { c => None}
    addHandler("makeRoom", RoomManager.createCommand)
    addHandler("updateRoom", RoomManager.updateCommand)
    addHandler("getRoom", RoomManager.getCommand)
    addHandler("tweet") { c =>
      val userId = (c.data \ "userId").as[Int]
      val msg = (c.data \ "msg").as[String]
      val twitter = (c.data \ "twitter").as[Boolean]
      val img = session.user.map(_.imageUrl).getOrElse("#")
      Some(new CommandResponse("chat", "json", JsObject(Seq(
          ("msg", JsString(msg)),
          ("img", JsString(img))
        )
      )))
    }
  }
}