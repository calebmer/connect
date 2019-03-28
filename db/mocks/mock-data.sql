BEGIN;

-- NOTE: They all have a password equal to exactly “password”.
INSERT INTO account (id, name, avatar_url, email, password_hash) VALUES
  (1, 'Baruch', 'https://pbs.twimg.com/profile_images/1022636637891776512/vCciX6oJ_400x400.jpg', 'baruch@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (2, 'Caleb', 'https://pbs.twimg.com/profile_images/1040125515665879040/jrLzK1ta_400x400.jpg', 'caleb@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (3, 'Dominic', 'https://pbs.twimg.com/profile_images/847609679974768641/WDwlVYbD_400x400.jpg', 'dominic@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (4, 'Jared', null, 'jared@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (5, 'Jordan', null, 'jordan@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (6, 'Marcello', 'https://pbs.twimg.com/profile_images/800702652485160961/R5ZZVj--_400x400.jpg', 'marcello@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (7, 'Kate', 'https://pbs.twimg.com/profile_images/1095949370564870144/kwTdCHWU_400x400.png', 'kate@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (8, 'Marissa', null, 'marissa@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (9, 'Ada', null, 'ada@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (10, 'Grace', null, 'grace@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (11, 'Sheryl', null, 'sheryl@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (12, 'Darkiis', null, 'darkiis@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (13, 'Igor', null, 'igor@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (14, 'Kairon', null, 'kairon@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (15, 'Lava', null, 'lava@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (16, 'Rith', null, 'rith@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (17, 'Sara', null, 'sara@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (18, 'John', null, 'john@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (19, 'Budd', null, 'budd@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (20, 'Joseph', 'https://images-na.ssl-images-amazon.com/images/M/MV5BMTc3MzY3MjQ3OV5BMl5BanBnXkFtZTcwODI3NjQxMw@@._V1_UY256_CR6,0,172,256_AL_.jpg', 'joseph@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (21, 'Courtney', 'https://s3.amazonaws.com/uifaces/faces/twitter/adellecharles/128.jpg', 'courtney@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.');

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

INSERT INTO post (id, group_id, author_id, published_at, content) VALUES
  (1, 1, 7, now() - interval '79hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (2, 1, 20, now() - interval '78hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (3, 1, 6, now() - interval '77hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (4, 1, 21, now() - interval '76hr', 'what happened to DOGE life'),
  (5, 1, 3, now() - interval '75hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (6, 1, 7, now() - interval '74hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (7, 1, 1, now() - interval '73hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (8, 1, 6, now() - interval '72hr', 'Thoughts? https://brave.com'),

  (9, 1, 7, now() - interval '71hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (10, 1, 20, now() - interval '70hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (11, 1, 6, now() - interval '69hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (12, 1, 21, now() - interval '68hr', 'what happened to DOGE life'),
  (13, 1, 3, now() - interval '67hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (14, 1, 7, now() - interval '66hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (15, 1, 1, now() - interval '65hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (16, 1, 6, now() - interval '64hr', 'Thoughts? https://brave.com'),

  (17, 1, 7, now() - interval '63hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (18, 1, 20, now() - interval '62hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (19, 1, 6, now() - interval '61hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (20, 1, 21, now() - interval '60hr', 'what happened to DOGE life'),
  (21, 1, 3, now() - interval '59hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (22, 1, 7, now() - interval '58hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (23, 1, 1, now() - interval '57hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (24, 1, 6, now() - interval '56hr', 'Thoughts? https://brave.com'),

  (25, 1, 7, now() - interval '55hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (26, 1, 20, now() - interval '54hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (27, 1, 6, now() - interval '53hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (28, 1, 21, now() - interval '52hr', 'what happened to DOGE life'),
  (29, 1, 3, now() - interval '51hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (30, 1, 7, now() - interval '50hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (31, 1, 1, now() - interval '49hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (32, 1, 6, now() - interval '48hr', 'Thoughts? https://brave.com'),

  (33, 1, 7, now() - interval '47hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (34, 1, 20, now() - interval '46hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (35, 1, 6, now() - interval '45hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (36, 1, 21, now() - interval '44hr', 'what happened to DOGE life'),
  (37, 1, 3, now() - interval '43hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (38, 1, 7, now() - interval '42hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (39, 1, 1, now() - interval '41hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (40, 1, 6, now() - interval '40hr', 'Thoughts? https://brave.com'),

  (41, 1, 7, now() - interval '39hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (42, 1, 20, now() - interval '38hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (43, 1, 6, now() - interval '37hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (44, 1, 21, now() - interval '36hr', 'what happened to DOGE life'),
  (45, 1, 3, now() - interval '35hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (46, 1, 7, now() - interval '34hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (47, 1, 1, now() - interval '33hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (48, 1, 6, now() - interval '32hr', 'Thoughts? https://brave.com'),

  (49, 1, 7, now() - interval '31hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (50, 1, 20, now() - interval '30hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (51, 1, 6, now() - interval '29hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (52, 1, 21, now() - interval '28hr', 'what happened to DOGE life'),
  (53, 1, 3, now() - interval '27hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (54, 1, 7, now() - interval '26hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (55, 1, 1, now() - interval '25hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (56, 1, 6, now() - interval '24hr', 'Thoughts? https://brave.com'),

  (57, 1, 7, now() - interval '23hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (58, 1, 20, now() - interval '22hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (59, 1, 6, now() - interval '21hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (60, 1, 21, now() - interval '20hr', 'what happened to DOGE life'),
  (61, 1, 3, now() - interval '19hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (62, 1, 7, now() - interval '18hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (63, 1, 1, now() - interval '17hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (64, 1, 6, now() - interval '16hr', 'Thoughts? https://brave.com'),

  (65, 1, 7, now() - interval '15hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (66, 1, 20, now() - interval '14hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (67, 1, 6, now() - interval '13hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (68, 1, 21, now() - interval '12hr', 'what happened to DOGE life'),
  (69, 1, 3, now() - interval '11hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (70, 1, 7, now() - interval '10hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (71, 1, 1, now() - interval '9hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (72, 1, 6, now() - interval '8hr', 'Thoughts? https://brave.com'),

  (73, 1, 7, now() - interval '7hr', 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'),
  (74, 1, 20, now() - interval '6hr', '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'),
  (75, 1, 6, now() - interval '5hr', 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'),
  (76, 1, 21, now() - interval '4hr', 'what happened to DOGE life'),
  (77, 1, 3, now() - interval '3hr', 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'),
  (78, 1, 7, now() - interval '2hr', 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'),
  (79, 1, 1, now() - interval '1hr', 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'),
  (80, 1, 6, now() - interval '0hr', 'Thoughts? https://brave.com');

ALTER SEQUENCE post_id_seq RESTART WITH 81;

INSERT INTO comment (id, post_id, author_id, posted_at, content)
  SELECT mock_comment.id + (11 * (post.id - 1)) as id,
         post.id as post_id,
         mock_comment.author_id,
         mock_comment.posted_at,
         mock_comment.content
    FROM post,
         (SELECT 1, 1, now() - interval '0m', '@Dominic, @Joseph: what do you guys use to manage state across your app (react native)' UNION ALL
          SELECT 2, 20, now() - interval '3m', 'Right now redux because the Context API only just got released and it isnt currently stable' UNION ALL
          SELECT 3, 20, now() - interval '3m', 'Well hooks that is, I think context has been fine but Im waiting for hooks and context together first.' UNION ALL
          SELECT 4, 3, now() - interval '4m', 'I want to use hooks & context so bad' UNION ALL
          SELECT 5, 3, now() - interval '4m', 'Things may of changed as of today I''ll link you to the github tracking' UNION ALL
          SELECT 6, 1, now() - interval '5m', 'I''m using expo for now, and that means no hooks yet' UNION ALL
          SELECT 7, 3, now() - interval '5m', 'yup' UNION ALL
          SELECT 8, 3, now() - interval '5m', 'To be noted I like expo' UNION ALL
          SELECT 9, 20, now() - interval '5m', 'I don’t use expo as I tend to have to write custom java/objective-c modules for a lot of our scanning software here.' UNION ALL
          SELECT 10, 20, now() - interval '5m', 'So easier to not have to worry about ejecting for me' UNION ALL
          SELECT 11, 1, now() - interval '34m', 'I''m planning on ejecting probably by the end of this week tbh, there are too many things (functionality wise) that I''m missing with expo since the modules are not compatible')
              AS mock_comment (id, author_id, posted_at, content);

SELECT setval('comment_id_seq', (SELECT id FROM comment ORDER BY id DESC LIMIT 1));

COMMIT;
