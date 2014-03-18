package models

import play.api.libs.json.Json
import play.api.mvc.RequestHeader

case class PageParams(
  uri: String,
  debug: Boolean,
  userId: Option[Int] = None,
  username: Option[String] = None,
  userImage: Option[String] = None,
  roomId: Option[Int] = None,
  roomAdmin: Option[Boolean] = None,
  eventAdmin: Option[Boolean] = None,
  userQuiz: Option[Boolean] = None,
  hashtag: Option[String] = None,
  eventId : Option[Int] = None,
  eventStatus: Option[Int] = None,
  userEventId: Option[Int] = None
) {
  def withUser(user: UserInfo): PageParams= {
    copy(
      userId=Some(user.id),
      username=Some(user.name),
      userImage=Some(user.imageUrl)
    )
  }
  def withRoom(room: RoomInfo): PageParams = {
    val ret = copy(
      roomId=Some(room.id),
      roomAdmin=userId.map(room.isAdmin(_)),
      userQuiz=Some(room.userQuiz),
      hashtag=room.hashtag
    )
    room.event.foreach { e =>
      println("!!!!!!!!!!!" + e.admin + "," + userId)
    }
    room.event.map(e => ret.copy(
      eventId=Some(e.id),
      eventStatus=Some(e.status.code),
      eventAdmin=Some(userId == e.admin)
    )).getOrElse(ret)
  }

  def toJson = {
    Json.toJson(this)(PageParams.format)
  }

  override def toString = {
    toJson.toString
  } 
}

object PageParams {
  implicit val format = Json.format[PageParams]

  def create(request: RequestHeader, session: SessionInfo, userEventId: Option[Int]=None) = {
    val uri = controllers.routes.Application.ws().webSocketURL()(request)
    //ToDo remove debug
    val debug = request.getQueryString("debug").map(_ == "true").getOrElse(true)
    val ret = PageParams(
      uri=uri,
      debug=debug,
      userEventId=userEventId
    )
    session.user.map(ret.withUser(_)).getOrElse(ret)
  }
}