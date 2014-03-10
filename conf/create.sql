DROP TABLE QUIZ_USER;
CREATE TABLE QUIZ_USER (
	ID SERIAL PRIMARY KEY,
	NAME VARCHAR(100) NOT NULL,
	TWITTER_ID BIGINT NULL,
	TWITTER_SCREEN_NAME VARCHAR(20) NULL,
	FACEBOOK_ID BIGINT NULL,
	FACEBOOK_SCREEN_NAME VARCHAR(20) NULL,
	IMAGE_URL TEXT NOT NULL,
	LAST_LOGIN TIMESTAMP NULL,
	CREATED TIMESTAMP NOT NULL,
	UPDATED TIMESTAMP NOT NULL
);

DROP TABLE QUIZ_ROOM;
CREATE TABLE QUIZ_ROOM (
	ID SERIAL PRIMARY KEY,
	NAME VARCHAR(100) NOT NULL,
	TAGS VARCHAR(100) NULL,
	HASHTAG VARCHAR(20) NULL,
	USER_QUIZ BOOLEAN NOT NULL DEFAULT FALSE,
	DESCRIPTION TEXT NULL,
	OWNER INT NOT NULL,
	ADMIN_USERS TEXT NULL,
	CREATED TIMESTAMP NOT NULL,
	UPDATED TIMESTAMP NOT NULL
);

DROP TABLE QUIZ_EVENT;
CREATE TABLE QUIZ_EVENT (
	ID SERIAL PRIMARY KEY,
	ROOM_ID INT NOT NULL,
	TITLE VARCHAR(100) NULL,
	STATUS CHAR(1) NOT NULL DEFAULT '0',
	EXEC_DATE TIMESTAMP NULL,
	END_DATE TIMESTAMP NULL,
	CAPACITY INT NOT NULL,
	PASSCODE VARCHAR(100) NULL,
	DESCRIPTION TEXT NULL,
	CREATED TIMESTAMP NOT NULL,
	UPDATED TIMESTAMP NOT NULL
);

DROP TABLE QUIZ_QUESTION;
CREATE TABLE QUIZ_QUESTION (
	ID SERIAL PRIMARY KEY,
	ROOM_ID INT NOT NULL,
	CREATED_BY INT NOT NULL,
	QUESTION TEXT NOT NULL,
	ANSWERS TEXT NOT NULL,
	ANSWER_TYPE INT NOT NULL,
	TAGS VARCHAR(100) NULL,
	DESCRIPTION TEXT NULL,
	RELATED_URL VARCHAR(256) NULL,
	PUBLISH_COUNT INT NOT NULL DEFAULT 0,
	CORRECT_COUNT INT NOT NULL DEFAULT 0,
	WRONG_COUNT INT NOT NULL DEFAULT 0,
	CREATED TIMESTAMP NOT NULL,
	UPDATED TIMESTAMP NOT NULL
);

