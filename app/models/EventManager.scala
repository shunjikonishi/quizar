package models

import play.api.libs.json._
import play.api.i18n.Messages;
import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import models.entities.QuizEvent
import models.entities.QuizUserEvent
import org.joda.time.DateTime
import flect.websocket.Command
import flect.websocket.CommandHandler
import flect.websocket.CommandResponse

class EventManager(roomId: Int) {

  implicit val autoSession = QuizEvent.autoSession
  private val (qe, que) = (QuizEvent.qe, QuizUserEvent.que)

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

  def open(id: Int): Boolean = {
    DB localTx { implicit session =>
      val now = new DateTime()
      val ret = SQL("UPDATE QUIZ_EVENT SET STATUS = ?, EXEC_DATE = ?, UPDATED = ? " + 
          "WHERE ID = ? AND STATUS = ?")
        .bind(EventStatus.Running.code, roundTime(now), now, id, EventStatus.Prepared.code)
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

}

object EventManager {
  def apply(roomId: Int) = new EventManager(roomId)
}