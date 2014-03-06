package controllers

import play.api.Play
import play.api.Play.current
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
import models.QuizRoomEngine
import models.TemplateManager
import flect.websocket.CommandInvoker

import java.util.UUID

object Application extends Controller {

  private def createParams(request: RequestHeader, sessionInfo: SessionInfo) = {
    val wsUri = routes.Application.ws().webSocketURL()(request)
    val debug = request.getQueryString("debug").map(_ == "true").getOrElse(false)
    val (userId, username) = sessionInfo.user.map(u => (u.id, u.name)).getOrElse((0, ""))
    val roomId = sessionInfo.roomId.getOrElse(0)
    val userEventId = sessionInfo.userEventId.getOrElse(0)

    s"""{
      "devMode" : ${Play.isDev},
      "debug" : ${debug},
      "userId" : ${userId},
      "username" : "${username}",
      "roomId" : ${roomId},
      "userEventId" : ${userEventId},
      "uri" : "${wsUri}"
    }"""
  }

  def index() = Action { implicit request =>
    val sm = SessionManager
    val sessionId = session.get("sessionId").getOrElse(UUID.randomUUID().toString())
    val sessionInfo = sm.get(sessionId).copy(roomId=None, userEventId=None)
    val tm = TemplateManager(sessionInfo)
    sm.set(sessionId, sessionInfo)

    Ok(views.html.frame(sessionInfo.user, None, createParams(request, sessionInfo))(tm.getTemplate("home"))).withSession(
      "sessionId" -> sessionId
    )
  }

  def room(id: Int) = Action { implicit request =>
    RoomManager.getRoomInfo(id).map { room =>
      val sm = SessionManager
      val sessionId = session.get("sessionId").getOrElse(UUID.randomUUID().toString())
      //ToDo userEventId
      val sessionInfo = sm.get(sessionId).copy(roomId=Some(room.id))
      val tm = TemplateManager(sessionInfo)
      sm.set(sessionId, sessionInfo)
      Ok(views.html.frame(sessionInfo.user, Some(room), createParams(request, sessionInfo))(tm.getTemplate("home"))).withSession(
        "sessionId" -> sessionId
      )
    }.getOrElse(NotFound)
  }
  
  def ws = WebSocket.using[String] { implicit request =>
    //ToDo check origin
    val sm = SessionManager
    val handler = session.get("sessionId").map { sessionId =>
      new QuizRoomEngine(sm.get(sessionId))
    }.getOrElse(new CommandInvoker())
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

      val path = sessionInfo.roomId.map("/room/" + _).getOrElse("/")
      Redirect(path)
    }.getOrElse(BadRequest)
  }


  def signout = Action { implicit request =>
      val sm = SessionManager
      session.get("sessionId").foreach(sm.remove(_))
      Redirect("/")
  }

}