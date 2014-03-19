package models.sqlviews

import play.api.libs.json._
import scalikejdbc._
import scalikejdbc.SQLInterpolation._

case class QuizTotalRanking(
  roomId: Int, 
  userId: Int, 
  username: String, 
  imageUrl: String, 
  point: Int,
  correctCount:Int,
  wrongCount: Int,
  time: Long
) {

  def toJson = Json.toJson(this)(QuizTotalRanking.format)
  override def toString = toJson.toString
}

object QuizTotalRanking extends SQLSyntaxSupport[QuizTotalRanking] {

  implicit val format = Json.format[QuizTotalRanking]

  override val tableName = "quiz_total_ranking"

  override val columns = Seq("room_id", "user_id", "username", "image_url", "point", "correct_count", "wrong_count", "time")

  def create(qtr: ResultName[QuizTotalRanking])(rs: WrappedResultSet): QuizTotalRanking = new QuizTotalRanking(
    roomId = rs.int(qtr.roomId),
    userId = rs.int(qtr.userId),
    username = rs.string(qtr.username),
    imageUrl = rs.string(qtr.imageUrl),
    point = rs.int(qtr.point),
    correctCount = rs.int(qtr.correctCount),
    wrongCount = rs.int(qtr.wrongCount),
    time = rs.long(qtr.time)
  )
      
  val qtr = QuizTotalRanking.syntax("qtr")

  override val autoSession = AutoSession

  def findByRoomId(roomId: Int, limit: Int)(implicit session: DBSession = autoSession): List[QuizTotalRanking] = {
    withSQL { 
      select.from(QuizTotalRanking as qtr).where.eq(qtr.roomId, roomId).orderBy(sqls"point desc, correct_count desc, time asc").limit(limit)
    }.map(create(qtr.resultName)).list.apply()
  }
   
}
