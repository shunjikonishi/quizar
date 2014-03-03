package models

import scalikejdbc.DBSession
import scalikejdbc.AutoSession
import scalikejdbc.SQLInterpolation.withSQL
import scalikejdbc.SQLInterpolation.select
import twitter4j.{User => TwitterUser}
import org.joda.time.{DateTime}
import models.entities.User

class UserManager {

  private val u = User.u

  def findByTwitterId(id: Long)(implicit session: DBSession = AutoSession): Option[User] = {
    withSQL { 
      select.from(User as u).where.eq(u.twitterId, id)
    }.map(User(u.resultName)).single.apply()
  }

  def getUserByTwitter(tu: TwitterUser): User = {
    val now = new DateTime()
    findByTwitterId(tu.getId).map { u =>
      val user = u.copy(
        name = "@" + tu.getScreenName,
        twitterScreenName = Some(tu.getScreenName),
        imageUrl = tu.getMiniProfileImageURL,
        lastLogin = Some(now)
      )
      user.save()
      user
    }.getOrElse {
      User.create(
        name = "@" + tu.getScreenName,
        twitterId = Some(tu.getId),
        twitterScreenName = Some(tu.getScreenName),
        imageUrl = tu.getMiniProfileImageURL,
        lastLogin = Some(now),
        created = now,
        updated = now
      )
    }
  }
}

object UserManager extends UserManager
