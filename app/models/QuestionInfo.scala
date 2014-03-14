package models

import play.api.libs.json._
import models.entities.QuizQuestion

object AnswerType {
  case object FirstRow extends AnswerType(0)
  case object Most extends AnswerType(1)
  case object Least extends AnswerType(2)
  case object NoAnswer extends AnswerType(3)

  val values = Array(FirstRow, Most, Least, NoAnswer)

  def fromCode(code: Short) = values.filter(_.code == code).head

  implicit object format extends Format[AnswerType] {
    def reads(json: JsValue) = JsSuccess(fromCode(json.as[Short]))
    def writes(s: AnswerType): JsValue = JsNumber(s.code)
  }
}

sealed abstract class AnswerType(val code: Short) {
  val name = toString
}

case class QuestionInfo(
  id: Int, 
  roomId: Int, 
  createdBy: Int, 
  question: String, 
  answers: String, 
  answerType: AnswerType, 
  tags: Option[String] = None, 
  description: Option[String] = None, 
  relatedUrl: Option[String] = None,
  publishCount: Int, 
  correctCount: Int, 
  wrongCount: Int) {

  def answerList = answers.split("\n").toList
  
  def toSimpleJson = {
    JsObject(Seq(
      "id" -> JsNumber(id),
      "createdBy" -> JsNumber(createdBy),
      "question" -> JsString(question),
      "correctCount" -> JsNumber(correctCount)
    )).toString
  }

  def toJson = {
    Json.toJson(this)(QuestionInfo.format)
  }

  override def toString = {
    toJson.toString
  } 
}

object QuestionInfo {
  implicit val format = Json.format[QuestionInfo]

  def create(q: QuizQuestion) = QuestionInfo(
    id=q.id,
    roomId=q.roomId,
    createdBy=q.createdBy,
    question=q.question,
    answers=q.answers,
    answerType=AnswerType.fromCode(q.answerType),
    tags=q.tags,
    description=q.description,
    relatedUrl=q.relatedUrl,
    publishCount=q.publishCount,
    correctCount=q.correctCount,
    wrongCount=q.wrongCount
  )

  def fromJson(json: JsValue): QuestionInfo = {
    json match {
      case x: JsObject =>
        val zero = JsObject(Seq(
          "publishCount" -> JsNumber(0),
          "correctCount" -> JsNumber(0),
          "wrongCount" -> JsNumber(0)
          ))
        Json.fromJson[QuestionInfo](zero ++ x).get
      case _ => throw new IllegalArgumentException()
    }
  }
  def fromJson(str: String): QuestionInfo = fromJson(Json.parse(str))
}
