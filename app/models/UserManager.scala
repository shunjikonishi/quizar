package models

import play.api.libs.json._
import scalikejdbc.DBSession
import scalikejdbc.AutoSession
import scalikejdbc.SQLInterpolation.withSQL
import scalikejdbc.SQLInterpolation.select
import twitter4j.{User => TwitterUser}
import org.joda.time.{DateTime}
import models.entities.QuizUser

import flect.websocket.CommandHandler

class UserManager {

  private val qu = QuizUser.qu

  def findByTwitterId(id: Long)(implicit session: DBSession = AutoSession): Option[QuizUser] = {
    withSQL { 
      select.from(QuizUser as qu).where.eq(qu.twitterId, id)
    }.map(QuizUser(qu.resultName)).single.apply()
  }

  def getUserById(id: Int) = QuizUser.find(id).getOrElse(throw new IllegalArgumentException())

  def getUserByTwitter(tu: TwitterUser): QuizUser = {
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
      QuizUser.create(
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
