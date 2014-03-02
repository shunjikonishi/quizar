package models

import twitter4j.TwitterFactory
import twitter4j.Twitter
import twitter4j.auth.RequestToken

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
  /*
    RequestToken requestToken = twitter.getOAuthRequestToken();
    AccessToken accessToken = null;
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    while (null == accessToken) {
      System.out.println("Open the following URL and grant access to your account:");
      System.out.println(requestToken.getAuthorizationURL());
      System.out.print("Enter the PIN(if aviailable) or just hit enter.[PIN]:");
      String pin = br.readLine();
      try{
         if(pin.length() > 0){
           accessToken = twitter.getOAuthAccessToken(requestToken, pin);
         }else{
           accessToken = twitter.getOAuthAccessToken();
         }
      } catch (TwitterException te) {
        if(401 == te.getStatusCode()){
          System.out.println("Unable to get the access token.");
        }else{
          te.printStackTrace();
        }
      }
    }
    //将来の参照用に accessToken を永続化する
    storeAccessToken(twitter.verifyCredentials().getId() , accessToken);
    Status status = twitter.updateStatus(args[0]);
    System.out.println("Successfully updated the status to [" + status.getText() + "].");
    System.exit(0); 
   */
}

object TwitterManager extends TwitterManager(
  sys.env("TWITTER_APIKEY"),
  sys.env("TWITTER_SECRET")
)