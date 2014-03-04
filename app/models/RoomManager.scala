package models

import models.entities.QuizRoom

class RoomManager {

  def getRoomInfo(id: Int): Option[RoomInfo] = {
    QuizRoom.find(id).map(RoomInfo.create(_))
  }
}

object RoomManager extends RoomManager