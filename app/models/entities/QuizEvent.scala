package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizEvent(
  id: Int, 
  roomId: Int, 
  title: Option[String] = None, 
  status: Short, 
  admin: Option[Int] = None, 
  execDate: Option[DateTime] = None, 
  endDate: Option[DateTime] = None, 
  capacity: Int, 
  passcode: Option[String] = None, 
  description: Option[String] = None, 
  created: DateTime, 
  updated: DateTime) {

  def save()(implicit session: DBSession = QuizEvent.autoSession): QuizEvent = QuizEvent.save(this)(session)

  def destroy()(implicit session: DBSession = QuizEvent.autoSession): Unit = QuizEvent.destroy(this)(session)

}
      

object QuizEvent extends SQLSyntaxSupport[QuizEvent] {

  override val tableName = "quiz_event"

  override val columns = Seq("id", "room_id", "title", "status", "admin", "exec_date", "end_date", "capacity", "passcode", "description", "created", "updated")

  def apply(qe: ResultName[QuizEvent])(rs: WrappedResultSet): QuizEvent = new QuizEvent(
    id = rs.int(qe.id),
    roomId = rs.int(qe.roomId),
    title = rs.stringOpt(qe.title),
    status = rs.short(qe.status),
    admin = rs.intOpt(qe.admin),
    execDate = rs.timestampOpt(qe.execDate).map(_.toDateTime),
    endDate = rs.timestampOpt(qe.endDate).map(_.toDateTime),
    capacity = rs.int(qe.capacity),
    passcode = rs.stringOpt(qe.passcode),
    description = rs.stringOpt(qe.description),
    created = rs.timestamp(qe.created).toDateTime,
    updated = rs.timestamp(qe.updated).toDateTime
  )
      
  val qe = QuizEvent.syntax("qe")

  override val autoSession = AutoSession

  def find(id: Int)(implicit session: DBSession = autoSession): Option[QuizEvent] = {
    withSQL { 
      select.from(QuizEvent as qe).where.eq(qe.id, id)
    }.map(QuizEvent(qe.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[QuizEvent] = {
    withSQL(select.from(QuizEvent as qe)).map(QuizEvent(qe.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(QuizEvent as qe)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[QuizEvent] = {
    withSQL { 
      select.from(QuizEvent as qe).where.append(sqls"${where}")
    }.map(QuizEvent(qe.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(QuizEvent as qe).where.append(sqls"${where}")
    }.map(_.long(1)).single.apply().get
  }
      
  def create(
    roomId: Int,
    title: Option[String] = None,
    status: Short,
    admin: Option[Int] = None,
    execDate: Option[DateTime] = None,
    endDate: Option[DateTime] = None,
    capacity: Int,
    passcode: Option[String] = None,
    description: Option[String] = None,
    created: DateTime,
    updated: DateTime)(implicit session: DBSession = autoSession): QuizEvent = {
    val generatedKey = withSQL {
      insert.into(QuizEvent).columns(
        column.roomId,
        column.title,
        column.status,
        column.admin,
        column.execDate,
        column.endDate,
        column.capacity,
        column.passcode,
        column.description,
        column.created,
        column.updated
      ).values(
        roomId,
        title,
        status,
        admin,
        execDate,
        endDate,
        capacity,
        passcode,
        description,
        created,
        updated
      )
    }.updateAndReturnGeneratedKey.apply()

    QuizEvent(
      id = generatedKey.toInt, 
      roomId = roomId,
      title = title,
      status = status,
      admin = admin,
      execDate = execDate,
      endDate = endDate,
      capacity = capacity,
      passcode = passcode,
      description = description,
      created = created,
      updated = updated)
  }

  def save(entity: QuizEvent)(implicit session: DBSession = autoSession): QuizEvent = {
    withSQL { 
      update(QuizEvent).set(
        column.id -> entity.id,
        column.roomId -> entity.roomId,
        column.title -> entity.title,
        column.status -> entity.status,
        column.admin -> entity.admin,
        column.execDate -> entity.execDate,
        column.endDate -> entity.endDate,
        column.capacity -> entity.capacity,
        column.passcode -> entity.passcode,
        column.description -> entity.description,
        column.created -> entity.created,
        column.updated -> entity.updated
      ).where.eq(column.id, entity.id)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizEvent)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizEvent).where.eq(column.id, entity.id) }.update.apply()
  }
        
}
