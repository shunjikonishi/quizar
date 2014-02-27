name := "ws-quiz"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache,
  "org.twitter4j" % "twitter4j-core" % "3.0.5"
)

play.Project.playScalaSettings
