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

-- Generates an ID for the provided timestamp. We use the same implementation as
-- in `api/client/generateID.ts`. We only use this when creating mock data since
-- we want to only have one implementation of ID generation in production. We
-- also haven’t thought about optimizing this.
CREATE OR REPLACE FUNCTION mock_generate_id(TIMESTAMP WITH TIME ZONE) RETURNS CHAR(22) AS $$
  DECLARE
    chars TEXT := '0123456789abcdefghjkmnpqrstvwxyz';
    seed BIGINT := extract(epoch FROM $1) * 1000;
    id TEXT := '';
  BEGIN
    FOR i IN 1..10 LOOP
      id := substring(chars FROM (seed % 32)::INT + 1 FOR 1) || id;
      seed := seed / 32;
    END LOOP;

    FOR i IN 1..12 LOOP
      id := id || substring(chars FROM floor(random() * 32)::INT + 1 FOR 1);
    END LOOP;

    IF LENGTH(id) <> 22 THEN
      RAISE EXCEPTION 'Generated an ID with a length of % instead of 22.', LENGTH(id);
    END IF;

    RETURN id;
  END;
$$ LANGUAGE plpgsql;

-- Insert some mock posts into our database. Except insert the same set of mock
-- posts 10 times.
INSERT INTO post (id, group_id, author_id, published_at, content)
  SELECT mock_generate_id(mock_post.published_at) AS id, mock_post.*
    FROM (SELECT mock_post.group_id,
                 mock_post.author_id,
                 NOW() - make_interval(hours := section * 8 + mock_post.id) AS published_at,
                 mock_post.content
            FROM unnest(ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) AS section,
                 unnest(ARRAY[(0, 1, 6, 'Thoughts? https://brave.com'::TEXT),
                              (1, 1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'::TEXT),
                              (2, 1, 7, 'By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉'::TEXT),
                              (3, 1, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'::TEXT),
                              (4, 1, 21, 'what happened to DOGE life'::TEXT),
                              (5, 1, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'::TEXT),
                              (6, 1, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'::TEXT),
                              (7, 1, 7, 'Anyone here who bought one of the two Wes Bros'' React courses? I''m considering getting it and wanted to hear some reviews 🙂'::TEXT)])
                              AS mock_post (id INT, group_id INT, author_id INT, content TEXT)) AS mock_post;

-- Insert some comments into our database. Insert the same set of comments for
-- every mock post we’ve inserted!
INSERT INTO comment (post_id, author_id, posted_at, content)
  SELECT post.id as post_id,
         mock_comment.author_id,
         mock_comment.posted_at,
         mock_comment.content
    FROM post,
         (SELECT 1, 1, now() + interval '0m', '@Dominic, @Joseph: what do you guys use to manage state across your app (react native)' UNION ALL
          SELECT 2, 20, now() + interval '3m', 'Right now redux because the Context API only just got released and it isnt currently stable' UNION ALL
          SELECT 3, 20, now() + interval '3m', 'Well hooks that is, I think context has been fine but Im waiting for hooks and context together first.' UNION ALL
          SELECT 4, 3, now() + interval '4m', 'I want to use hooks & context so bad' UNION ALL
          SELECT 5, 3, now() + interval '4m', 'Things may of changed as of today I''ll link you to the github tracking' UNION ALL
          SELECT 6, 1, now() + interval '5m', 'I''m using expo for now, and that means no hooks yet' UNION ALL
          SELECT 7, 3, now() + interval '5m', 'yup' UNION ALL
          SELECT 8, 3, now() + interval '5m', 'To be noted I like expo' UNION ALL
          SELECT 9, 20, now() + interval '5m', 'I don’t use expo as I tend to have to write custom java/objective-c modules for a lot of our scanning software here.' UNION ALL
          SELECT 10, 20, now() + interval '5m', 'So easier to not have to worry about ejecting for me' UNION ALL
          SELECT 11, 1, now() + interval '34m', 'I''m planning on ejecting probably by the end of this week tbh, there are too many things (functionality wise) that I''m missing with expo since the modules are not compatible')
              AS mock_comment (id, author_id, posted_at, content);

SELECT setval('comment_id_seq', (SELECT id FROM comment ORDER BY id DESC LIMIT 1));

COMMIT;
