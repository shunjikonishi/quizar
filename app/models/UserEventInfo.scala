package models

import play.api.libs.json._
import models.entities.QuizUserEvent
import org.joda.time.{DateTime}

case class UserEventInfo(
  id: Int, 
  userId: Int, 
  eventId: Int, 
  roomId: Int, 
  title: Option[String],
  execDate: Option[DateTime],
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

  def fromJson(json: JsValue): UserEventInfo = Json.fromJson[UserEventInfo](json).get
  def fromJson(str: String): UserEventInfo = fromJson(Json.parse(str))
}

