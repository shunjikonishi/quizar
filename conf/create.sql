CREATE TABLE QUIZ_USER (
	ID SERIAL PRIMARY KEY,
	NAME VARCHAR(100) NOT NULL,
	TWITTER_ID VARCHAR(100) NULL,
	FACEBOOK_ID VARCHAR(100) NULL,
	IMAGE_URL TEXT NOT NULL,
	LAST_LOGIN TIMESTAMP,
	CREATED TIMESTAMP,
	UPDATED TIMESTAMP
);

