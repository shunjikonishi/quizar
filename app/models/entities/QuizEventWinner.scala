package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizEventWinner(
  roomId: Int,
  eventId: Int,
  execDate: DateTime,
  title: String,
  userId: Option[Int],
  username: Option[String],
  point: Option[Int],
  member: Int
)

object QuizEventWinner extends SQLSyntaxSupport[QuizEventWinner] {

  override val tableName = "quiz_event_winner"

  override val columns = Seq("room_id", "event_id", "exec_date", "title", "user_id", "username", "point", "member")

  def apply(qac: ResultName[QuizEventWinner])(rs: WrappedResultSet): QuizEventWinner = new QuizEventWinner(
    roomId=rs.int(qew.roomId),
    eventId=rs.int(qew.eventId),
    execDate=rs.timestamp(qew.execDate).toDateTime,
    title=rs.string(qew.title),
    userId=rs.intOpt(qew.userId),
    username=rs.stringOpt(qew.username),
    point=rs.intOpt(qew.point),
    member=rs.int(qew.member)
  )
      
  val qew = QuizEventWinner.syntax("qew")

  override val autoSession = AutoSession

  def findByEventId(eventId: Int)(implicit session: DBSession = autoSession): Option[QuizEventWinner] = {
    withSQL { 
      select.from(QuizEventWinner as qew).where.eq(qew.eventId, eventId)
    }.map(QuizEventWinner(qew.resultName)).single.apply()
  }

  def findByRoomId(roomId: Int)(implicit session: DBSession = autoSession): List[QuizEventWinner] = {
    withSQL { 
      select.from(QuizEventWinner as qew).where.eq(qew.roomId, roomId).orderBy(qew.eventId).desc
    }.map(QuizEventWinner(qew.resultName)).list.apply()
  }
   
}
