package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizUserEvent(
  userId: Int, 
  eventId: Int, 
  roomId: Int, 
  correctCount: Int, 
  wrongCount: Int, 
  time: Long, 
  point: Int, 
  created: DateTime, 
  updated: DateTime) {

  def save()(implicit session: DBSession = QuizUserEvent.autoSession): QuizUserEvent = QuizUserEvent.save(this)(session)

  def destroy()(implicit session: DBSession = QuizUserEvent.autoSession): Unit = QuizUserEvent.destroy(this)(session)

}
      

object QuizUserEvent extends SQLSyntaxSupport[QuizUserEvent] {

  override val tableName = "quiz_user_event"

  override val columns = Seq("user_id", "event_id", "room_id", "correct_count", "wrong_count", "time", "point", "created", "updated")

  def apply(que: ResultName[QuizUserEvent])(rs: WrappedResultSet): QuizUserEvent = new QuizUserEvent(
    userId = rs.int(que.userId),
    eventId = rs.int(que.eventId),
    roomId = rs.int(que.roomId),
    correctCount = rs.int(que.correctCount),
    wrongCount = rs.int(que.wrongCount),
    time = rs.long(que.time),
    point = rs.int(que.point),
    created = rs.timestamp(que.created).toDateTime,
    updated = rs.timestamp(que.updated).toDateTime
  )
      
  val que = QuizUserEvent.syntax("que")

  override val autoSession = AutoSession

  def find(userId: Int, eventId: Int)(implicit session: DBSession = autoSession): Option[QuizUserEvent] = {
    withSQL { 
      select.from(QuizUserEvent as que).where.eq(que.userId, userId).and.eq(que.eventId, eventId)
    }.map(QuizUserEvent(que.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[QuizUserEvent] = {
    withSQL(select.from(QuizUserEvent as que)).map(QuizUserEvent(que.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(QuizUserEvent as que)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[QuizUserEvent] = {
    withSQL { 
      select.from(QuizUserEvent as que).where.append(sqls"${where}")
    }.map(QuizUserEvent(que.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(QuizUserEvent as que).where.append(sqls"${where}")
    }.map(_.long(1)).single.apply().get
  }
      
  def create(
    userId: Int,
    eventId: Int,
    roomId: Int,
    correctCount: Int,
    wrongCount: Int,
    time: Long,
    point: Int,
    created: DateTime,
    updated: DateTime)(implicit session: DBSession = autoSession): QuizUserEvent = {
    withSQL {
      insert.into(QuizUserEvent).columns(
        column.userId,
        column.eventId,
        column.roomId,
        column.correctCount,
        column.wrongCount,
        column.time,
        column.point,
        column.created,
        column.updated
      ).values(
        userId,
        eventId,
        roomId,
        correctCount,
        wrongCount,
        time,
        point,
        created,
        updated
      )
    }.update.apply()

    QuizUserEvent(
      userId = userId,
      eventId = eventId,
      roomId = roomId,
      correctCount = correctCount,
      wrongCount = wrongCount,
      time = time,
      point = point,
      created = created,
      updated = updated)
  }

  def save(entity: QuizUserEvent)(implicit session: DBSession = autoSession): QuizUserEvent = {
    withSQL { 
      update(QuizUserEvent).set(
        column.userId -> entity.userId,
        column.eventId -> entity.eventId,
        column.roomId -> entity.roomId,
        column.correctCount -> entity.correctCount,
        column.wrongCount -> entity.wrongCount,
        column.time -> entity.time,
        column.point -> entity.point,
        column.created -> entity.created,
        column.updated -> entity.updated
      ).where.eq(column.userId, entity.userId).and.eq(column.eventId, entity.eventId)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizUserEvent)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizUserEvent).where.eq(column.userId, entity.userId).and.eq(column.eventId, entity.eventId) }.update.apply()
  }
        
}
