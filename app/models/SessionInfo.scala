package models

import play.api.libs.json.Json
import twitter4j.auth.AccessToken
import models.entities.User

case class SessionInfo(id: String, user: Option[UserInfo], room: Option[RoomInfo], twitterToken: Option[String], twitterSecret: Option[String]) {

  def login(user: User, accessToken: AccessToken = null) = {
    SessionInfo.create(id, Some(UserInfo.create(user)), room, Option(accessToken))
  }
  def toJson = {
    Json.toJson(this)(SessionInfo.format).toString
  } 
}

object SessionInfo {
  implicit val format = Json.format[SessionInfo]

  def create(id: String, user: Option[UserInfo] = None, room: Option[RoomInfo] = None, accessToken: Option[AccessToken] = None): SessionInfo = {
    val twitterToken = accessToken.map(_.getToken)
    val twitterSecret = accessToken.map(_.getTokenSecret)
    SessionInfo(id, user, room, twitterToken, twitterSecret)
  }

  def fromJson(str: String) = Json.fromJson[SessionInfo](Json.parse(str)).get
}