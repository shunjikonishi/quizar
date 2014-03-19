package models.sqlviews

import play.api.libs.json._
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
  imageUrl: Option[String],
  correctCount: Option[Int],
  wrongCount: Option[Int],
  time: Option[Long],
  member: Int
) {

  def toJson = Json.toJson(this)(QuizEventWinner.format)
  override def toString = toJson.toString
}

object QuizEventWinner extends SQLSyntaxSupport[QuizEventWinner] {

  implicit val format = Json.format[QuizEventWinner]

  override val tableName = "quiz_event_winner"

  override val columns = Seq("room_id", "event_id", "exec_date", "title", "user_id", "username", "image_url", "correct_count", "wrong_count", "time", "member")

  def create(qew: ResultName[QuizEventWinner])(rs: WrappedResultSet): QuizEventWinner = new QuizEventWinner(
    roomId=rs.int(qew.roomId),
    eventId=rs.int(qew.eventId),
    execDate=rs.timestamp(qew.execDate).toDateTime,
    title=rs.string(qew.title),
    userId=rs.intOpt(qew.userId),
    username=rs.stringOpt(qew.username),
    imageUrl=rs.stringOpt(qew.imageUrl),
    correctCount=rs.intOpt(qew.correctCount),
    wrongCount=rs.intOpt(qew.wrongCount),
    time=rs.longOpt(qew.time),
    member=rs.int(qew.member)
  )
      
  val qew = QuizEventWinner.syntax("qew")

  override val autoSession = AutoSession

  def findByEventId(eventId: Int)(implicit session: DBSession = autoSession): Option[QuizEventWinner] = {
    withSQL { 
      select.from(QuizEventWinner as qew).where.eq(qew.eventId, eventId)
    }.map(create(qew.resultName)).single.apply()
  }

  def findByRoomId(roomId: Int)(implicit session: DBSession = autoSession): List[QuizEventWinner] = {
    withSQL { 
      select.from(QuizEventWinner as qew).where.eq(qew.roomId, roomId).orderBy(qew.eventId).desc
    }.map(create(qew.resultName)).list.apply()
  }
   
}
