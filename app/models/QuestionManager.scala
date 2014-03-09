package models

import play.api.libs.json._
import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.DateTime

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

  def toJsObject = {
    Json.toJson(this)(QuestionInfo.format)
  }

  def toJson = {
    Json.toJson(this)(QuestionInfo.format).toString
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

class QuestionManager(roomId: Int) {

  private val qq = QuizQuestion.qq
  implicit val autoSession = AutoSession
  
  def countAndPublished: (Int, Int) = {
    withSQL {
      select(sqls"""
        count(*),
        SUM(
          CASE WHEN PUBLISH_COUNT = 0 THEN 0,
          ELSE 1 END
        )""").from(QuizQuestion as qq)
    }.map(rs => (rs.int(1), rs.int(2))).single.apply().get
  }

  def list(published: Boolean, offset: Int, limit: Int): List[QuestionInfo] = {
    withSQL { 
      val cond = published match {
        case true => SQLSyntax.eq(qq.publishCount, 0)
        case false => SQLSyntax.ne(qq.publishCount, 0)
      }
      select
        .from(QuizQuestion as qq)
        .where.eq(qq.roomId, roomId)
        .and.append(cond)
        .orderBy(qq.id).desc.limit(limit).offset(offset)
    }.map(rs => QuizQuestion(qq.resultName)(rs)).list.apply.map(QuestionInfo.create(_))
  }

  def create(q: QuestionInfo): QuestionInfo = {
    val now = new DateTime()
    val entity = QuizQuestion.create(
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
      wrongCount=q.wrongCount,
      created=now,
      updated=now
    )
    QuestionInfo.create(entity)
  }

  def update(q: QuestionInfo): Boolean = {
    val now = new DateTime()
    QuizQuestion.find(q.id).map { entity =>
      entity.copy(
        question=q.question,
        answers=q.answers,
        answerType=q.answerType,
        tags=q.tags,
        description=q.description,
        relatedUrl=q.relatedUrl,
        updated=now
      ).save();
      true;
    }.getOrElse(false)

  }

  def publish(id: Int) = {

  }

  def updateAnswers(id: Int, correct: Int, wrong: Int) = {

  }
  
}
