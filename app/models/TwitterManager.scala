package models

import twitter4j.TwitterFactory
import twitter4j.Twitter
import twitter4j.auth.RequestToken
import twitter4j.auth.AccessToken

class TwitterManager(apiKey: String, secret: String) {

  private val factory = new TwitterFactory()
  
  def createTwitter = {
    val twitter = factory.getInstance
    twitter.setOAuthConsumer(apiKey, secret);
    twitter
  }
  
  def authorizationUrl: String = {
    val twitter = createTwitter
    twitter.getOAuthRequestToken.getAuthorizationURL
  }
  
  def authorization(token: String, verifier: String): Twitter = {
    val twitter = createTwitter
    val requestToken = new RequestToken(token, secret)
    val accessToken = twitter.getOAuthAccessToken(requestToken, verifier)
    twitter
  }

  def fromAccessToken(token: String, secret: String): Twitter = {
    val twitter = createTwitter
    val accessToken = new AccessToken(token, secret)
    twitter.setOAuthAccessToken(accessToken)
    twitter
  }
}

object TwitterManager extends TwitterManager(
  sys.env("TWITTER_APIKEY"),
  sys.env("TWITTER_SECRET")
)
