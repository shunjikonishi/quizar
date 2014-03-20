name := "ws-quiz"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  jdbc,
  cache,
  "org.scalikejdbc" %% "scalikejdbc" % "[1.7,)",
  "org.scalikejdbc" %% "scalikejdbc-play-plugin" % "[1.7,)",
  "org.scalikejdbc" %% "scalikejdbc-interpolation" % "[1.7,)",
  "postgresql" % "postgresql" % "9.1-901.jdbc4",
  "net.debasishg" % "redisclient_2.10" % "2.11",
  "org.twitter4j" % "twitter4j-core" % "4.0.1"
)

play.Project.playScalaSettings

