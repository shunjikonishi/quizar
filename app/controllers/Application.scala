package controllers

import play.api.mvc.Controller
import play.api.mvc.Action
import play.api.i18n.Messages

import models.TwitterManager
import models.UserManager
import models.SessionManager
import models.SessionInfo

import java.util.UUID

object Application extends Controller {

  def index = Action { implicit request =>
    val sm = SessionManager
    val title = Messages("application.title")
    val sessionId = session.get("sessionId")
    val sessionInfo = sessionId.flatMap { sessionId =>
      val sm = SessionManager
      sm.getSessionInfo(sessionId)
    }
    Ok(views.html.index(title, sessionInfo.map(_.user), "{}")).withSession(
      "sessionId" -> sessionId.getOrElse(UUID.randomUUID().toString())
    )
  }
  
  def signinTwitter(oauth_token: String, oauth_verifier: String) = Action { implicit request =>
    session.get("sessionId").map { sessionId =>
      val tm = TwitterManager
      val um = UserManager
      val sm = SessionManager

      val twitter = tm.authorization(oauth_token, oauth_verifier)
      val user = um.getUserByTwitter(twitter.verifyCredentials)
      sm.setSessionInfo(sessionId, SessionInfo.create(user, twitter.getOAuthAccessToken))
      Redirect("/")
    }.getOrElse(BadRequest)
  }

  def signout = Action { implicit request =>
      val sm = SessionManager
      session.get("sessionId").foreach(sm.removeSessionInfo(_))
      Redirect("/")
  }

}