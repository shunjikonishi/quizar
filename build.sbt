name := "ws-quiz"

version := "1.0-SNAPSHOT"

resolvers += "Sonatype snapshots" at "http://oss.sonatype.org/content/repositories/snapshots"

val scalikejdbcVersion = "1.7.4"

libraryDependencies ++= Seq(
  cache,
  "org.scalikejdbc" %% "scalikejdbc" % scalikejdbcVersion,
  "org.scalikejdbc" %% "scalikejdbc-play-plugin" % scalikejdbcVersion,
  "org.scalikejdbc" %% "scalikejdbc-interpolation" % scalikejdbcVersion,
  "postgresql" % "postgresql" % "9.1-901.jdbc4",
  "net.debasishg" % "redisclient_2.10" % "2.11",
  "org.twitter4j" % "twitter4j-core" % "4.0.1"
)

play.Project.playScalaSettings

