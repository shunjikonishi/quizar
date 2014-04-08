import play.api.Logger
import play.api.GlobalSettings
import play.api.Application
import java.io.File
import jp.co.flect.util.ResourceGen
import models.RoomManager

object Global extends GlobalSettings {
	
	override def onStart(app: Application) {
		//Generate messages and messages.ja
		val defaults = new File("conf/messages");
		val origin = new File("conf/messages.origin");
		if (origin.lastModified > defaults.lastModified) {
			val gen = new ResourceGen(defaults.getParentFile(), "messages");
			gen.process(origin);
		}
		RoomManager.closeInactiveEvents
System.out.println("!!!!!!!! Test1 !!!!!!!!! - debug=" + Logger.isDebugEnabled)
import play.api.Play.current
import play.api.libs.concurrent.Akka
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.concurrent.duration.DurationInt
Akka.system.scheduler.scheduleOnce(10 seconds) {
  System.out.println("!!!!!!!! Test2 !!!!!!!!! - debug=" + Logger.isDebugEnabled)
}
	}
	
}
