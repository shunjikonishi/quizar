package models

import play.api.libs.json.Json
import twitter4j.auth.AccessToken
import models.entities.QuizUser

case class TokenInfo(token: String, secret: String) {
  def this(t: AccessToken) = this(t.getToken, t.getTokenSecret)
}

case class SessionInfo(id: String, lang: String, user: Option[UserInfo] = None, 
    roomId: Option[Int] = None, twitterInfo: Option[TokenInfo] = None) {

  def login(user: QuizUser, accessToken: AccessToken = null) = {
    copy(user=Some(UserInfo.create(user)), twitterInfo=Option(accessToken).map(new TokenInfo(_)))
  }
  def toJson = {
    Json.toJson(this)(SessionInfo.format)
  } 

  override def toString = toJson.toString
}

object SessionInfo {
  implicit val tokenFormat = Json.format[TokenInfo]
  implicit val format = Json.format[SessionInfo]

  def fromJson(str: String) = Json.fromJson[SessionInfo](Json.parse(str)).get
}