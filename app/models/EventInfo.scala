package models

import play.api.libs.json._
import models.entities.QuizEvent
import org.joda.time.{DateTime}

object EventStatus {
  case object Prepared extends EventStatus(0)
  case object Running extends EventStatus(1)
  case object End extends EventStatus(2)

  val values = Array(Prepared, Running, End)

  def fromCode(code: Short) = values.filter(_.code == code).head

  implicit object format extends Format[EventStatus] {
    def reads(json: JsValue) = JsSuccess(fromCode(json.as[Short]))
    def writes(s: EventStatus): JsValue = JsNumber(s.code)
  }
}

sealed abstract class EventStatus(val code: Short) {
  val name = toString
}

case class EventInfo(
  id: Int, 
  roomId: Int, 
  title: Option[String] = None, 
  status: EventStatus, 
  execDate: Option[DateTime] = None, 
  endDate: Option[DateTime] = None, 
  capacity: Int, 
  passcode: Option[String] = None, 
  description: Option[String] = None
) {

  def withoutPasscode = copy(passcode=None)

  def toJson = {
    Json.toJson(this)(EventInfo.format)
  }

  override def toString = toJson.toString
}

object EventInfo {
  implicit val format = Json.format[EventInfo]

  def create(event: QuizEvent) = EventInfo(
    id=event.id,
    roomId=event.roomId,
    title=event.title,
    status=EventStatus.fromCode(event.status),
    execDate=event.execDate,
    endDate=event.endDate,
    capacity=event.capacity,
    passcode=event.passcode,
    description=event.description
  )

  def fromJson(json: JsValue): EventInfo = Json.fromJson[EventInfo](json).get
  def fromJson(str: String): EventInfo = fromJson(Json.parse(str))
}

