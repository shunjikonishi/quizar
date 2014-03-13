package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizPublish(
  id: Int, 
  eventId: Int, 
  questionId: Int, 
  opened: Boolean, 
  created: DateTime, 
  updated: DateTime) {

  def save()(implicit session: DBSession = QuizPublish.autoSession): QuizPublish = QuizPublish.save(this)(session)

  def destroy()(implicit session: DBSession = QuizPublish.autoSession): Unit = QuizPublish.destroy(this)(session)

}
      

object QuizPublish extends SQLSyntaxSupport[QuizPublish] {

  override val tableName = "quiz_publish"

  override val columns = Seq("id", "event_id", "question_id", "opened", "created", "updated")

  def apply(qp: ResultName[QuizPublish])(rs: WrappedResultSet): QuizPublish = new QuizPublish(
    id = rs.int(qp.id),
    eventId = rs.int(qp.eventId),
    questionId = rs.int(qp.questionId),
    opened = rs.boolean(qp.opened),
    created = rs.timestamp(qp.created).toDateTime,
    updated = rs.timestamp(qp.updated).toDateTime
  )
      
  val qp = QuizPublish.syntax("qp")

  override val autoSession = AutoSession

  def find(id: Int)(implicit session: DBSession = autoSession): Option[QuizPublish] = {
    withSQL { 
      select.from(QuizPublish as qp).where.eq(qp.id, id)
    }.map(QuizPublish(qp.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[QuizPublish] = {
    withSQL(select.from(QuizPublish as qp)).map(QuizPublish(qp.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(QuizPublish as qp)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[QuizPublish] = {
    withSQL { 
      select.from(QuizPublish as qp).where.append(sqls"${where}")
    }.map(QuizPublish(qp.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(QuizPublish as qp).where.append(sqls"${where}")
    }.map(_.long(1)).single.apply().get
  }
      
  def create(
    eventId: Int,
    questionId: Int,
    opened: Boolean,
    created: DateTime,
    updated: DateTime)(implicit session: DBSession = autoSession): QuizPublish = {
    val generatedKey = withSQL {
      insert.into(QuizPublish).columns(
        column.eventId,
        column.questionId,
        column.opened,
        column.created,
        column.updated
      ).values(
        eventId,
        questionId,
        opened,
        created,
        updated
      )
    }.updateAndReturnGeneratedKey.apply()

    QuizPublish(
      id = generatedKey.toInt, 
      eventId = eventId,
      questionId = questionId,
      opened = opened,
      created = created,
      updated = updated)
  }

  def save(entity: QuizPublish)(implicit session: DBSession = autoSession): QuizPublish = {
    withSQL { 
      update(QuizPublish).set(
        column.id -> entity.id,
        column.eventId -> entity.eventId,
        column.questionId -> entity.questionId,
        column.opened -> entity.opened,
        column.created -> entity.created,
        column.updated -> entity.updated
      ).where.eq(column.id, entity.id)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizPublish)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizPublish).where.eq(column.id, entity.id) }.update.apply()
  }
        
}
