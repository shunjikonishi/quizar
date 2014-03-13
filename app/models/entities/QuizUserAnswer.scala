package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizUserAnswer(
  id: Int, 
  userId: Int, 
  publishId: Int, 
  eventId: Int, 
  userEventId: Int, 
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

  override val columns = Seq("id", "user_id", "publish_id", "event_id", "user_event_id", "answer", "status", "time", "created", "updated")

  def apply(qua: ResultName[QuizUserAnswer])(rs: WrappedResultSet): QuizUserAnswer = new QuizUserAnswer(
    id = rs.int(qua.id),
    userId = rs.int(qua.userId),
    publishId = rs.int(qua.publishId),
    eventId = rs.int(qua.eventId),
    userEventId = rs.int(qua.userEventId),
    answer = rs.int(qua.answer),
    status = rs.short(qua.status),
    time = rs.int(qua.time),
    created = rs.timestamp(qua.created).toDateTime,
    updated = rs.timestamp(qua.updated).toDateTime
  )
      
  val qua = QuizUserAnswer.syntax("qua")

  override val autoSession = AutoSession

  def find(id: Int)(implicit session: DBSession = autoSession): Option[QuizUserAnswer] = {
    withSQL { 
      select.from(QuizUserAnswer as qua).where.eq(qua.id, id)
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
    userEventId: Int,
    answer: Int,
    status: Short,
    time: Int,
    created: DateTime,
    updated: DateTime)(implicit session: DBSession = autoSession): QuizUserAnswer = {
    val generatedKey = withSQL {
      insert.into(QuizUserAnswer).columns(
        column.userId,
        column.publishId,
        column.eventId,
        column.userEventId,
        column.answer,
        column.status,
        column.time,
        column.created,
        column.updated
      ).values(
        userId,
        publishId,
        eventId,
        userEventId,
        answer,
        status,
        time,
        created,
        updated
      )
    }.updateAndReturnGeneratedKey.apply()

    QuizUserAnswer(
      id = generatedKey.toInt, 
      userId = userId,
      publishId = publishId,
      eventId = eventId,
      userEventId = userEventId,
      answer = answer,
      status = status,
      time = time,
      created = created,
      updated = updated)
  }

  def save(entity: QuizUserAnswer)(implicit session: DBSession = autoSession): QuizUserAnswer = {
    withSQL { 
      update(QuizUserAnswer).set(
        column.id -> entity.id,
        column.userId -> entity.userId,
        column.publishId -> entity.publishId,
        column.eventId -> entity.eventId,
        column.userEventId -> entity.userEventId,
        column.answer -> entity.answer,
        column.status -> entity.status,
        column.time -> entity.time,
        column.created -> entity.created,
        column.updated -> entity.updated
      ).where.eq(column.id, entity.id)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizUserAnswer)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizUserAnswer).where.eq(column.id, entity.id) }.update.apply()
  }
        
}
