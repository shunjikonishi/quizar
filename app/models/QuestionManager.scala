package models

import play.api.libs.json._
import play.api.i18n.Messages;
import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import scala.util.Random
import org.joda.time.DateTime

import models.entities.QuizQuestion
import models.entities.QuizPublish
import models.entities.QuizUserAnswer
import flect.websocket.Command
import flect.websocket.CommandResponse
import flect.websocket.CommandHandler
import flect.websocket.CommandBroadcast

class QuestionManager(roomId: Int, broadcast: CommandBroadcast) {

  private val (qq, qp) = (QuizQuestion.qq, QuizPublish.qp)
  implicit val autoSession = AutoSession
  
  def countAndPublished: (Int, Int) = {
    withSQL {
      select(sqls"""
        count(*),
        COALESCE(
          SUM(
            CASE WHEN PUBLISH_COUNT = 0 THEN 0
            ELSE 1 END
          ), 0
        )""").from(QuizQuestion as qq).where.eq(qq.roomId, roomId)
    }.map(rs => (rs.int(1), rs.int(2))).single.apply().get
  }

  def list(published: Boolean, offset: Int, limit: Int): List[QuestionInfo] = {
    val sql = withSQL { 
      val cond = published match {
        case true => SQLSyntax.ne(qq.publishCount, 0)
        case false => SQLSyntax.eq(qq.publishCount, 0)
      }
      select
        .from(QuizQuestion as qq)
        .where.eq(qq.roomId, roomId)
        .and.append(cond)
        .orderBy(qq.id).desc.limit(limit).offset(offset)
    }
    sql.map(rs => QuizQuestion(qq.resultName)(rs)).list.apply.map(QuestionInfo.create(_))
  }

  def get(id: Int): Option[QuestionInfo] = {
    QuizQuestion.find(id).map(QuestionInfo.create)
  }

  def create(q: QuestionInfo): QuestionInfo = {
    val now = new DateTime()
    val entity = QuizQuestion.create(
      roomId=q.roomId,
      createdBy=q.createdBy,
      question=q.question,
      answers=q.answers,
      answerType=q.answerType.code,
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
        answerType=q.answerType.code,
        tags=q.tags,
        description=q.description,
        relatedUrl=q.relatedUrl,
        updated=now
      ).save();
      true;
    }.getOrElse(false)

  }

  def publish(eventId: Int, q: QuestionInfo, includeRanking: Boolean): PublishInfo = {
    val randomList = Random.shuffle(q.answerList.zipWithIndex)
    val answers = randomList.map(_._1)
    val answersIndex = randomList.map(_._2 + 1)
    val correctAnswer = q.answerType match {
      case AnswerType.FirstRow => answersIndex.indexOf(1) + 1
      case _ => 0
    }
    val now = new DateTime()
    DB.localTx { implicit session =>
      val entity = QuizPublish.create(
        eventId=eventId,
        questionId=q.id,
        correctAnswer=correctAnswer,
        answersIndex=answersIndex.mkString(""),
        includeRanking=includeRanking,
        created=now,
        updated=now)
      SQL("UPDATE QUIZ_QUESTION SET PUBLISH_COUNT = PUBLISH_COUNT + 1, UPDATED = ? " + 
          "WHERE ID = ?")
        .bind(now, q.id)
        .update.apply();

      val seq = QuizPublish.countBy(SQLSyntax.eq(qp.eventId, eventId))

      PublishInfo(
        entity.id,
        eventId,
        q.id,
        seq.toInt,
        q.question,
        answers
      )
    }
  }

  def answer(answer: AnswerInfo) = {
    val now = new DateTime()
    AnswerInfo.fromEntity(QuizUserAnswer.create(
      userId=answer.userId, 
      publishId=answer.publishId,
      eventId=answer.eventId, 
      userEventId=answer.userEventId, 
      answer=answer.answer, 
      status=answer.status.code,
      time=answer.time,
      created=now,
      updated=now
    ))
  }


  val updateCommand = CommandHandler { command =>
    val ret = update(QuestionInfo.fromJson(command.data))
    command.text(ret.toString)
  }

  val listCommand = CommandHandler { command =>
    val published = (command.data \ "published").as[Boolean]
    val offset = (command.data \ "offset").as[Int]
    val limit = (command.data \ "limit").as[Int]
    val data = list(published, offset, limit).map(_.toJson)
    command.json(JsArray(data))
  }

  val countCommand = CommandHandler { command =>
    val (count, published) = countAndPublished
    command.json(JsObject(Seq(
      "count" -> JsNumber(count),
      "published" -> JsNumber(published)
    )))
  }

  val createCommand = CommandHandler { command =>
    val q = create(QuestionInfo.fromJson(command.data))
    val res = command.json(q.toJson)
    broadcast.send(res)
    CommandResponse.None
  }

  val publishCommand = CommandHandler { command =>
    val questionId = (command.data \ "questionId").as[Int]
    val eventId = (command.data \ "eventId").as[Int]
    val includeRanking = (command.data \ "includeRanking").as[Boolean]
    val ret = get(questionId).map { q =>
      try {
        val pub = publish(eventId, q, includeRanking)
        broadcast.send(new CommandResponse("question", pub.toJson))
        "OK"
      } catch {
        case e: Exception =>
          Messages("alreadyPublished")
      }
    }.getOrElse(throw new IllegalArgumentException("Question not found: " + questionId))
    command.text(ret)
  }

  val answerCommand = CommandHandler { command =>
    val ret = answer(AnswerInfo.fromJson(command.data))
    broadcast.send(new CommandResponse("answer", ret.toJson))
    CommandResponse.None
  }
}

object QuestionManager {
  def apply(roomId: Int, broadcast: CommandBroadcast) = new QuestionManager(roomId, broadcast)
}