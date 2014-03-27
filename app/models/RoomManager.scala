package models

import play.api.Logger
import play.api.libs.json._
import play.api.libs.iteratee.Iteratee
import play.api.libs.iteratee.Enumerator
import scala.concurrent.Future
import org.joda.time.DateTime
import scalikejdbc._
import scalikejdbc.SQLInterpolation._

import models.entities.QuizRoom
import models.entities.QuizEvent
import models.sqlviews.QuizEventWinner
import models.sqlviews.QuizRanking
import models.sqlviews.QuizTotalRanking
import models.sqlviews.QuizAnswerCount

import flect.websocket.Command
import flect.websocket.CommandHandler
import flect.websocket.CommandResponse
import flect.redis.Room
import flect.redis.RedisService

class RoomManager(redis: RedisService) extends flect.redis.RoomManager[RedisRoom](redis) {

  private val DEFAULT_RANKING_LIMIT = 10;

  override protected def terminate() = {
    super.terminate()
    redis.close
  }
  
  private val (qr, qe) = (QuizRoom.qr, QuizEvent.qe)

  override protected def createRoom(name: String) = {
    val id = name.substring(5).toInt
    val info = getRoomInfo(id, false).get
    new RedisRoom(info, redis)
  }

  def getRoom(id: Int): RedisRoom = getRoom("room." + id)
  def join(id: Int): Future[(Iteratee[String,_], Enumerator[String])] = join("room." + id)

  def getRoomInfo(id: Int, includeCurrentEvent: Boolean): Option[RoomInfo] = {
    val room = QuizRoom.find(id).map(RoomInfo.create(_))
    if (includeCurrentEvent) {
      room.map(_.copy(
        event = EventManager(id).getCurrentEvent
      ))
    } else {
      room
    }
  }

  def create(room: RoomInfo): RoomInfo = DB.localTx { implicit session =>
    val now = new DateTime()
    val entity = QuizRoom.create(
      name=room.name,
      tags=room.tags,
      hashtag=room.hashtag,
      userQuiz=room.userQuiz,
      description=room.description,
      owner=room.owner,
      adminUsers=room.adminUsers,
      created=now,
      updated=now
    )
    RoomInfo.create(entity)
  }

  def update(room: RoomInfo): Boolean = DB.localTx { implicit session =>
    QuizRoom.find(room.id).map { entity =>
      entity.copy(
        name=room.name,
        tags=room.tags,
        hashtag=room.hashtag,
        userQuiz=room.userQuiz,
        description=room.description,
        adminUsers=room.adminUsers,
        updated= new DateTime()
      ).save();
      true;
    }.getOrElse(false)
  }

  def list(offset: Int, limit: Int, userId: Option[Int]): List[RoomInfo] = DB.readOnly { implicit session =>
    val where = userId.map(n => sqls""" where exists(
      select * from quiz_user_event que
              where que.room_id = qr.id
                and que.user_id = ${n}) or qr.owner = ${n}"""
    ).getOrElse(sqls"")
    withSQL { 
      select
        .from(QuizRoom as qr)
        .leftJoin(QuizEvent as qe).on(sqls"qr.id = qe.room_id and qe.status in (0, 1)")
        .append(where)
        .orderBy(sqls"COALESCE(qe.status, 0) desc, qe.exec_date asc, qr.updated desc")
        .limit(limit).offset(offset)
    }.map { rs =>
      val room = RoomInfo.create(QuizRoom(qr.resultName)(rs))
      val event = rs.intOpt(qe.resultName.roomId).map(_ => EventInfo.create(QuizEvent(qe.resultName)(rs)))
      event.map(room.withEvent(_)).getOrElse(room)
    }.list.apply
  }

  def listRecent(offset: Int, limit: Int): List[RoomInfo] = DB.readOnly { implicit session =>
    val now = new DateTime()
    withSQL { 
      select
        .from(QuizRoom as qr)
        .leftJoin(QuizEvent as qe).on(sqls"qr.id = qe.room_id and qe.status in (0, 1)")
        .where(sqls"qe.status = 1 or qe.status is null or qe.exec_date > ${now}")
        .orderBy(sqls"COALESCE(qe.status, 0) desc, qe.exec_date asc, qr.updated desc")
        .limit(limit).offset(offset)
    }.map { rs =>
      val room = RoomInfo.create(QuizRoom(qr.resultName)(rs))
      val event = rs.intOpt(qe.resultName.roomId).map(_ => EventInfo.create(QuizEvent(qe.resultName)(rs)))
      event.map(room.withEvent(_)).getOrElse(room)
    }.list.apply
  }

  def listUserEntriedRooms(userId: Int, offset: Int, limit: Int): List[UserEntriedRoom] = DB.readOnly { implicit session =>
    sql"""
      select B.id, B.name as room_name, B.owner, B.updated, 
             C.name as owner_name, C.image_url, A.user_id, 
             SUM(A.point) as point, SUM(A.correct_count) as correct_count
        from quiz_user_event A
  inner join quiz_room B on (A.room_id = B.id)
  inner join quiz_user C on (B.owner = C.id)
       where A.user_id = ${userId}
    group by B.id, B.name, B.owner, B.updated, C.name, C.image_url, A.user_id
    order by B.updated desc
    limit ${limit} offset ${offset}
    """.map { rs =>
      UserEntriedRoom(
        roomId=rs.int("id"),
        roomName=rs.string("room_name"),
        owner=rs.int("owner"),
        ownerName=rs.string("owner_name"),
        ownerImage=rs.string("image_url"),
        userId=rs.int("user_id"),
        point=rs.int("point"),
        correctCount=rs.int("correct_count")
      )
    }.list.apply
  }

  def listOwnedRooms(userId: Int, offset: Int, limit: Int): List[OwnedRoom] = DB.readOnly { implicit session =>
    sql"""
      select A.id, A.name as room_name, A.owner, A.updated, 
             B.name as owner_name, B.image_url, 
             SUM(C.count) as event_count, SUM(D.count) as question_count
        from quiz_room A
  inner join quiz_user B on (A.owner = B.id)
   left join (select room_id, count(*) as count 
                from quiz_event
            group by room_id) C on (A.id = C.room_id)
   left join (select room_id, count(*) as count 
                from quiz_question
            group by room_id) D on (A.id = D.room_id)
       where A.owner = ${userId}
    group by A.id, A.name, A.owner, A.updated, B.name, B.image_url
    order by A.updated desc
    limit ${limit} offset ${offset}
    """.map { rs =>
      OwnedRoom(
        roomId=rs.int("id"),
        roomName=rs.string("room_name"),
        owner=rs.int("owner"),
        ownerName=rs.string("owner_name"),
        ownerImage=rs.string("image_url"),
        eventCount=rs.intOpt("event_count").getOrElse(0),
        questionCount=rs.intOpt("question_count").getOrElse(0)
      )
    }.list.apply
  }

  def getMemberCount(eventId: Int): Int = DB.readOnly { implicit session =>
    sql"select count(*) from quiz_user_event where event_id = ${eventId}"
      .map(_.int(1)).single.apply.getOrElse(0)
  }

  def getPublishedQuestions(eventId: Int): List[Int] = DB.readOnly { implicit session =>
    sql"select question_id from quiz_publish where event_id = ${eventId}"
      .map(_.int(1)).list.apply
  }

  def getEventRanking(eventId: Int, limit: Int, offset: Int): List[QuizRanking] = DB.readOnly { implicit session =>
    QuizRanking.findByEventId(eventId, limit, offset)
  }

  def getEventWinners(roomId: Int): List[QuizEventWinner] = DB.readOnly { implicit session =>
    QuizEventWinner.findByRoomId(roomId)
  }

  def getTotalRanking(roomId: Int, limit: Int): List[QuizTotalRanking] = DB.readOnly { implicit session =>
    QuizTotalRanking.findByRoomId(roomId, limit)
  }

  def getUserTotalRanking(roomId: Int, userId: Int): Option[Int] = DB.readOnly { implicit session =>
    val numbers = sql"""
      select sum(point), sum(correct_count), sum(time) from quiz_user_event
       where room_id = ${roomId} and user_id = ${userId}
    """.map {rs =>
      (rs.int(1), rs.int(2), rs.int(3))
    }.single.apply
    numbers match {
      case Some((point, correctCount, time)) if correctCount > 0 =>
        val cnt = sql"""
          select count(*) from quiz_total_ranking
           where (point > ${point})
              or (point = ${point} and correct_count > ${correctCount})
              or (point = ${point} and correct_count = ${correctCount} and time < ${time})
        """.map(_.int(1)).single.apply.get
        Some(cnt + 1)
      case _ => None
    }
  }

  def getEventQuestions(eventId: Int, userId: Int): List[UserQuestionInfo] = DB.readOnly { implicit session =>
    sql"""
      select A.id, B.question, C.answer,
             case when C.status is null then false
                  when C.status = 1 then true
                  when C.status = 2 then false
                  when A.correct_answer = 0 then false
                  when A.correct_answer = C.answer then true
                  else false
             end
        from quiz_publish A
  inner join quiz_question B on (A.question_id = B.id)
   left join quiz_user_answer C on (A.id = C.publish_id and C.user_id = ${userId})
       where A.event_id = ${eventId}
    order by A.id
    """.map { rs =>
      UserQuestionInfo(
        publishId=rs.int(1),
        question=rs.string(2),
        userAnswer=rs.intOpt(3),
        correct=rs.boolean(4)
      )
    }.list.apply
  }

  def getUserEvent(roomId: Int, userId: Int): List[UserEventInfo] = DB.readOnly { implicit session =>
    sql"""
      select A.id, A.user_id, A.event_id, A.room_id, B.title, B.exec_date,
             A.correct_count, A.wrong_count, A.time, A.point
        from quiz_user_event A
  inner join quiz_event B on (A.event_id = B.id)
       where A.room_id = ${roomId} and A.user_id = ${userId}
    order by A.event_id desc
    """.map { rs =>
      UserEventInfo(
        id=rs.int("id"),
        userId=rs.int("user_id"),
        eventId=rs.int("event_id"),
        roomId=rs.int("room_id"),
        title=rs.stringOpt("title"),
        execDate=rs.timestampOpt("exec_date").map(_.toDateTime),
        correctCount=rs.int("correct_count"),
        wrongCount=rs.int("wrong_count"),
        time=rs.int("time"),
        point=rs.int("point")
      )
    }.list.apply
  }

  def getEventWithCount(roomId: Int): List[EventWithCount] = DB readOnly { implicit session =>
    sql"""
      select A.id, A.room_id, A.title, A.status, A.admin, A.exec_date, A.end_date, 
             A.capacity, A.passcode, A.description,
             B.user_count, C.publish_count
        from quiz_event A
  inner join (select event_id, count(*) as user_count from quiz_user_event group by event_id) B ON (A.id = B.event_id)
  inner join (select event_id, count(*) as publish_count from quiz_publish group by event_id) C ON (A.id = C.event_id)
       where A.room_id = ${roomId}
    order by A.id desc
    """.map { rs =>
      val event = EventInfo(
        id=rs.int("id"),
        roomId = rs.int("room_id"),
        title = rs.stringOpt("title"),
        status = EventStatus.fromCode(rs.short("status")),
        admin = rs.intOpt("admin"),
        execDate = rs.timestampOpt("exec_date").map(_.toDateTime),
        endDate = rs.timestampOpt("end_date").map(_.toDateTime),
        capacity = rs.int("capacity"),
        passcode = rs.stringOpt("passcode"),
        description = rs.stringOpt("description")
      )
      EventWithCount(
        event=event,
        userCount=rs.int("user_count"),
        publishCount=rs.int("publish_count")
      )
    }.list.apply
  }

  def getLookback(publishId: Int): Option[LookbackInfo] = DB.readOnly { implicit session =>
    sql"""
      select A.id, B.question, B.answers, B.answer_type,
             B.description, B.related_url,
             A.correct_answer, A.answers_index,
             SUM(CASE WHEN C.answer = 1 THEN 1 ELSE 0 END) as answer1,
             SUM(CASE WHEN C.answer = 2 THEN 1 ELSE 0 END) as answer2,
             SUM(CASE WHEN C.answer = 3 THEN 1 ELSE 0 END) as answer3,
             SUM(CASE WHEN C.answer = 4 THEN 1 ELSE 0 END) as answer4,
             SUM(CASE WHEN C.answer = 5 THEN 1 ELSE 0 END) as answer5
        from quiz_publish A
  inner join quiz_question B on (A.question_id = B.id)
   left join quiz_user_answer C on (A.id = C.publish_id)
       where A.id = ${publishId}
    group by A.id, B.question, B.answers, B.answer_type,
             B.description, B.related_url,
             A.correct_answer, A.answers_index
    """.map { rs =>
      val question = rs.string("question")
      val answers = rs.string("answers").split("\n").toList
      val answerType = AnswerType.fromCode(rs.short("answer_type"))
      val description = rs.stringOpt("description")
      val relatedUrl = rs.stringOpt("related_url")
      val correctAnswer = rs.int("correct_answer")
      val answersIndex = rs.string("answers_index").toCharArray.toList.map(_.toInt)
      val answerCounts = Map(
        "1" -> rs.int("answer1"),
        "2" -> rs.int("answer2"),
        "3" -> rs.int("answer3"),
        "4" -> rs.int("answer4"),
        "5" -> rs.int("answer5")
      )
      val answerList = answers.zip(answersIndex).sortBy(_._2).map(_._1)
      LookbackInfo(
        publishId=publishId,
        question=question,
        answers=answerList,
        answerType=answerType,
        description=description,
        relatedUrl=relatedUrl,
        correctAnswer=correctAnswer,
        answerCounts=answerCounts
      )
    }.single.apply
  }

  def recalcQuestion(roomId: Int) = DB.localTx{ implicit session =>
    val now = new DateTime()
    sql"""UPDATE QUIZ_QUESTION A
             SET CORRECT_COUNT = B.CORRECT_COUNT,
                 WRONG_COUNT = B.WRONG_COUNT,
                 UPDATED = ${now}
            FROM (SELECT QUESTION_ID, 
                         SUM(CORRECT_COUNT) AS CORRECT_COUNT, 
                         SUM(WRONG_COUNT) AS WRONG_COUNT
                    FROM QUIZ_ANSWER_COUNT
                   GROUP BY QUESTION_ID) B
              WHERE A.ROOM_ID = ${roomId}
                AND A.ID = B.QUESTION_ID
      """.update.apply()
  }

  def closeInactiveEvents = {
    val now = new DateTime()
    val openEvents: List[(Int, Int, DateTime)] = DB.readOnly { implicit session =>
      sql"""
        SELECT A.ID, A.ROOM_ID, A.EXEC_DATE, MAX(B.UPDATED)
          FROM QUIZ_EVENT A 
     LEFT JOIN QUIZ_PUBLISH B ON (A.ID = B.EVENT_ID)
         WHERE A.STATUS = ${EventStatus.Running.code}
      GROUP BY A.ID, A.EXEC_DATE
      """.map { rs =>
        val eventId = rs.int(1)
        val roomId = rs.int(2)
        val date = rs.timestampOpt(4).getOrElse(rs.timestamp(3)).toDateTime
        (eventId, roomId, date)
      }.list.apply
    }
    openEvents.filter(_._3.plusDays(1).getMillis < now.getMillis).foreach { t =>
      val eventId = t._1
      val roomId = t._2
      Logger.info("closeInactiveEvent: " + eventId)
      EventManager(roomId).close(eventId)
      recalcQuestion(roomId)
    }
  }

  val createCommand = CommandHandler { command =>
    val room = create(RoomInfo.fromJson(command.data))
    command.json(room.toJson)
  }

  val updateCommand = CommandHandler { command =>
    update(RoomInfo.fromJson(command.data))
    command.text("OK")
  }

  val getCommand = CommandHandler { command =>
    val id = command.data.as[Int]
    val room = getRoomInfo(id, false)
    val data = room.map(_.toJson).getOrElse(JsNull)
    command.json(data)
  }

  val listCommand = CommandHandler { command =>
    val limit = (command.data \ "limit").as[Int]
    val offset = (command.data \ "offset").as[Int]
    val userId = (command.data \ "userId").asOpt[Int]
    val data = if (userId.isDefined) {
      list(offset, limit, userId).map(_.toJson)
    } else {
      listRecent(offset, limit).map(_.toJson)
    }
    command.json(JsArray(data))
  }

  val entriedRoomsCommand = CommandHandler { command =>
    val userId = (command.data \ "userId").as[Int]
    val limit = (command.data \ "limit").as[Int]
    val offset = (command.data \ "offset").as[Int]
    val data = listUserEntriedRooms(userId, offset, limit).map(_.toJson)
    command.json(JsArray(data))
  }

  val ownedRoomsCommand = CommandHandler { command =>
    val userId = (command.data \ "userId").as[Int]
    val limit = (command.data \ "limit").as[Int]
    val offset = (command.data \ "offset").as[Int]
    val data = listOwnedRooms(userId, offset, limit).map(_.toJson)
    command.json(JsArray(data))
  }

  val eventRankingCommand = CommandHandler { command =>
    val eventId = (command.data \ "eventId").as[Int]
    val limit = (command.data \ "limit").asOpt[Int].getOrElse(DEFAULT_RANKING_LIMIT)
    val offset = (command.data \ "offset").asOpt[Int].getOrElse(0)
    val data = JsArray(getEventRanking(eventId, limit, offset).map(_.toJson))
    command.json(data)
  }

  val eventWinnersCommand = CommandHandler { command =>
    val roomId = (command.data \ "roomId").as[Int]
    val data = JsArray(getEventWinners(roomId).map(_.toJson))
    command.json(data)
  }

  val totalRankingCommand = CommandHandler { command =>
    val roomId = (command.data \ "roomId").as[Int]
    val limit = (command.data \ "limit").asOpt[Int].getOrElse(DEFAULT_RANKING_LIMIT)
    val data = JsArray(getTotalRanking(roomId, limit).map(_.toJson))
    command.json(data)
  }

  val userTotalRankingCommand = CommandHandler { command =>
    val roomId = (command.data \ "roomId").as[Int]
    val userId = (command.data \ "userId").as[Int]
    val data = getUserTotalRanking(roomId, userId).map(JsNumber(_)).getOrElse(JsNull)
    command.json(data)
  }

  val userEventCommand = CommandHandler { command =>
    val roomId = (command.data \ "roomId").as[Int]
    val userId = (command.data \ "userId").as[Int]
    val data = JsArray(getUserEvent(roomId, userId).map(_.toJson))
    command.json(data)
  }

  val memberCountCommand = CommandHandler { command =>
    val eventId = command.data.as[Int]
    val data = JsNumber(getMemberCount(eventId))
    command.json(data)
  }

  val publishedQuestionsCommand = CommandHandler { command =>
    val eventId = command.data.as[Int]
    val data = JsArray(getPublishedQuestions(eventId).map(JsNumber(_)))
    command.json(data)
  }

  val eventQuestionsCommand = CommandHandler { command =>
    val eventId = (command.data \ "eventId").as[Int]
    val userId = (command.data \ "userId").as[Int]
    val data = JsArray(getEventQuestions(eventId, userId).map(_.toJson))
    command.json(data)
  }

  val eventWithCountCommand = CommandHandler { command =>
    val roomId = command.data.as[Int]
    val data = JsArray(getEventWithCount(roomId).map(_.toJson))
    command.json(data)
  }

  val lookbackCommand = CommandHandler { command =>
    val publishId = command.data.as[Int]
    val data = getLookback(publishId).map(_.toJson).getOrElse(JsNull)
    command.json(data)
  }

}

object RoomManager extends RoomManager(MyRedisService)
