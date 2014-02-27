package controllers

import play.api.mvc.Controller
import play.api.mvc.Action
import play.api.i18n.Messages

import models.TwitterManager

object Application extends Controller {

  def index = Action {
  	val twitterUrl = TwitterManager.authorizationUrl
    Ok(views.html.index(Messages("application.title"), twitterUrl, "{}"))
  }

}