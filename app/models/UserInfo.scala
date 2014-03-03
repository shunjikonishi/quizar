package models

import play.api.libs.json.Json
import twitter4j.auth.AccessToken
import models.entities.User

case class UserInfo(id: Int, name: String, imageUrl: String) {
  def toJson = {
    Json.toJson(this)(UserInfo.format).toString
  } 
}
case class SessionInfo(user: UserInfo, twitterToken: Option[String], twitterSecret: Option[String]) {
  def toJson = {
    Json.toJson(this)(SessionInfo.format).toString
  } 
}

object UserInfo {
  implicit val format = Json.format[UserInfo]

  def create(user: User) = UserInfo(
    user.id,
    user.name,
    user.imageUrl
  )

  def fromJson(str: String) = Json.fromJson[UserInfo](Json.parse(str)).get
}

object SessionInfo {
  implicit val format = Json.format[SessionInfo]

  def create(user: User, accessToken: AccessToken = null): SessionInfo = {
    val (twitterToken, twitterSecret) = Option(accessToken) match {
      case Some(x) => (Some(x.getToken), Some(x.getTokenSecret))
      case None => (None, None)
    }
    SessionInfo(UserInfo.create(user), twitterToken, twitterSecret)
  }

  def fromJson(str: String) = Json.fromJson[SessionInfo](Json.parse(str)).get
}