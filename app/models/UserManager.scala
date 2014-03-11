package models

import play.api.libs.json._
import scalikejdbc.DBSession
import scalikejdbc.AutoSession
import scalikejdbc.SQLInterpolation.withSQL
import scalikejdbc.SQLInterpolation.select
import twitter4j.{User => TwitterUser}
import org.joda.time.{DateTime}
import models.entities.User

import flect.websocket.CommandHandler

class UserManager {

  private val u = User.u

  def findByTwitterId(id: Long)(implicit session: DBSession = AutoSession): Option[User] = {
    withSQL { 
      select.from(User as u).where.eq(u.twitterId, id)
    }.map(User(u.resultName)).single.apply()
  }

  def getUserById(id: Int) = User.find(id).getOrElse(throw new IllegalArgumentException())

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

  val getCommand = CommandHandler { command =>
    val id = command.data.as[Int]
    val user = getUserById(id)
    command.json(UserInfo.create(user).toJson)
  }
}

object UserManager extends UserManager
