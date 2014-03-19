package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._

case class QuizAnswerCount(
  eventId: Int,
  publishId: Int,
  questionId: Int,
  answer1: Int,
  answer2: Int,
  answer3: Int,
  answer4: Int,
  answer5: Int,
  correctCount: Int,
  wrongCount: Int
)

object QuizAnswerCount extends SQLSyntaxSupport[QuizAnswerCount] {

  override val tableName = "quiz_answer_count"

  override val columns = Seq("event_id", "publish_id", "question_id", "answer1", "answer2", "answer3", "answer4", "answer5", "correct_count", "wrong_count")

  def apply(qac: ResultName[QuizAnswerCount])(rs: WrappedResultSet): QuizAnswerCount = new QuizAnswerCount(
    eventId=rs.int(qac.eventId),
    publishId=rs.int(qac.publishId),
    questionId=rs.int(qac.questionId),
    answer1=rs.int(qac.answer1),
    answer2=rs.int(qac.answer2),
    answer3=rs.int(qac.answer3),
    answer4=rs.int(qac.answer4),
    answer5=rs.int(qac.answer5),
    correctCount = rs.int(qac.correctCount),
    wrongCount = rs.int(qac.wrongCount)
  )
      
  val qac = QuizAnswerCount.syntax("qac")

  override val autoSession = AutoSession

  def findByPublishId(publishId: Int)(implicit session: DBSession = autoSession): Option[QuizAnswerCount] = {
    withSQL { 
      select.from(QuizAnswerCount as qac).where.eq(qac.publishId, publishId)
    }.map(QuizAnswerCount(qac.resultName)).single.apply()
  }

  def findByEventId(eventId: Int)(implicit session: DBSession = autoSession): List[QuizAnswerCount] = {
    withSQL { 
      select.from(QuizAnswerCount as qac).where.eq(qac.eventId, eventId)
    }.map(QuizAnswerCount(qac.resultName)).list.apply()
  }
   
}
