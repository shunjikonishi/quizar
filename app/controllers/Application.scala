package controllers

import play.api.mvc.Controller
import play.api.mvc.Action
import play.api.i18n.Messages

import models.TwitterManager

object Application extends Controller {

  def index = Action {
    val twitterUrl = TwitterManager.authorizationUrl
    println(twitterUrl)
    Ok(views.html.index(Messages("application.title"), twitterUrl, "{}"))
  }
  
  def signinTwitter(oauth_token: String, oauth_verifier: String) = Action {
    val twitter = TwitterManager.authorization(oauth_token, oauth_verifier)
    val user = twitter.verifyCredentials
    println(user.getId + ", " + user.getName + ", " + user.getScreenName() + ", " + user.getMiniProfileImageURL)
    //twitter.updateStatus("test: " + new java.util.Date())
    Ok(s"token: ${oauth_token}, verifier: ${oauth_verifier}");
  }

}