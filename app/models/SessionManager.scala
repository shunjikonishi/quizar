package models

import flect.redis.RedisService

class SessionManager(redis: RedisService) {
  val SEC_HOUR = 60 * 60
  val SEC_DAY = 24 * SEC_HOUR

  private def key(sessionId: String) = "session-" + sessionId

  def getSessionInfo(sessionId: String): Option[SessionInfo] = {
    redis.get(key(sessionId)).map(SessionInfo.fromJson(_))
  }

  def setSessionInfo(sessionId: String, info: SessionInfo) = {
    redis.setex(key(sessionId), SEC_DAY, info.toJson)
  }

  def removeSessionInfo(sessionId: String) = {
    redis.del(key(sessionId))
  }
}

object SessionManager extends SessionManager(MyRedisService)