package models

import play.api.libs.json._
import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import models.entities.QuizEvent
import org.joda.time.DateTime
import flect.websocket.Command
import flect.websocket.CommandHandler
import flect.websocket.CommandResponse

class EventManager(roomId: Int) {

  implicit val autoSession = QuizEvent.autoSession
  private val qe = QuizEvent.qe

  def getEvent(id: Int): Option[EventInfo] = {
    QuizEvent.find(id).map(EventInfo.create(_))
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
        .bind(EventStatus.Running.code, now, now, id, EventStatus.Prepared)
        .update.apply();
      ret == 1
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
}

object EventManager {
  def apply(roomId: Int) = new EventManager(roomId)
}