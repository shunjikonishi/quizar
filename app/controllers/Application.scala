package controllers

import play.api.mvc.Controller
import play.api.mvc.Action
import play.api.mvc.RequestHeader
import play.api.mvc.WebSocket
import play.api.i18n.Messages

import models.TwitterManager
import models.UserManager
import models.SessionManager
import models.SessionInfo
import models.RoomManager
import flect.websocket.CommandHandler

import java.util.UUID

object Application extends Controller {

  private def createParams(implicit request: RequestHeader) = {
    val wsUri = routes.Application.ws().webSocketURL()
    s"""{
      "uri" : "${wsUri}"
    }"""
  }

  def index = Action { implicit request =>
    val sm = SessionManager
    val sessionId = session.get("sessionId").getOrElse(UUID.randomUUID().toString())
    val sessionInfo = sm.get(sessionId).copy(room=None)
    sm.set(sessionId, sessionInfo)

    Ok(views.html.index(sessionInfo, createParams(request))).withSession(
      "sessionId" -> sessionId
    )
  }

  def room(id: Int) = Action { implicit request =>
    RoomManager.getRoomInfo(id).map { room =>
      val sm = SessionManager
      val sessionId = session.get("sessionId").getOrElse(UUID.randomUUID().toString())
      val sessionInfo = sm.get(sessionId).copy(room=Some(room))
      sm.set(sessionId, sessionInfo)
      Ok(views.html.index(sessionInfo, createParams(request))).withSession(
        "sessionId" -> sessionId
      )
    }.getOrElse(NotFound)
  }
  
  def ws = WebSocket.using[String] { implicit request =>
    //ToDo check origin
    val handler = new CommandHandler()
    val sessionId = session.get("sessionId").foreach { s =>
      handler.addHandler("echo") { command =>
        command.text(command.data.as[String] + " " + new java.util.Date().toString)
      }
    }
    (handler.in, handler.out)
  }

  def signinTwitter(oauth_token: String, oauth_verifier: String) = Action { implicit request =>
    session.get("sessionId").map { sessionId =>
      val tm = TwitterManager
      val um = UserManager
      val sm = SessionManager

      val twitter = tm.authorization(oauth_token, oauth_verifier)
      val user = um.getUserByTwitter(twitter.verifyCredentials)
      val sessionInfo = sm.get(sessionId).login(user, twitter.getOAuthAccessToken)
      sm.set(sessionId, sessionInfo)

      val path = sessionInfo.room.map("/room/" + _.id).getOrElse("/")
      Redirect(path)
    }.getOrElse(BadRequest)
  }


  def signout = Action { implicit request =>
      val sm = SessionManager
      session.get("sessionId").foreach(sm.remove(_))
      Redirect("/")
  }

}