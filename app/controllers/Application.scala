package controllers

import play.api.mvc.Controller
import play.api.mvc.Action
import play.api.i18n.Messages

object Application extends Controller {

  def index = Action {
    Ok(views.html.index(Messages("application.title"), "{}"))
  }

}