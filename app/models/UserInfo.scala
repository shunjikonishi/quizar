package models

import play.api.libs.json.Json
import models.entities.User

case class UserInfo(id: Int, name: String, imageUrl: String) {
  def toJson = {
    Json.toJson(this)(UserInfo.format)
  } 

  override def toString = toJson.toString
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

