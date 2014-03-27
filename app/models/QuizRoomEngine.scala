package models

import play.api.libs.json._
import play.api.libs.iteratee.Iteratee
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.concurrent.Await
import scala.concurrent.duration.Duration

import flect.websocket.CommandInvoker
import flect.websocket.CommandHandler
import flect.websocket.CommandResponse

class QuizRoomEngine(session: SessionInfo) extends CommandInvoker {

  private val rm = RoomManager

  private val userId = session.user.map(_.id).getOrElse(0)

  private val room: Option[RedisRoom] = {
    session.roomId.map { roomId =>
      Await.result(rm.join(roomId), Duration.Inf)
      val room = rm.getRoom(roomId)
      val roomAdmin = room.roomInfo.isAdmin(userId)
      val i = Iteratee.foreach[CommandResponse] { res =>
        filterRedisMessage(res).foreach(s => channel.push(s.toString))
      }
      room.commandOut(i)

      val qm = room.questionManager
      addHandler("listQuestion", qm.listCommand)
      addHandler("countQuestion", qm.countCommand)
      addHandler("updateQuestion", qm.updateCommand)
      addHandler("createQuestion", qm.createCommand)

      val em = room.eventManager
      addHandler("createEvent", em.createCommand)
      addHandler("updateEvent", em.updateCommand)
      addHandler("getEvent", em.getCommand)
      addHandler("getCurrentEvent", em.getCurrentCommand)
      addHandler("entryEvent", em.entryCommand)
      addHandler("openEvent", em.openCommand)
      addHandler("closeEvent", em.closeCommand)
      addHandler("publishQuestion", em.publishCommand)
      addHandler("answer", em.answerCommand)

      addHandler("member", room.memberCommand)
      room.incMember
      room
    }
  }

  private def filterRedisMessage(res: CommandResponse): Option[CommandResponse] = {
    def filterCreateQuestion(res: CommandResponse) = {
      val createdBy = (res.data \ "createdBy").as[Int]
      if (createdBy == userId) {
        Some(res)
      } else if (room.map(_.roomInfo.isAdmin(userId)).getOrElse(false)) {
        Some(new CommandResponse("postQuestion", JsNumber(createdBy)))
      } else {
        None
      }
    }
    if (res.name == "createQuestion") {
      filterCreateQuestion(res)
    } else {
      Some(res)
    }
  }

  protected override def onDisconnect: Unit = {
    room.foreach { room =>
      room.decMember
      room.quit
    }
  }

  private def init = {
    addHandler("template", TemplateManager(session))
    addHandler("noop") { c => CommandResponse.None}
    addHandler("makeRoom", RoomManager.createCommand)
    addHandler("updateRoom", RoomManager.updateCommand)
    addHandler("listRoom", RoomManager.listCommand)
    addHandler("entriedRooms", RoomManager.entriedRoomsCommand)
    addHandler("ownedRooms", RoomManager.ownedRoomsCommand)
    addHandler("getRoom", RoomManager.getCommand)
    addHandler("getEventRanking", RoomManager.eventRankingCommand)
    addHandler("getEventWinners", RoomManager.eventWinnersCommand)
    addHandler("getTotalRanking", RoomManager.totalRankingCommand)
    addHandler("getUserTotalRanking", RoomManager.userTotalRankingCommand)
    addHandler("getUserEvent", RoomManager.userEventCommand)
    addHandler("getPublishedQuestions", RoomManager.publishedQuestionsCommand)
    addHandler("getEventQuestions", RoomManager.eventQuestionsCommand)
    addHandler("getMemberCount", RoomManager.memberCountCommand)
    addHandler("getLookback", RoomManager.lookbackCommand)
    addHandler("getEventWithCount", RoomManager.eventWithCountCommand)
    addHandler("getUser", UserManager.getCommand)
    addHandler("updateUser", updateUserCommand)
    addHandler("tweet") { c =>
      room.foreach { room =>
        val username = session.user.map(_.name).get
        val msg = (c.data \ "msg").as[String]
        val withTwitter = (c.data \ "twitter").as[Boolean]
        val img = session.user.map(_.imageUrl).getOrElse("#")
        room.channel.send(new CommandResponse("chat", 
          JsObject(Seq(
            ("userId", JsNumber(userId)),
            ("username", JsString(username)),
            ("msg", JsString(msg)),
            ("img", JsString(img))
          ))
        ).toString)
        if (withTwitter) {
          session.twitterInfo.foreach { t =>
            val twitter = TwitterManager.fromAccessToken(t.token, t.secret)
            twitter.updateStatus(msg)
          }
        }
      }
      CommandResponse.None
    }
  }

  val updateUserCommand = CommandHandler { command =>
    val id = (command.data \ "userId").as[Int]
    val name = (command.data \ "name").as[String]
    val ret = UserManager.update(id, name)
    if (ret) {
      val newSession = session.copy(
        user=session.user.map(_.copy(name=name))
      )
      SessionManager.set(newSession.id, newSession)
    }
    command.json(JsBoolean(ret))
  }
  
  init
}