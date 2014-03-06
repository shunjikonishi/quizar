package models

import play.api.libs.json.JsNull
import models.entities.QuizRoom
import org.joda.time.DateTime

import flect.websocket.Command
import flect.websocket.CommandHandler
import flect.websocket.CommandResponse
import flect.redis.Room
import flect.redis.RedisService

class RoomManager(redis: RedisService) extends flect.redis.RoomManager[Room](redis) {

  override protected def createRoom(name: String) = new Room(name, redis)
  override protected def terminate() = {
    super.terminate()
    redis.close
  }
  
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

  val createCommand = CommandHandler { command =>
    val room = create(RoomInfo.fromJson(command.data))
    command.json(room.toJsObject)
  }

  val updateCommand = CommandHandler { command =>
    update(RoomInfo.fromJson(command.data))
    command.text("OK")
  }

  val getCommand = CommandHandler { command =>
    val id = (command.data \ "id").as[Int]
    val room = getRoomInfo(id)
    val data = room.map(_.toJsObject).getOrElse(JsNull)
    command.json(data)
  }
}

object RoomManager extends RoomManager(MyRedisService)
