package models

import play.api.Play
import play.api.Play.current
import flect.redis.RedisService

object MyRedisService extends RedisService(
  Play.configuration.getString("redis.uri").get,
  Play.configuration.getInt("redis.maxIdle").getOrElse(8),
  Play.configuration.getInt("redis.maxActive").getOrElse(0)
)
