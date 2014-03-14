package controllers

import play.api.mvc.Controller
import play.api.mvc.Action
import play.api.libs.json._
import models.SessionManager
import models.QuizRoomEngine
import flect.websocket.Command

object Ajax extends Controller {

  def command(name: String) = Action { implicit request =>
    val id = request.getQueryString("id").map(_.toLong).getOrElse(-1L)
    val log = request.getQueryString("log")
    val data = request.body.asFormUrlEncoded
      .flatMap(_.get("data").map(_.head))
      .map(Json.parse(_)).getOrElse(JsNull)

    val sm = SessionManager
    val command = Command(id, name, log, data)
    session.get("sessionId").map { sessionId =>
      val sessionInfo = sm.get(sessionId);
      val engine = new QuizRoomEngine(sessionInfo)
      val ret = engine.handle(command)
      ret.isNone match {
        case true => NoContent
        case false => Ok(ret.toJson)
      }
    }.getOrElse(BadRequest)
  }

}
