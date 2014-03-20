package models

import play.api.libs.json._
import models.entities.QuizUserEvent

case class UserEventInfo(
  id: Int, 
  userId: Int, 
  eventId: Int, 
  roomId: Int, 
  correctCount: Int, 
  wrongCount: Int, 
  time: Long, 
  point: Int
) {

  def toJson = {
    Json.toJson(this)(UserEventInfo.format)
  }

  override def toString = toJson.toString
}

object UserEventInfo {
  implicit val format = Json.format[UserEventInfo]

  def create(event: QuizUserEvent) = UserEventInfo(
    id=event.id,
    userId=event.userId,
    eventId=event.eventId,
    roomId=event.roomId,
    correctCount=event.correctCount,
    wrongCount=event.wrongCount,
    time=event.time,
    point=event.point
  )

  def fromJson(json: JsValue): UserEventInfo = Json.fromJson[UserEventInfo](json).get
  def fromJson(str: String): UserEventInfo = fromJson(Json.parse(str))
}

