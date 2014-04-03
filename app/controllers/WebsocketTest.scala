package controllers

import play.api.mvc.Controller
import play.api.mvc.WebSocket
import play.api.mvc.Action
import models.TwitterManager
import models.UserManager
import models.SessionManager
import models.UserInfo
import models.TokenInfo
import models.QuizRoomEngine
import java.util.UUID

object WebsocketTest extends Controller {

  private lazy val user = {
    val at  = sys.env.get("TWITTER_ACCESS_TOKEN")
    val ats = sys.env.get("TWITTER_ACCESS_TOKEN_SECRET")
    (at, ats) match {
      case (Some(x), Some(y)) =>
        /*
        val twitter = TwitterManager.fromAccessToken(x, y)
        val user = UserInfo.create(UserManager.getUserByTwitter(twitter.verifyCredentials))
        */
        val user = UserInfo.create(models.entities.QuizUser.find(1).get)
        Some(user)
      case _ =>
        None
    }
  }

  def test(roomId: Int) = {
    user.map { user =>
      WebSocket.using[String] { implicit request =>
        val sessionId = session.get("sessionId").getOrElse(UUID.randomUUID().toString())
        val sessionInfo = SessionManager.get(sessionId).copy(
          user=Some(user),
          roomId=Some(roomId)
        )
        val handler = new QuizRoomEngine(sessionInfo)
        (handler.in, handler.out)
      }
    } getOrElse {
      Action { implicit request =>
        NotFound
      }
    }
  }
}