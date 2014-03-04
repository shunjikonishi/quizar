package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizRoom(
  id: Int, 
  name: String, 
  tags: Option[String] = None, 
  hashtag: Option[String] = None, 
  userQuiz: Boolean, 
  description: Option[String] = None, 
  owner: Int, 
  created: DateTime, 
  updated: DateTime) {

  def save()(implicit session: DBSession = QuizRoom.autoSession): QuizRoom = QuizRoom.save(this)(session)

  def destroy()(implicit session: DBSession = QuizRoom.autoSession): Unit = QuizRoom.destroy(this)(session)

}
      

object QuizRoom extends SQLSyntaxSupport[QuizRoom] {

  override val tableName = "quiz_room"

  override val columns = Seq("id", "name", "tags", "hashtag", "user_quiz", "description", "owner", "created", "updated")

  def apply(qr: ResultName[QuizRoom])(rs: WrappedResultSet): QuizRoom = new QuizRoom(
    id = rs.int(qr.id),
    name = rs.string(qr.name),
    tags = rs.stringOpt(qr.tags),
    hashtag = rs.stringOpt(qr.hashtag),
    userQuiz = rs.boolean(qr.userQuiz),
    description = rs.stringOpt(qr.description),
    owner = rs.int(qr.owner),
    created = rs.timestamp(qr.created).toDateTime,
    updated = rs.timestamp(qr.updated).toDateTime
  )
      
  val qr = QuizRoom.syntax("qr")

  override val autoSession = AutoSession

  def find(id: Int)(implicit session: DBSession = autoSession): Option[QuizRoom] = {
    withSQL { 
      select.from(QuizRoom as qr).where.eq(qr.id, id)
    }.map(QuizRoom(qr.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[QuizRoom] = {
    withSQL(select.from(QuizRoom as qr)).map(QuizRoom(qr.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(QuizRoom as qr)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[QuizRoom] = {
    withSQL { 
      select.from(QuizRoom as qr).where.append(sqls"${where}")
    }.map(QuizRoom(qr.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(QuizRoom as qr).where.append(sqls"${where}")
    }.map(_.long(1)).single.apply().get
  }
      
  def create(
    name: String,
    tags: Option[String] = None,
    hashtag: Option[String] = None,
    userQuiz: Boolean,
    description: Option[String] = None,
    owner: Int,
    created: DateTime,
    updated: DateTime)(implicit session: DBSession = autoSession): QuizRoom = {
    val generatedKey = withSQL {
      insert.into(QuizRoom).columns(
        column.name,
        column.tags,
        column.hashtag,
        column.userQuiz,
        column.description,
        column.owner,
        column.created,
        column.updated
      ).values(
        name,
        tags,
        hashtag,
        userQuiz,
        description,
        owner,
        created,
        updated
      )
    }.updateAndReturnGeneratedKey.apply()

    QuizRoom(
      id = generatedKey.toInt, 
      name = name,
      tags = tags,
      hashtag = hashtag,
      userQuiz = userQuiz,
      description = description,
      owner = owner,
      created = created,
      updated = updated)
  }

  def save(entity: QuizRoom)(implicit session: DBSession = autoSession): QuizRoom = {
    withSQL { 
      update(QuizRoom).set(
        column.id -> entity.id,
        column.name -> entity.name,
        column.tags -> entity.tags,
        column.hashtag -> entity.hashtag,
        column.userQuiz -> entity.userQuiz,
        column.description -> entity.description,
        column.owner -> entity.owner,
        column.created -> entity.created,
        column.updated -> entity.updated
      ).where.eq(column.id, entity.id)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizRoom)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizRoom).where.eq(column.id, entity.id) }.update.apply()
  }
        
}
