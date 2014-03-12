package models

import play.api.libs.json._
import play.api.libs.iteratee.Iteratee
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.concurrent.Await
import scala.concurrent.duration.Duration

import flect.websocket.CommandInvoker
import flect.websocket.CommandResponse

class QuizRoomEngine(session: SessionInfo) extends CommandInvoker {

  private val rm = RoomManager

  init
  private val userId = session.user.map(_.id).getOrElse(0)

  private val room: Option[RedisRoom] = {
    session.roomId.map { roomId =>
      Await.result(rm.join(roomId), Duration.Inf)
      val room = rm.getRoom(roomId)
      val i = Iteratee.foreach[CommandResponse] { res =>
        filterRedisMessage(res).foreach(s => channel.push(s.toString))
      }
      room.commandOut(i)

      val qm = QuestionManager(roomId)
      addHandler("listQuestion", qm.listCommand)
      addHandler("countQuestion", qm.countCommand)
      addHandler("updateQuestion", qm.updateCommand)
      addHandler("createQuestion") { command =>
        val q = qm.create(QuestionInfo.fromJson(command.data))
        val res = command.json(q.toJson)
        room.channel.send(res.toString)
        None
      }
      val em = EventManager(roomId)
      addHandler("createEvent", em.createCommand)
      addHandler("updateEvent", em.updateCommand)
      addHandler("getEvent", em.getCommand)
      addHandler("openEvent") { command =>
        val id = command.data.as[Int]
        val ret = em.open(id)
        if (ret) {
          Some(new CommandResponse("openEvent", JsNumber(id)))
        } else {
          None
        }
      }

      addHandler("member", room.memberCommand)
      room.incMember
      room
    }
  }

  private def filterRedisMessage(res: CommandResponse) = {
    def filterCreateQuestion(res: CommandResponse) = {
      val createdBy = (res.data \ "createdBy").as[Int]
      if (createdBy == userId) {
        Some(res)
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
    addHandler("noop") { c => None}
    addHandler("makeRoom", RoomManager.createCommand)
    addHandler("updateRoom", RoomManager.updateCommand)
    addHandler("listRoom", RoomManager.listCommand)
    addHandler("getRoom", RoomManager.getCommand)
    addHandler("getUser", UserManager.getCommand)
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
      None
    }
  }
}