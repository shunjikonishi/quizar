import play.api.Logger
import play.api.mvc._
import play.api.Application
import java.io.File
import jp.co.flect.util.ResourceGen
import scala.concurrent.Future
import models.RoomManager

object Global extends WithFilters(RootDomainFilter) {
	
	override def onStart(app: Application) {
		//Generate messages and messages.ja
		val defaults = new File("conf/messages");
		val origin = new File("conf/messages.origin");
		if (origin.lastModified > defaults.lastModified) {
			val gen = new ResourceGen(defaults.getParentFile(), "messages");
			gen.process(origin);
		}
		RoomManager.closeInactiveEvents
	}
	
}

object RootDomainFilter extends Filter {
  
  def apply(nextFilter: (RequestHeader) => Future[SimpleResult])(request: RequestHeader): Future[SimpleResult] = {
    if (request.host == "quizar.info") {
      Future.successful(Results.Redirect("http://www.quizar.info" + request.uri, 301))
    } else {
      nextFilter(request)
    }
  }
}
