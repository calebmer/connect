BEGIN;

-- NOTE: They all have a password equal to exactly “password”.
INSERT INTO account (id, name, email, password_hash) VALUES
  (1, 'Baruch', 'baruch@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (2, 'Caleb', 'caleb@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (3, 'Dominic', 'dominic@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (4, 'Jared', 'jared@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (5, 'Jordan', 'jordan@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (6, 'Marcello', 'marcello@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (7, 'Kate', 'kate@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (8, 'Marissa', 'marissa@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (9, 'Ada', 'ada@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (10, 'Grace', 'grace@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (11, 'Sheryl', 'sheryl@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (12, 'Darkiis', 'darkiis@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (13, 'Igor', 'igor@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (14, 'Kairon', 'kairon@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (15, 'Lava', 'lava@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (16, 'Rith', 'rith@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (17, 'Sara', 'sara@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (18, 'John', 'john@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (19, 'Budd', 'budd@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (20, 'Joseph', 'joseph@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (21, 'Courtney', 'courtney@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.');

ALTER SEQUENCE account_id_seq RESTART WITH 21;

INSERT INTO "group" (id, slug, name, owner_id) VALUES
  (1, 'nohello', 'Definitely Work', 3),
  (2, 'dnd', 'D&D', 7),
  (3, 'coffeekit', 'CoffeeKit', 17);

ALTER SEQUENCE group_id_seq RESTART WITH 4;

INSERT INTO group_member (account_id, group_id) VALUES
  (1, 1),
  (2, 1),
  (3, 1),
  (4, 1),
  (5, 1),
  (6, 1),
  (7, 1),
  (2, 2),
  (7, 2),
  (12, 2),
  (13, 2),
  (14, 2),
  (15, 2),
  (16, 2),
  (17, 3),
  (18, 3),
  (19, 3),
  (20, 1),
  (21, 1);

INSERT INTO post (id, group_id, author_id, content) VALUES
  (1, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (2, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (3, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (4, 1, 21, 'what happened to DOGE life'),
  (5, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (6, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (7, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (8, 1, 6, 'Thoughts? https://brave.com'),

  (9, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (10, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (11, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (12, 1, 21, 'what happened to DOGE life'),
  (13, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (14, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (15, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (16, 1, 6, 'Thoughts? https://brave.com'),

  (17, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (18, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (19, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (20, 1, 21, 'what happened to DOGE life'),
  (21, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (22, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (23, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (24, 1, 6, 'Thoughts? https://brave.com'),

  (25, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (26, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (27, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (28, 1, 21, 'what happened to DOGE life'),
  (29, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (30, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (31, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (32, 1, 6, 'Thoughts? https://brave.com'),

  (33, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (34, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (35, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (36, 1, 21, 'what happened to DOGE life'),
  (37, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (38, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (39, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (40, 1, 6, 'Thoughts? https://brave.com'),

  (41, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (42, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (43, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (44, 1, 21, 'what happened to DOGE life'),
  (45, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (46, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (47, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (48, 1, 6, 'Thoughts? https://brave.com'),

  (49, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (50, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (51, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (52, 1, 21, 'what happened to DOGE life'),
  (53, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (54, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (55, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (56, 1, 6, 'Thoughts? https://brave.com'),

  (57, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (58, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (59, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (60, 1, 21, 'what happened to DOGE life'),
  (61, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (62, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (63, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (64, 1, 6, 'Thoughts? https://brave.com'),

  (65, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (66, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (67, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (68, 1, 21, 'what happened to DOGE life'),
  (69, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (70, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (71, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (72, 1, 6, 'Thoughts? https://brave.com'),

  (73, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (74, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (75, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (76, 1, 21, 'what happened to DOGE life'),
  (77, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (78, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (79, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (80, 1, 6, 'Thoughts? https://brave.com');

ALTER SEQUENCE post_id_seq RESTART WITH 81;

COMMIT;
