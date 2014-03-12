package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizUserAnswer(
  userId: Int, 
  publishId: Int, 
  eventId: Int, 
  answer: Int, 
  status: Short, 
  time: Int, 
  created: DateTime, 
  updated: DateTime) {

  def save()(implicit session: DBSession = QuizUserAnswer.autoSession): QuizUserAnswer = QuizUserAnswer.save(this)(session)

  def destroy()(implicit session: DBSession = QuizUserAnswer.autoSession): Unit = QuizUserAnswer.destroy(this)(session)

}
      

object QuizUserAnswer extends SQLSyntaxSupport[QuizUserAnswer] {

  override val tableName = "quiz_user_answer"

  override val columns = Seq("user_id", "publish_id", "event_id", "answer", "status", "time", "created", "updated")

  def apply(qua: ResultName[QuizUserAnswer])(rs: WrappedResultSet): QuizUserAnswer = new QuizUserAnswer(
    userId = rs.int(qua.userId),
    publishId = rs.int(qua.publishId),
    eventId = rs.int(qua.eventId),
    answer = rs.int(qua.answer),
    status = rs.short(qua.status),
    time = rs.int(qua.time),
    created = rs.timestamp(qua.created).toDateTime,
    updated = rs.timestamp(qua.updated).toDateTime
  )
      
  val qua = QuizUserAnswer.syntax("qua")

  override val autoSession = AutoSession

  def find(userId: Int, publishId: Int)(implicit session: DBSession = autoSession): Option[QuizUserAnswer] = {
    withSQL { 
      select.from(QuizUserAnswer as qua).where.eq(qua.userId, userId).and.eq(qua.publishId, publishId)
    }.map(QuizUserAnswer(qua.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[QuizUserAnswer] = {
    withSQL(select.from(QuizUserAnswer as qua)).map(QuizUserAnswer(qua.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(QuizUserAnswer as qua)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[QuizUserAnswer] = {
    withSQL { 
      select.from(QuizUserAnswer as qua).where.append(sqls"${where}")
    }.map(QuizUserAnswer(qua.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(QuizUserAnswer as qua).where.append(sqls"${where}")
    }.map(_.long(1)).single.apply().get
  }
      
  def create(
    userId: Int,
    publishId: Int,
    eventId: Int,
    answer: Int,
    status: Short,
    time: Int,
    created: DateTime,
    updated: DateTime)(implicit session: DBSession = autoSession): QuizUserAnswer = {
    withSQL {
      insert.into(QuizUserAnswer).columns(
        column.userId,
        column.publishId,
        column.eventId,
        column.answer,
        column.status,
        column.time,
        column.created,
        column.updated
      ).values(
        userId,
        publishId,
        eventId,
        answer,
        status,
        time,
        created,
        updated
      )
    }.update.apply()

    QuizUserAnswer(
      userId = userId,
      publishId = publishId,
      eventId = eventId,
      answer = answer,
      status = status,
      time = time,
      created = created,
      updated = updated)
  }

  def save(entity: QuizUserAnswer)(implicit session: DBSession = autoSession): QuizUserAnswer = {
    withSQL { 
      update(QuizUserAnswer).set(
        column.userId -> entity.userId,
        column.publishId -> entity.publishId,
        column.eventId -> entity.eventId,
        column.answer -> entity.answer,
        column.status -> entity.status,
        column.time -> entity.time,
        column.created -> entity.created,
        column.updated -> entity.updated
      ).where.eq(column.userId, entity.userId).and.eq(column.publishId, entity.publishId)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizUserAnswer)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizUserAnswer).where.eq(column.userId, entity.userId).and.eq(column.publishId, entity.publishId) }.update.apply()
  }
        
}
