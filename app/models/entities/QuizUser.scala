package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class QuizUser(
  id: Int, 
  name: String, 
  twitterId: Option[Long] = None, 
  twitterScreenName: Option[String] = None, 
  facebookId: Option[Long] = None, 
  facebookScreenName: Option[String] = None, 
  imageUrl: String, 
  lastLogin: Option[DateTime] = None, 
  created: DateTime, 
  updated: DateTime) {

  def save()(implicit session: DBSession = QuizUser.autoSession): QuizUser = QuizUser.save(this)(session)

  def destroy()(implicit session: DBSession = QuizUser.autoSession): Unit = QuizUser.destroy(this)(session)

}
      

object QuizUser extends SQLSyntaxSupport[QuizUser] {

  override val tableName = "quiz_user"

  override val columns = Seq("id", "name", "twitter_id", "twitter_screen_name", "facebook_id", "facebook_screen_name", "image_url", "last_login", "created", "updated")

  def apply(qu: ResultName[QuizUser])(rs: WrappedResultSet): QuizUser = new QuizUser(
    id = rs.int(qu.id),
    name = rs.string(qu.name),
    twitterId = rs.longOpt(qu.twitterId),
    twitterScreenName = rs.stringOpt(qu.twitterScreenName),
    facebookId = rs.longOpt(qu.facebookId),
    facebookScreenName = rs.stringOpt(qu.facebookScreenName),
    imageUrl = rs.string(qu.imageUrl),
    lastLogin = rs.timestampOpt(qu.lastLogin).map(_.toDateTime),
    created = rs.timestamp(qu.created).toDateTime,
    updated = rs.timestamp(qu.updated).toDateTime
  )
      
  val qu = QuizUser.syntax("qu")

  override val autoSession = AutoSession

  def find(id: Int)(implicit session: DBSession = autoSession): Option[QuizUser] = {
    withSQL { 
      select.from(QuizUser as qu).where.eq(qu.id, id)
    }.map(QuizUser(qu.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[QuizUser] = {
    withSQL(select.from(QuizUser as qu)).map(QuizUser(qu.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(QuizUser as qu)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[QuizUser] = {
    withSQL { 
      select.from(QuizUser as qu).where.append(sqls"${where}")
    }.map(QuizUser(qu.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(QuizUser as qu).where.append(sqls"${where}")
    }.map(_.long(1)).single.apply().get
  }
      
  def create(
    name: String,
    twitterId: Option[Long] = None,
    twitterScreenName: Option[String] = None,
    facebookId: Option[Long] = None,
    facebookScreenName: Option[String] = None,
    imageUrl: String,
    lastLogin: Option[DateTime] = None,
    created: DateTime,
    updated: DateTime)(implicit session: DBSession = autoSession): QuizUser = {
    val generatedKey = withSQL {
      insert.into(QuizUser).columns(
        column.name,
        column.twitterId,
        column.twitterScreenName,
        column.facebookId,
        column.facebookScreenName,
        column.imageUrl,
        column.lastLogin,
        column.created,
        column.updated
      ).values(
        name,
        twitterId,
        twitterScreenName,
        facebookId,
        facebookScreenName,
        imageUrl,
        lastLogin,
        created,
        updated
      )
    }.updateAndReturnGeneratedKey.apply()

    QuizUser(
      id = generatedKey.toInt, 
      name = name,
      twitterId = twitterId,
      twitterScreenName = twitterScreenName,
      facebookId = facebookId,
      facebookScreenName = facebookScreenName,
      imageUrl = imageUrl,
      lastLogin = lastLogin,
      created = created,
      updated = updated)
  }

  def save(entity: QuizUser)(implicit session: DBSession = autoSession): QuizUser = {
    withSQL { 
      update(QuizUser).set(
        column.id -> entity.id,
        column.name -> entity.name,
        column.twitterId -> entity.twitterId,
        column.twitterScreenName -> entity.twitterScreenName,
        column.facebookId -> entity.facebookId,
        column.facebookScreenName -> entity.facebookScreenName,
        column.imageUrl -> entity.imageUrl,
        column.lastLogin -> entity.lastLogin,
        column.created -> entity.created,
        column.updated -> entity.updated
      ).where.eq(column.id, entity.id)
    }.update.apply()
    entity 
  }
        
  def destroy(entity: QuizUser)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(QuizUser).where.eq(column.id, entity.id) }.update.apply()
  }
        
}
