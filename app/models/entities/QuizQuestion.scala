package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizQuestion(
  id: Int, 
  roomId: Int, 
  createdBy: Int, 
  question: String, 
  answers: String, 
  answerType: Short, 
  tags: Option[String] = None, 
  description: Option[String] = None, 
  relatedUrl: Option[String] = None, 
  publishCount: Int, 
  correctCount: Int, 
  wrongCount: Int, 
  created: DateTime, 
  updated: DateTime) {

  def save()(implicit session: DBSession = QuizQuestion.autoSession): QuizQuestion = QuizQuestion.save(this)(session)

  def destroy()(implicit session: DBSession = QuizQuestion.autoSession): Unit = QuizQuestion.destroy(this)(session)

}
      

object QuizQuestion extends SQLSyntaxSupport[QuizQuestion] {

  override val tableName = "quiz_question"

  override val columns = Seq("id", "room_id", "created_by", "question", "answers", "answer_type", "tags", "description", "related_url", "publish_count", "correct_count", "wrong_count", "created", "updated")

  def apply(qq: ResultName[QuizQuestion])(rs: WrappedResultSet): QuizQuestion = new QuizQuestion(
    id = rs.int(qq.id),
    roomId = rs.int(qq.roomId),
    createdBy = rs.int(qq.createdBy),
    question = rs.string(qq.question),
    answers = rs.string(qq.answers),
    answerType = rs.short(qq.answerType),
    tags = rs.stringOpt(qq.tags),
    description = rs.stringOpt(qq.description),
    relatedUrl = rs.stringOpt(qq.relatedUrl),
    publishCount = rs.int(qq.publishCount),
    correctCount = rs.int(qq.correctCount),
    wrongCount = rs.int(qq.wrongCount),
    created = rs.timestamp(qq.created).toDateTime,
    updated = rs.timestamp(qq.updated).toDateTime
  )
      
  val qq = QuizQuestion.syntax("qq")

  override val autoSession = AutoSession

  def find(id: Int)(implicit session: DBSession = autoSession): Option[QuizQuestion] = {
    withSQL { 
      select.from(QuizQuestion as qq).where.eq(qq.id, id)
    }.map(QuizQuestion(qq.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[QuizQuestion] = {
    withSQL(select.from(QuizQuestion as qq)).map(QuizQuestion(qq.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(QuizQuestion as qq)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[QuizQuestion] = {
    withSQL { 
      select.from(QuizQuestion as qq).where.append(sqls"${where}")
    }.map(QuizQuestion(qq.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(QuizQuestion as qq).where.append(sqls"${where}")
    }.map(_.long(1)).single.apply().get
  }
      
  def create(
    roomId: Int,
    createdBy: Int,
    question: String,
    answers: String,
    answerType: Short,
    tags: Option[String] = None,
    description: Option[String] = None,
    relatedUrl: Option[String] = None,
    publishCount: Int,
    correctCount: Int,
    wrongCount: Int,
    created: DateTime,
    updated: DateTime)(implicit session: DBSession = autoSession): QuizQuestion = {
    val generatedKey = withSQL {
      insert.into(QuizQuestion).columns(
        column.roomId,
        column.createdBy,
        column.question,
        column.answers,
        column.answerType,
        column.tags,
        column.description,
        column.relatedUrl,
        column.publishCount,
        column.correctCount,
        column.wrongCount,
        column.created,
        column.updated
      ).values(
        roomId,
        createdBy,
        question,
        answers,
        answerType,
        tags,
        description,
        relatedUrl,
        publishCount,
        correctCount,
        wrongCount,
        created,
        updated
      )
    }.updateAndReturnGeneratedKey.apply()

    QuizQuestion(
      id = generatedKey.toInt, 
      roomId = roomId,
      createdBy = createdBy,
      question = question,
      answers = answers,
      answerType = answerType,
      tags = tags,
      description = description,
      relatedUrl = relatedUrl,
      publishCount = publishCount,
      correctCount = correctCount,
      wrongCount = wrongCount,
      created = created,
      updated = updated)
  }

  def save(entity: QuizQuestion)(implicit session: DBSession = autoSession): QuizQuestion = {
    withSQL { 
      update(QuizQuestion).set(
        column.id -> entity.id,
        column.roomId -> entity.roomId,
        column.createdBy -> entity.createdBy,
        column.question -> entity.question,
        column.answers -> entity.answers,
        column.answerType -> entity.answerType,
        column.tags -> entity.tags,
        column.description -> entity.description,
        column.relatedUrl -> entity.relatedUrl,
        column.publishCount -> entity.publishCount,
        column.correctCount -> entity.correctCount,
        column.wrongCount -> entity.wrongCount,
        column.created -> entity.created,
        column.updated -> entity.updated
      ).where.eq(column.id, entity.id)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizQuestion)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizQuestion).where.eq(column.id, entity.id) }.update.apply()
  }
        
}
