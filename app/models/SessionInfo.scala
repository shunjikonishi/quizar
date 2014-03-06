package models

import play.api.libs.json.Json
import twitter4j.auth.AccessToken
import models.entities.User

case class SessionInfo(id: String, lang: String, user: Option[UserInfo], 
    roomId: Option[Int], userEventId: Option[Int], 
    twitterToken: Option[String], twitterSecret: Option[String]) {

  def login(user: User, accessToken: AccessToken = null) = {
    SessionInfo.create(id, lang, Some(UserInfo.create(user)), roomId, userEventId, Option(accessToken))
  }
  def toJson = {
    Json.toJson(this)(SessionInfo.format).toString
  } 
}

object SessionInfo {
  implicit val format = Json.format[SessionInfo]

  def create(id: String, lang: String, user: Option[UserInfo] = None, 
      roomId: Option[Int] = None, userEventId: Option[Int] = None, 
      accessToken: Option[AccessToken] = None): SessionInfo = {
    val twitterToken = accessToken.map(_.getToken)
    val twitterSecret = accessToken.map(_.getTokenSecret)
    SessionInfo(id, lang, user, roomId, userEventId, twitterToken, twitterSecret)
  }

  def fromJson(str: String) = Json.fromJson[SessionInfo](Json.parse(str)).get
}