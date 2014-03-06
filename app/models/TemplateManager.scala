package models

import play.api.i18n.Lang
import play.api.templates.Html

import flect.websocket.Command
import flect.websocket.CommandHandler

class TemplateManager(session: SessionInfo) extends CommandHandler {

  implicit val lang = Lang(session.lang)

  def getTemplate(name: String): Html = {
    name match {
      case "home" => views.html.index(session)
      case "make-room" => views.html.makeRoom(session)
      case "event" => views.html.event(session)
      case "debug" => views.html.debug(session)
      case _ => Html("NotFound")
    }
  }

  def handle(command: Command) = {
    val name = (command.data \ "name").as[String]
    command.html(getTemplate(name).toString)
  }
}

object TemplateManager {

  def apply(session: SessionInfo) = new TemplateManager(session)
}