package models

import play.api.Play.current
import play.api.libs.concurrent.Akka
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.concurrent.duration.DurationInt
import scala.util.Random

import play.api.libs.json._
import play.api.i18n.Messages;
import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import models.entities.QuizEvent
import models.entities.QuizPublish
import models.entities.QuizUserEvent
import models.entities.QuizQuestion
import models.entities.QuizUserAnswer
import models.entities.QuizRanking
import org.joda.time.DateTime
import flect.websocket.Command
import flect.websocket.CommandHandler
import flect.websocket.CommandResponse
import flect.websocket.CommandBroadcast

class EventManager(roomId: Int, broadcast: Option[CommandBroadcast]) {
  import EventManager._

  private var prevPublished: Option[PublishedQuestion] = None

  implicit val autoSession = QuizEvent.autoSession
  private val (qe, que, qp, qua, qr) = (QuizEvent.qe, QuizUserEvent.que, QuizPublish.qp, QuizUserAnswer.qua, QuizRanking.qr)

  private def roundTime(d: DateTime) = {
    val hour = d.getHourOfDay
    val min = d.getMinuteOfHour match {
      case n if (n < 15) => 0
      case n if (n < 30) => 15
      case n if (n < 45) => 30
      case _ => 45
    }
    val ret = d.withTime(hour, min, 0, 0)
    println("roundTime: " + d + ", " + ret)
    ret
  }

  def getQuestion(id: Int): Option[QuestionInfo] = {
    QuizQuestion.find(id).map(QuestionInfo.create)
  }

  def getEvent(id: Int): Option[EventInfo] = {
    QuizEvent.find(id).map(EventInfo.create(_))
  }

  def getUserEventId(userId: Int, eventId: Int): Option[Int] = {
    QuizUserEvent.findAllBy(SQLSyntax.eq(que.userId, userId).and.eq(que.eventId, eventId)).headOption.map(_.id)
  }

  def getCurrentEvent: Option[EventInfo] = {
    withSQL { 
      select
        .from(QuizEvent as qe)
        .where.eq(qe.roomId, roomId).and.in(qe.status, Seq(EventStatus.Prepared.code, EventStatus.Running.code))
        .orderBy(qe.id).desc
        .limit(1)
    }.map(QuizEvent(qe.resultName)).list.apply.headOption.map(EventInfo.create(_))
  }

  def create(event: EventInfo)(implicit session: DBSession): EventInfo = {
    val now = new DateTime()
    val entity = QuizEvent.create(
      roomId=event.roomId,
      title=event.title,
      status=event.status.code,
      execDate=event.execDate,
      //endDate=event.endDate,
      capacity=event.capacity,
      passcode=event.passcode,
      description=event.description,
      created=now,
      updated=now
    )
    EventInfo.create(entity)
  }

  def update(event: EventInfo)(implicit session: DBSession): Boolean = {
    QuizEvent.find(event.id).map { entity =>
      entity.copy(
        roomId=event.roomId,
        title=event.title,
        //status=event.status.code,
        execDate=event.execDate,
        //endDate=event.endDate,
        capacity=event.capacity,
        passcode=event.passcode,
        description=event.description,
        updated= new DateTime()
      ).save();
      true;
    }.getOrElse(false)
  }

  def open(id: Int, admin: Int): Boolean = {
    DB localTx { implicit session =>
      val now = new DateTime()
      val ret = SQL("UPDATE QUIZ_EVENT SET STATUS = ?, ADMIN = ?, EXEC_DATE = ?, UPDATED = ? " + 
          "WHERE ID = ? AND STATUS = ?")
        .bind(EventStatus.Running.code, admin, roundTime(now), now, id, EventStatus.Prepared.code)
        .update.apply();
      ret == 1
    }
  }

  def close(id: Int): Boolean = {
    DB localTx { implicit session =>
      val now = new DateTime()
      val ret = SQL("UPDATE QUIZ_EVENT SET STATUS = ?, END_DATE = ?, UPDATED = ? " + 
          "WHERE ID = ? AND STATUS = ?")
        .bind(EventStatus.Finished.code, roundTime(now), now, id, EventStatus.Running.code)
        .update.apply();
      //ToDo ranking
      ret == 1
    }
  }

  def entry(userId: Int, eventId: Int, userpass: Option[String]): Int = {
    DB localTx { implicit session =>
      val sameUser = QuizUserEvent.countBy(SQLSyntax.eq(que.userId, userId).and.eq(que.eventId, eventId))
      if (sameUser == 1) {
        throw new QuizException(Messages("alreadyEntryEvent"))
      }
      val event = QuizEvent.find(eventId).getOrElse(throw new IllegalArgumentException("Event not found: " + eventId))
      val entryCount = QuizUserEvent.countBy(SQLSyntax.eq(que.eventId, eventId))
      if (entryCount >= event.capacity) {
        throw new QuizException(Messages("capacityOver"))
      }
      event.passcode match {
        case Some(x) =>
          userpass match {
            case Some(y) =>
              if (x != y) {
                throw new InvalidPasscodeException()
              }
            case None =>
              throw new PasscodeRequireException()
          }
        case None => //OK
      }
      val now = new DateTime()
      QuizUserEvent.create(
        userId=userId,
        eventId=eventId,
        roomId=roomId,
        correctCount=0,
        wrongCount=0,
        time=0,
        point=0,
        created=now,
        updated=now).id
    }
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

  def getEventRanking(eventId: Int, limit: Int): List[EventRankingInfo] = {
    QuizRanking.findAllBy(
      SQLSyntax.eq(qr.eventId, eventId)
        .orderBy(sqls"correct_count desc, time asc")
        .limit(limit)
    ).map(EventRankingInfo.create)
  }

  def getEventWinners(roomId: Int, limit: Int): List[EventRankingInfo] = {
    Nil
  }

  def getTotalRanking(roomId: Int, limit: Int): List[EventRankingInfo] = {
    Nil
  }

  private def calcSummary(pq: PublishedQuestion) = {
println("calcSummary1: " + pq.publishId)
    DB.localTx { implicit session =>
      val now = new DateTime()
      val answers = withSQL {
        select(sqls"answer, count(*)").from(QuizUserAnswer as qua)
          .where.eq(qua.publishId, pq.publishId)
          .groupBy(sqls"answer")
      }.map(rs => (rs.int(1), rs.int(2))).list.apply()
println("calcSummary2: " + answers)
      val correctCount = pq.answerType match {
        case AnswerType.Most => answers.map(_._2).max
        case AnswerType.Least => answers.map(_._2).min
      }
println("calcSummary3: " + correctCount)
      val correctAnswers = answers.filter(_._2 == correctCount).map(_._1)
      sql"""UPDATE QUIZ_USER_ANSWER
          SET STATUS = CASE WHEN ANSWER IN (${correctAnswers}) THEN 1 ELSE 2 END,
              UPDATED = ${now}
        WHERE PUBLISH_ID = ${pq.publishId}""".update.apply();
    }
  }

  val createCommand = CommandHandler { command =>
    val event = create(EventInfo.fromJson(command.data))
    command.json(event.toJson)
  }

  val updateCommand = CommandHandler { command =>
    update(EventInfo.fromJson(command.data))
    command.text("OK")
  }

  val getCommand = CommandHandler { command =>
    val id = command.data.as[Int]
    val event = getEvent(id)
    val data = event.map(_.toJson).getOrElse(JsNull)
    command.json(data)
  }

  val getCurrentCommand = CommandHandler { command =>
    val event = getCurrentEvent
    val data = event.map(_.toJson).getOrElse(JsNull)
    command.json(data)
  }

  val entryCommand = CommandHandler { command =>
    val userId = (command.data \ "userId").as[Int]
    val eventId = (command.data \ "eventId").as[Int]
    val passcode = (command.data \ "passcode").asOpt[String]
    val json = try {
      val userEventId = entry(userId, eventId, passcode)
      broadcast.foreach { b =>
        val username = (command.data \ "username").as[String]
        val img = (command.data \ "userImage").as[String]
        b.send(new CommandResponse("newEntry", UserInfo(userId, username, img).toJson))
      }
      JsObject(Seq("userEventId" -> JsNumber(userEventId)))
    } catch {
      case e: PasscodeRequireException =>
        JsObject(Seq("requirePass" -> JsBoolean(true)))
      case e: Exception =>
        JsObject(Seq("error" -> JsString(e.getMessage)))
    }
    command.json(json)
  }

  val openCommand = CommandHandler { command =>
    val id = (command.data \ "id").as[Int]
    val admin = (command.data \ "admin").as[Int]
    val ret = open(id, admin)
    if (ret) {
      broadcast.foreach(_.send(new CommandResponse("startEvent", JsObject(Seq(
        "id" -> JsNumber(id),
        "admin" -> JsNumber(admin)
      )))))
    }
    command.json(JsBoolean(ret))
  }

  val closeCommand = CommandHandler { command =>
    prevPublished.filter(_.isCalcRequired).foreach(calcSummary(_))
    prevPublished = None

    val id = command.data.as[Int]
    val ret = close(id)
    if (ret) {
      broadcast.foreach(_.send(new CommandResponse("finishEvent", JsNumber(id))))
    }
    command.json(JsBoolean(ret))
  }

  val publishCommand = CommandHandler { command =>
    prevPublished.filter(_.isCalcRequired).foreach(calcSummary(_))

    val questionId = (command.data \ "questionId").as[Int]
    val eventId = (command.data \ "eventId").as[Int]
    val includeRanking = (command.data \ "includeRanking").as[Boolean]
    val ret = getQuestion(questionId).map { q =>
      try {
        val pub = publish(eventId, q, includeRanking)
        val pq = PublishedQuestion(pub.id, questionId, q.answerType)
        prevPublished = Some(pq)

        broadcast.foreach(_.send(new CommandResponse("question", pub.toJson)))
        Akka.system.scheduler.scheduleOnce(10 seconds) {
          broadcast.foreach(_.send(new CommandResponse("answerDetail", q.toJson)))
println("calcSummary0: " + pq.isCalcRequired)
          if (pq.isCalcRequired) {
            calcSummary(pq)
          }
        }
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
    broadcast.foreach(_.send(new CommandResponse("answer", ret.toJson)))
    CommandResponse.None
  }

  val eventRankingCommand = CommandHandler { command =>
    val eventId = (command.data \ "eventId").as[Int]
    val limit = (command.data \ "limit").asOpt[Int].getOrElse(DEFAULT_RANKING_LIMIT)
    val data = JsArray(getEventRanking(eventId, limit).map(_.toJson))
    command.json(data)
  }

  val eventWinnersCommand = CommandHandler { command =>
    val roomId = (command.data \ "roomId").as[Int]
    val limit = (command.data \ "limit").asOpt[Int].getOrElse(DEFAULT_RANKING_LIMIT)
    val data = JsArray(getEventWinners(roomId, limit).map(_.toJson))
    command.json(data)
  }

  val totalRankingCommand = CommandHandler { command =>
    val roomId = (command.data \ "roomId").as[Int]
    val limit = (command.data \ "limit").asOpt[Int].getOrElse(DEFAULT_RANKING_LIMIT)
    val data = JsArray(getTotalRanking(roomId, limit).map(_.toJson))
    command.json(data)
  }

  case class PublishedQuestion(
    publishId: Int,
    questionId: Int,
    answerType: AnswerType
  ) {
    def isCalcRequired = answerType == AnswerType.Most || answerType == AnswerType.Least
  }
}

object EventManager {
  private val DEFAULT_RANKING_LIMIT = 10;

  def apply(roomId: Int, broadcast: CommandBroadcast = null) = new EventManager(roomId, Option(broadcast))
}