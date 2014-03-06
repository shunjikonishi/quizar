package models

import play.api.libs.json.Json
import play.api.libs.json.JsValue
import models.entities.QuizRoom

case class RoomInfo(
    id: Int, 
    name: String,
    tags: Option[String], 
    hashtag: Option[String],
    userQuiz: Boolean, 
    description: Option[String], 
    owner: Int,
    adminUsers: Option[String]
  ) {

  def isAdmin(user: UserInfo) = {
    user.id == owner || adminUserList.exists(_ == user.id)
  }

  def adminUserList: List[Int] = {
    val list = adminUsers.map(_.split(",").toList).getOrElse(Nil)
    list.map(_.toInt)
  }

  def toJsObject = {
    Json.toJson(this)(RoomInfo.format)
  }

  def toJson = {
    Json.toJson(this)(RoomInfo.format).toString
  } 
}

object RoomInfo {
  implicit val format = Json.format[RoomInfo]

  def create(room: QuizRoom) = RoomInfo(
    id = room.id,
    name = room.name,
    tags = room.tags,
    hashtag = room.hashtag,
    userQuiz = room.userQuiz,
    description = room.description,
    owner = room.owner,
    adminUsers = room.adminUsers
  )

  def fromJson(json: JsValue) = Json.fromJson[RoomInfo](json).get
  def fromJson(str: String) = Json.fromJson[RoomInfo](Json.parse(str)).get
}

case class EventInfo(id: Int, name: String)

object EventInfo {
  implicit val format = Json.format[EventInfo]
}

