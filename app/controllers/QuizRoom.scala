package models

import java.util.Date

case class QuizRoom(
  id: Option[Long],
  name: String,
  tag: Option[String],
  allowUserQuestion: Boolean,
  description: Option[String]
)

case class QuizEvent(
	title: String,
	capacity: Int,
	date: Option[Date],
	time: Option[String],
	passcode: Option[String],
	description: Option[String]
)

case class User(
	id: Long,
	name: String,
	twitterId: Option[String],
	facebookId: Option[String],
	imageUrl: String
)