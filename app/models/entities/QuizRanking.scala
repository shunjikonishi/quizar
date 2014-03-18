package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._

case class QuizRanking(
  eventId: Option[Int] = None, 
  userId: Option[Int] = None, 
  username: Option[String] = None, 
  imageUrl: Option[String] = None, 
  correctCount: Option[Long] = None, 
  time: Option[Long] = None) {

  def save()(implicit session: DBSession = QuizRanking.autoSession): QuizRanking = QuizRanking.save(this)(session)

  def destroy()(implicit session: DBSession = QuizRanking.autoSession): Unit = QuizRanking.destroy(this)(session)

}
      

object QuizRanking extends SQLSyntaxSupport[QuizRanking] {

  override val tableName = "quiz_ranking"

  override val columns = Seq("event_id", "user_id", "username", "image_url", "correct_count", "time")

  def apply(qr: ResultName[QuizRanking])(rs: WrappedResultSet): QuizRanking = new QuizRanking(
    eventId = rs.intOpt(qr.eventId),
    userId = rs.intOpt(qr.userId),
    username = rs.stringOpt(qr.username),
    imageUrl = rs.stringOpt(qr.imageUrl),
    correctCount = rs.longOpt(qr.correctCount),
    time = rs.longOpt(qr.time)
  )
      
  val qr = QuizRanking.syntax("qr")

  override val autoSession = AutoSession

  def find(eventId: Option[Int], userId: Option[Int], username: Option[String], imageUrl: Option[String], correctCount: Option[Long], time: Option[Long])(implicit session: DBSession = autoSession): Option[QuizRanking] = {
    withSQL { 
      select.from(QuizRanking as qr).where.eq(qr.eventId, eventId).and.eq(qr.userId, userId).and.eq(qr.username, username).and.eq(qr.imageUrl, imageUrl).and.eq(qr.correctCount, correctCount).and.eq(qr.time, time)
    }.map(QuizRanking(qr.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[QuizRanking] = {
    withSQL(select.from(QuizRanking as qr)).map(QuizRanking(qr.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(QuizRanking as qr)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[QuizRanking] = {
    withSQL { 
      select.from(QuizRanking as qr).where.append(sqls"${where}")
    }.map(QuizRanking(qr.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(QuizRanking as qr).where.append(sqls"${where}")
    }.map(_.long(1)).single.apply().get
  }
      
  def create(
    eventId: Option[Int] = None,
    userId: Option[Int] = None,
    username: Option[String] = None,
    imageUrl: Option[String] = None,
    correctCount: Option[Long] = None,
    time: Option[Long] = None)(implicit session: DBSession = autoSession): QuizRanking = {
    withSQL {
      insert.into(QuizRanking).columns(
        column.eventId,
        column.userId,
        column.username,
        column.imageUrl,
        column.correctCount,
        column.time
      ).values(
        eventId,
        userId,
        username,
        imageUrl,
        correctCount,
        time
      )
    }.update.apply()

    QuizRanking(
      eventId = eventId,
      userId = userId,
      username = username,
      imageUrl = imageUrl,
      correctCount = correctCount,
      time = time)
  }

  def save(entity: QuizRanking)(implicit session: DBSession = autoSession): QuizRanking = {
    withSQL { 
      update(QuizRanking).set(
        column.eventId -> entity.eventId,
        column.userId -> entity.userId,
        column.username -> entity.username,
        column.imageUrl -> entity.imageUrl,
        column.correctCount -> entity.correctCount,
        column.time -> entity.time
      ).where.eq(column.eventId, entity.eventId).and.eq(column.userId, entity.userId).and.eq(column.username, entity.username).and.eq(column.imageUrl, entity.imageUrl).and.eq(column.correctCount, entity.correctCount).and.eq(column.time, entity.time)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizRanking)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizRanking).where.eq(column.eventId, entity.eventId).and.eq(column.userId, entity.userId).and.eq(column.username, entity.username).and.eq(column.imageUrl, entity.imageUrl).and.eq(column.correctCount, entity.correctCount).and.eq(column.time, entity.time) }.update.apply()
  }
        
}
