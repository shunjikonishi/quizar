package models.sqlviews

import play.api.libs.json._
import scalikejdbc._
import scalikejdbc.SQLInterpolation._

case class QuizRanking(
  eventId: Int, 
  userId: Int, 
  username: String, 
  imageUrl: String, 
  correctCount:Int,
  wrongCount: Int,
  time: Long
) {

  def toJson = Json.toJson(this)(QuizRanking.format)
  override def toString = toJson.toString
}

object QuizRanking extends SQLSyntaxSupport[QuizRanking] {

  implicit val format = Json.format[QuizRanking]

  override val tableName = "quiz_ranking"

  override val columns = Seq("event_id", "user_id", "username", "image_url", "correct_count", "wrong_count", "time")

  def create(qr: ResultName[QuizRanking])(rs: WrappedResultSet): QuizRanking = new QuizRanking(
    eventId = rs.int(qr.eventId),
    userId = rs.int(qr.userId),
    username = rs.string(qr.username),
    imageUrl = rs.string(qr.imageUrl),
    correctCount = rs.int(qr.correctCount),
    wrongCount = rs.int(qr.wrongCount),
    time = rs.long(qr.time)
  )
      
  val qr = QuizRanking.syntax("qr")

  override val autoSession = AutoSession

  def findByEventId(eventId: Int, limit: Int)(implicit session: DBSession = autoSession): List[QuizRanking] = {
    withSQL { 
      select.from(QuizRanking as qr).where.eq(qr.eventId, eventId).orderBy(sqls"correct_count desc, time asc").limit(limit)
    }.map(create(qr.resultName)).list.apply()
  }
   
}
