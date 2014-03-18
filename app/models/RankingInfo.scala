package models

import play.api.libs.json._
import models.entities.QuizRanking

case class EventRankingInfo(
  eventId: Int,
  userId: Int,
  username: String,
  img: String,
  correctCount: Int,
  time: Long
) {

  def toJson = Json.toJson(this)(EventRankingInfo.format)
  override def toString = toJson.toString

}

object EventRankingInfo {
  implicit val format = Json.format[EventRankingInfo]

  def create(ranking: QuizRanking) = EventRankingInfo(
    eventId=ranking.eventId.get,
    userId=ranking.userId.get,
    username=ranking.username.get,
    img=ranking.imageUrl.get,
    correctCount=ranking.correctCount.get.toInt,
    time=ranking.time.get
  )

  def fromJson(json: JsValue): EventRankingInfo = Json.fromJson[EventRankingInfo](json).get
  def fromJson(str: String): EventRankingInfo = fromJson(Json.parse(str))
}
