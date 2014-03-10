package models

import play.api.libs.json.Json
import play.api.mvc.RequestHeader

case class PageParams(
  uri: String,
  debug: Boolean,
  userId: Option[Int] = None,
  username: Option[String] = None,
  roomId: Option[Int] = None,
  roomAdmin: Option[Boolean] = None,
  hashtag: Option[String] = None,
  userEventId: Option[Int] = None
) {
  def withRoom(room: RoomInfo): PageParams = {
    copy(
      roomId=Some(room.id),
      roomAdmin=userId.map(room.isAdmin(_)),
      hashtag=room.hashtag
    )
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

  def create(request: RequestHeader, session: SessionInfo) = {
    val uri = controllers.routes.Application.ws().webSocketURL()(request)
    val debug = request.getQueryString("debug").map(_ == "true").getOrElse(true)
    val (userId, username) = session.user.map(u => (Some(u.id), Some(u.name))).getOrElse((None, None))
    val userEventId = session.userEventId
    PageParams(
      uri=uri,
      debug=debug,
      userId=userId,
      username=username,
      userEventId=userEventId
    )
  }
}