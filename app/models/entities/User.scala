package models.entities

import scalikejdbc._
import scalikejdbc.SQLInterpolation._
import org.joda.time.{DateTime}

case class User(
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

  def save()(implicit session: DBSession = User.autoSession): User = User.save(this)(session)

  def destroy()(implicit session: DBSession = User.autoSession): Unit = User.destroy(this)(session)

}
      

object User extends SQLSyntaxSupport[User] {

  override val tableName = "quiz_user"

  override val columns = Seq("id", "name", "twitter_id", "twitter_screen_name", "facebook_id", "facebook_screen_name", "image_url", "last_login", "created", "updated")

  def apply(u: ResultName[User])(rs: WrappedResultSet): User = new User(
    id = rs.int(u.id),
    name = rs.string(u.name),
    twitterId = rs.longOpt(u.twitterId),
    twitterScreenName = rs.stringOpt(u.twitterScreenName),
    facebookId = rs.longOpt(u.facebookId),
    facebookScreenName = rs.stringOpt(u.facebookScreenName),
    imageUrl = rs.string(u.imageUrl),
    lastLogin = rs.timestampOpt(u.lastLogin).map(_.toDateTime),
    created = rs.timestamp(u.created).toDateTime,
    updated = rs.timestamp(u.updated).toDateTime
  )
      
  val u = User.syntax("u")

  override val autoSession = AutoSession

  def find(id: Int)(implicit session: DBSession = autoSession): Option[User] = {
    withSQL { 
      select.from(User as u).where.eq(u.id, id)
    }.map(User(u.resultName)).single.apply()
  }
          
  def findAll()(implicit session: DBSession = autoSession): List[User] = {
    withSQL(select.from(User as u)).map(User(u.resultName)).list.apply()
  }
          
  def countAll()(implicit session: DBSession = autoSession): Long = {
    withSQL(select(sqls"count(1)").from(User as u)).map(rs => rs.long(1)).single.apply().get
  }
          
  def findAllBy(where: SQLSyntax)(implicit session: DBSession = autoSession): List[User] = {
    withSQL { 
      select.from(User as u).where.append(sqls"${where}")
    }.map(User(u.resultName)).list.apply()
  }
      
  def countBy(where: SQLSyntax)(implicit session: DBSession = autoSession): Long = {
    withSQL { 
      select(sqls"count(1)").from(User as u).where.append(sqls"${where}")
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
    updated: DateTime)(implicit session: DBSession = autoSession): User = {
    val generatedKey = withSQL {
      insert.into(User).columns(
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

    User(
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

  def save(entity: User)(implicit session: DBSession = autoSession): User = {
    withSQL { 
      update(User).set(
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
        
  def destroy(entity: User)(implicit session: DBSession = autoSession): Unit = {
    withSQL { delete.from(User).where.eq(column.id, entity.id) }.update.apply()
  }
        
}
