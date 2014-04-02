insert into quiz_user (id, name, twitter_id, twitter_screen_name, image_url, last_login, created, updated)
	values(1001, '@test_1001', 1001, '@test_1001', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1002, '@test_1002', 1002, '@test_1002', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1003, '@test_1003', 1003, '@test_1003', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1004, '@test_1004', 1004, '@test_1004', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1005, '@test_1005', 1005, '@test_1005', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1006, '@test_1006', 1006, '@test_1006', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1007, '@test_1007', 1007, '@test_1007', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1008, '@test_1008', 1008, '@test_1008', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1009, '@test_1009', 1009, '@test_1009', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
	     ,(1010, '@test_1010', 1010, '@test_1010', 'http://abs.twimg.com/sticky/default_profile_images/default_profile_4_mini.png', now(), now(), now())
;

insert into quiz_user_event (id, user_id, event_id, room_id, created, updated)
	values(1001, 1001, 2, 2, now(), now())
	     ,(1002, 1002, 2, 2, now(), now())
	     ,(1003, 1003, 2, 2, now(), now())
	     ,(1004, 1004, 2, 2, now(), now())
	     ,(1005, 1005, 2, 2, now(), now())
	     ,(1006, 1006, 2, 2, now(), now())
	     ,(1007, 1007, 2, 2, now(), now())
	     ,(1008, 1008, 2, 2, now(), now())
	     ,(1009, 1009, 2, 2, now(), now())
	     ,(1010, 1010, 2, 2, now(), now())
;

insert into quiz_user_answer (id, user_id, publish_id, event_id, user_event_id, answer, status, time, created, updated)
	values(1001, 1001, 59, 2, 1001, 1, 0, 1000, now(), now())
	     ,(1002, 1002, 59, 2, 1002, 2, 0, 1000, now(), now())
	     ,(1003, 1003, 59, 2, 1003, 3, 0, 1000, now(), now())
	     ,(1004, 1004, 59, 2, 1004, 4, 0, 1000, now(), now())
	     ,(1005, 1005, 59, 2, 1005, 5, 0, 1000, now(), now())
	     ,(1006, 1006, 59, 2, 1006, 1, 0, 1000, now(), now())
	     ,(1007, 1007, 59, 2, 1007, 2, 0, 1000, now(), now())
	     ,(1008, 1008, 59, 2, 1008, 3, 0, 1000, now(), now())
	     ,(1009, 1009, 59, 2, 1009, 4, 0, 1000, now(), now())
	     ,(1010, 1010, 59, 2, 1010, 5, 0, 1000, now(), now())
;

delete from quiz_user_answer where id > 1000;
delete from quiz_user_answer where id > 1010;

insert into quiz_room(name, owner, created, updated) values('test9', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test10', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test11', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test12', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test13', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test14', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test15', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test16', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test17', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test18', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test19', 1, now(), now());

insert into quiz_room(name, owner, created, updated) values('test20', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test21', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test22', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test23', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test24', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test25', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test26', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test27', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test28', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test29', 1, now(), now());

insert into quiz_room(name, owner, created, updated) values('test30', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test31', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test32', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test33', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test34', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test35', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test36', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test37', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test38', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test39', 1, now(), now());

insert into quiz_room(name, owner, created, updated) values('test40', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test41', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test42', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test43', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test44', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test45', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test46', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test47', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test48', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test49', 1, now(), now());

insert into quiz_room(name, owner, created, updated) values('test50', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test51', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test52', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test53', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test54', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test55', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test56', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test57', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test58', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test59', 1, now(), now());

insert into quiz_room(name, owner, created, updated) values('test60', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test61', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test62', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test63', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test64', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test65', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test66', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test67', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test68', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test69', 1, now(), now());

insert into quiz_room(name, owner, created, updated) values('test70', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test71', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test72', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test73', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test74', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test75', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test76', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test77', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test78', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test79', 1, now(), now());

insert into quiz_room(name, owner, created, updated) values('test80', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test81', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test82', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test83', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test84', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test85', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test86', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test87', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test88', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test89', 1, now(), now());

insert into quiz_room(name, owner, created, updated) values('test90', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test91', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test92', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test93', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test94', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test95', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test96', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test97', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test98', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test99', 1, now(), now());
insert into quiz_room(name, owner, created, updated) values('test100', 1, now(), now());
