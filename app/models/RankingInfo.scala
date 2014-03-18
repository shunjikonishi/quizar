package models

import play.api.libs.json._
import models.entities.QuizRanking
import org.joda.time.{DateTime}

case class EventRankingInfo(
  eventId: Int,
  userId: Int,
  username: String,
  img: String,
  correctCount: Int,
  wrongCount: Int,
  time: Long
) {

  def toJson = Json.toJson(this)(EventRankingInfo.format)
  override def toString = toJson.toString

}

object EventRankingInfo {
  implicit val format = Json.format[EventRankingInfo]

  def create(ranking: QuizRanking) = EventRankingInfo(
    eventId=ranking.eventId,
    userId=ranking.userId,
    username=ranking.username,
    img=ranking.imageUrl,
    correctCount=ranking.correctCount,
    wrongCount=ranking.wrongCount,
    time=ranking.time
  )

  def fromJson(json: JsValue): EventRankingInfo = Json.fromJson[EventRankingInfo](json).get
  def fromJson(str: String): EventRankingInfo = fromJson(Json.parse(str))
}

case class EventWinnerInfo(
  roomId: Int,
  eventId: Int,
  execDate: DateTime,
  eventName: Option[String],
  userId: Int,
  username: String,
  correctCount: Int,
  time: Long
) {

  def toJson = Json.toJson(this)(EventWinnerInfo.format)
  override def toString = toJson.toString
}

object EventWinnerInfo {

  implicit val format = Json.format[EventWinnerInfo]
}