package models

import play.api.libs.json._
import models.entities.QuizUserAnswer
import org.joda.time.{DateTime}

object AnswerStatus {
	case object Unknown extends AnswerStatus(0)
	case object Correct extends AnswerStatus(1)
	case object Wrong   extends AnswerStatus(2)

	val values = Array(Unknown, Correct, Wrong)

	def fromCode(code: Short) = values.filter(_.code == code).head

	implicit object format extends Format[AnswerStatus] {
    def reads(json: JsValue) = JsSuccess(fromCode(json.as[Short]))
    def writes(s: AnswerStatus): JsValue = JsNumber(s.code)
  }
}

sealed abstract class AnswerStatus(val code: Short) {
	val name = toString
}

case class AnswerInfo(
	id: Int,
	userId: Int, 
  publishId: Int, 
  eventId: Int, 
  userEventId: Int, 
  answer: Int, 
  status: AnswerStatus,
  time: Int
 ) {

 	def toJson = Json.toJson(this)(AnswerInfo.format)
 	override def toString = toJson.toString
}

object AnswerInfo {
	implicit val format = Json.format[AnswerInfo]

	def fromEntity(answer: QuizUserAnswer) = AnswerInfo(
		id=answer.id,
		userId=answer.userId, 
	  publishId=answer.publishId,
	  eventId=answer.eventId, 
	  userEventId=answer.userEventId, 
	  answer=answer.answer, 
	  status=AnswerStatus.fromCode(answer.status),
	  time=answer.time
	)

  def fromJson(json: JsValue): AnswerInfo = {
  	val zero = AnswerInfo(0, 0, 0, 0, 0, 0, AnswerStatus.Unknown, 0).toJson
  	(zero, json) match {
  		case (x: JsObject, y: JsObject) => Json.fromJson[AnswerInfo](x ++ y).get
  		case _ => throw new IllegalStateException()
  	}
  }

  def fromJson(str: String): AnswerInfo = fromJson(Json.parse(str))

}

