package models

import play.api.libs.json.Json
import models.entities.QuizRoom

case class RoomInfo(
    id: Int, 
    name: String,
    tags: Option[String], 
    hashTag: Option[String],
    userQuiz: Boolean, 
    description: Option[String], 
    owner: Int
  ) {

  def isAdmin(user: UserInfo) = user.id == owner

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
    hashTag = room.hashtag,
    userQuiz = room.userQuiz,
    description = room.description,
    owner = room.owner
  )

  def fromJson(str: String) = Json.fromJson[RoomInfo](Json.parse(str)).get
}

case class EventInfo(id: Int, name: String)

object EventInfo {
  implicit val format = Json.format[EventInfo]
}

