package models

import play.api.libs.json.Json

case class PublishInfo(
  id: Int, 
  eventId: Int, 
  questionId: Int, 
  seq: Int,
  question: String,
  answers: List[String],
  answerTime: Int
) {
  def toJson = {
    Json.toJson(this)(PublishInfo.format)
  }

  override def toString = toJson.toString
}

object PublishInfo {
  implicit val format = Json.format[PublishInfo]
}