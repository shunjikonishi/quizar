package models

import play.api.libs.json._
import models.entities.QuizQuestion

case class QuestionInfo(
  id: Int, 
  roomId: Int, 
  createdBy: Int, 
  question: String, 
  answers: String, 
  answerType: Int, 
  tags: Option[String] = None, 
  description: Option[String] = None, 
  relatedUrl: Option[String] = None,
  publishCount: Int, 
  correctCount: Int, 
  wrongCount: Int) {

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
    answerType=q.answerType,
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
