package models

import play.api.i18n.Messages

class QuizException(msg: String) extends Exception(msg)

class PasscodeRequireException extends QuizException("")
class InvalidPasscodeException extends QuizException(Messages("invalidPasscode"))
