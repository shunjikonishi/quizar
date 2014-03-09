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
  private val room: Option[RedisRoom] = {
    session.roomId.map { roomId =>
      Await.result(rm.join(roomId), Duration.Inf)
      val ret = rm.getRoom(roomId)
      val i = Iteratee.foreach[CommandResponse] { res =>
        filterRedisMessage(res).foreach(s => channel.push(s.toString))
      }
      ret.commandOut(i)

      addHandler("member", ret.memberCommand)
      ret.incMember
      ret
    }
  }

  private def filterRedisMessage(res: CommandResponse) = {
    Some(res)
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
    addHandler("getRoom", RoomManager.getCommand)
    addHandler("tweet") { c =>
      room.foreach { room =>
        val userId = (c.data \ "userId").as[Int]
        val msg = (c.data \ "msg").as[String]
        val withTwitter = (c.data \ "twitter").as[Boolean]
        val img = session.user.map(_.imageUrl).getOrElse("#")
        room.channel.send(new CommandResponse("chat", "json", 
          JsObject(Seq(
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