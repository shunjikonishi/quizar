package models

import twitter4j.TwitterFactory

class TwitterManager(apiKey: String, secret: String) {

  def authorizationUrl = {
    val twitter = new TwitterFactory().getInstance
    twitter.setOAuthConsumer(apiKey, secret);
    twitter.getOAuthRequestToken.getAuthorizationURL
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