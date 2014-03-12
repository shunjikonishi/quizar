package models

import play.api.libs.json._
import play.api.libs.iteratee.Iteratee
import play.api.libs.iteratee.Enumerator
import scala.concurrent.Future
import org.joda.time.DateTime
import scalikejdbc._
import scalikejdbc.SQLInterpolation._

import models.entities.QuizRoom
import models.entities.QuizEvent

import flect.websocket.Command
import flect.websocket.CommandHandler
import flect.websocket.CommandResponse
import flect.redis.Room
import flect.redis.RedisService

class RoomManager(redis: RedisService) extends flect.redis.RoomManager[RedisRoom](redis) {

  override protected def terminate() = {
    super.terminate()
    redis.close
  }
  
  private val (qr, qe) = (QuizRoom.qr, QuizEvent.qe)
  implicit val autoSession = AutoSession

  override protected def createRoom(name: String) = {
    val id = name.substring(5).toInt
    val info = getRoomInfo(id).get
    new RedisRoom(info, redis)
  }

  def getRoom(id: Int): RedisRoom = getRoom("room." + id)
  def join(id: Int): Future[(Iteratee[String,_], Enumerator[String])] = join("room." + id)

  def getRoomInfo(id: Int): Option[RoomInfo] = {
    QuizRoom.find(id).map(RoomInfo.create(_))
  }

  def create(room: RoomInfo): RoomInfo = {
    val now = new DateTime()
    val entity = QuizRoom.create(
      name=room.name,
      tags=room.tags,
      hashtag=room.hashtag,
      userQuiz=room.userQuiz,
      description=room.description,
      owner=room.owner,
      adminUsers=room.adminUsers,
      created=now,
      updated=now
    )
    RoomInfo.create(entity)
  }

  def update(room: RoomInfo): Boolean = {
    QuizRoom.find(room.id).map { entity =>
      entity.copy(
        name=room.name,
        tags=room.tags,
        hashtag=room.hashtag,
        userQuiz=room.userQuiz,
        description=room.description,
        adminUsers=room.adminUsers,
        updated= new DateTime()
      ).save();
      true;
    }.getOrElse(false)
  }

  def list(offset: Int, limit: Int): List[RoomInfo] = {
    withSQL { 
      select
        .from(QuizRoom as qr)
        .leftJoin(QuizEvent as qe).on(qr.id, qe.roomId)
        .where.isNull(qe.status).or.in(qe.status, Seq(EventStatus.Prepared.code, EventStatus.Running.code))
        .orderBy(sqls"COALESCE(qe.exec_date, qr.updated)").desc
        .limit(limit).offset(offset)
    }.map { rs =>
      val room = RoomInfo.create(QuizRoom(qr.resultName)(rs))
      val event = rs.intOpt(qe.resultName.roomId).map(_ => EventInfo.create(QuizEvent(qe.resultName)(rs)))
      event.map(room.withEvent(_)).getOrElse(room)
    }.list.apply
  }

  val createCommand = CommandHandler { command =>
    val room = create(RoomInfo.fromJson(command.data))
    command.json(room.toJson)
  }

  val updateCommand = CommandHandler { command =>
    update(RoomInfo.fromJson(command.data))
    command.text("OK")
  }

  val getCommand = CommandHandler { command =>
    val id = command.data.as[Int]
    val room = getRoomInfo(id)
    val data = room.map(_.toJson).getOrElse(JsNull)
    command.json(data)
  }

  val listCommand = CommandHandler { command =>
    val limit = (command.data \ "limit").as[Int]
    val offset = (command.data \ "offset").as[Int]
    val data = list(offset, limit).map(_.toJson)
    command.json(JsArray(data))
  }
}

object RoomManager extends RoomManager(MyRedisService)
