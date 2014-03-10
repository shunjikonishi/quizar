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
    adminUsers: Option[String],
    event: Option[EventInfo] = None
  ) {

  def isAdmin(userId: Int) = {
    userId == owner || adminUserList.exists(_ == userId)
  }

  def adminUserList: List[Int] = {
    val list = adminUsers.map(_.split(",").toList).getOrElse(Nil)
    list.map(_.toInt)
  }

  def withEvent(event: EventInfo) = copy(event=Some(event))

  def toJson = {
    Json.toJson(this)(RoomInfo.format)
  }

  override def toString = toJson.toString
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

