package models

import play.api.i18n.Lang
import play.api.templates.Html

import flect.websocket.Command
import flect.websocket.CommandHandler

class TemplateManager(session: SessionInfo) extends CommandHandler {

  implicit val lang = Lang(session.lang)

  def getTemplate(name: String): Html = {
    name match {
      case "home" => 
        val twitterUrl = session.user.map(_ => "#").getOrElse(TwitterManager.authorizationUrl)
        views.html.index(session, twitterUrl)
      case "make-room" => views.html.makeRoom(session)
      case "edit-event" => views.html.event(session)
      case "edit-question" => views.html.question(session)
      case "make-question" => views.html.makeQuestion(session)
      case "publish-question" => views.html.publishQuestion(session)
      case "passcode" => views.html.passcode(session)
      case "ranking" => views.html.ranking(session)
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