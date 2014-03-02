package models

case class User(
	id: Long,
	name: String,
	twitterId: Option[Long],
	facebookId: Option[Long],
	imageUrl: String
)