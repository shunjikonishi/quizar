package models

import play.api.libs.json._
import models.entities.QuizRoom
import org.joda.time.DateTime

import flect.websocket.Command
import flect.websocket.CommandHandler
import flect.websocket.CommandResponse

class RoomManager {

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

  val createCommand = new CommandHandler() {
    def handle(command: Command): CommandResponse = {
      val room = create(RoomInfo.fromJson(command.data))
      val data = JsObject(Seq(
          ("id", JsNumber(room.id))
        ))
      command.json(data)
    }
  }
}

object RoomManager extends RoomManager