package models

import play.api.i18n.Lang
import flect.redis.RedisService

class SessionManager(redis: RedisService) {
  val SEC_HOUR = 60 * 60
  val SEC_DAY = 24 * SEC_HOUR

  private def key(sessionId: String) = "session-" + sessionId

  def get(sessionId: String)(implicit lang: Lang): SessionInfo = {
    redis.get(key(sessionId)).map(SessionInfo.fromJson(_)).getOrElse(SessionInfo(sessionId, lang.language))
  }

  def set(sessionId: String, info: SessionInfo) = {
    redis.setex(key(sessionId), SEC_DAY, info.toString)
  }

  def remove(sessionId: String) = {
    redis.del(key(sessionId))
  }

  def clearAll = {
    val keys = redis.keys("session-*")
    keys.getOrElse(Nil).foreach {
      _.foreach(redis.del(_))
    }
  }
}

object SessionManager extends SessionManager(MyRedisService)