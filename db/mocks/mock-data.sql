BEGIN;

-- NOTE: They all have a password equal to exactly “password”.
INSERT INTO account (id, name, avatar_url, email, password_hash) VALUES
  (1, 'Baruch', 'https://pbs.twimg.com/profile_images/1022636637891776512/vCciX6oJ_400x400.jpg', 'baruch@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (2, 'Caleb', 'https://pbs.twimg.com/profile_images/1040125515665879040/jrLzK1ta_400x400.jpg', 'caleb@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (3, 'Dominic', 'https://pbs.twimg.com/profile_images/847609679974768641/WDwlVYbD_400x400.jpg', 'dominic@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (4, 'Jared', null, 'jared@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (5, 'Jordan', null, 'jordan@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
  (6, 'Marcello', 'https://pbs.twimg.com/profile_images/800702652485160961/R5ZZVj--_400x400.jpg', 'marcello@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.'),
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
  ('01dbxcwqv4k2ccbvyedh2a', 'nohello', 'Definitely Work', 3),
  ('01dbxcxpt03fjpa8n6p170', null, 'D&D', 2),
  ('01dbxcxx7t05mg60ekxqh6', 'coffeekit', 'CoffeeKit', 17);

INSERT INTO group_member (account_id, group_id) VALUES
  (1, '01dbxcwqv4k2ccbvyedh2a'),
  (2, '01dbxcwqv4k2ccbvyedh2a'),
  (3, '01dbxcwqv4k2ccbvyedh2a'),
  (4, '01dbxcwqv4k2ccbvyedh2a'),
  (5, '01dbxcwqv4k2ccbvyedh2a'),
  (6, '01dbxcwqv4k2ccbvyedh2a'),
  (2, '01dbxcxpt03fjpa8n6p170'),
  (12, '01dbxcxpt03fjpa8n6p170'),
  (13, '01dbxcxpt03fjpa8n6p170'),
  (14, '01dbxcxpt03fjpa8n6p170'),
  (15, '01dbxcxpt03fjpa8n6p170'),
  (16, '01dbxcxpt03fjpa8n6p170'),
  (17, '01dbxcxx7t05mg60ekxqh6'),
  (18, '01dbxcxx7t05mg60ekxqh6'),
  (19, '01dbxcxx7t05mg60ekxqh6'),
  (20, '01dbxcwqv4k2ccbvyedh2a'),
  (21, '01dbxcwqv4k2ccbvyedh2a');

-- Generates an ID for the provided timestamp. We use the same implementation as
-- in `api/client/generateID.ts`. We only use this when creating mock data since
-- we want to only have one implementation of ID generation in production. We
-- also haven’t thought about optimizing this.
CREATE FUNCTION mock_generate_id(TIMESTAMP WITH TIME ZONE) RETURNS CHAR(22) AS $$
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
  SELECT mock_generate_id(mock_post.published_at), mock_post.*
    FROM (SELECT '01dbxcwqv4k2ccbvyedh2a' as group_id,
                 mock_post.author_id,
                 NOW() - make_interval(hours := section * 8 + mock_post.id) - interval '45m' AS published_at,
                 mock_post.content
            FROM unnest(ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) AS section,
                 unnest(ARRAY[(0, 6, 'Thoughts? https://brave.com'::TEXT),
                              (1, 1, 'never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads'::TEXT),
                              (3, 3, 'I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1'::TEXT),
                              (4, 21, 'what happened to DOGE life'::TEXT),
                              (5, 6, 'anyone ever deal with uploading files, possibly multiple files at the same time? I''ve done this a few different ways in the past, I''m looking for a super robust / scalable solution'::TEXT),
                              (6, 20, '@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.'::TEXT)])
                              AS mock_post (id INT, author_id INT, content TEXT)) AS mock_post;

-- Insert some comments into our database. Insert the same set of comments for
-- every mock post we’ve inserted!
INSERT INTO comment (id, post_id, author_id, published_at, content)
  SELECT mock_generate_id(mock_comment.published_at), mock_comment.*
    FROM (SELECT post.id as post_id,
                 mock_comment.author_id,
                 post.published_at + mock_comment.published_at + interval '1m' + (6 - post.duplicate) * interval '45m' AS published_at,
                 mock_comment.content
            FROM (SELECT *
                    FROM unnest(ARRAY[1, 2, 3, 4, 5, 6]) AS duplicate
                    JOIN (SELECT row_number() OVER (ORDER BY published_at, id), * FROM post ORDER BY published_at, id) AS post ON ((row_number - 1) % 6) + 1 <= duplicate) AS post,
                 unnest(ARRAY[(1, 1, interval '0m 0s', '@Dominic, @Joseph: what do you guys use to manage state across your app (react native)'::TEXT),
                              (2, 20, interval '3m 0s', 'Right now redux because the Context API only just got released and it isnt currently stable'::TEXT),
                              (3, 20, interval '3m 30s', 'Well hooks that is, I think context has been fine but Im waiting for hooks and context together first.'::TEXT),
                              (4, 3, interval '4m 0s', 'I want to use hooks & context so bad'::TEXT),
                              (5, 3, interval '4m 30s', 'Things may of changed as of today I''ll link you to the github tracking'::TEXT),
                              (6, 1, interval '5m 0s', 'I''m using expo for now, and that means no hooks yet'::TEXT),
                              (7, 3, interval '5m 12s', 'yup'::TEXT),
                              (8, 3, interval '5m 24s', 'To be noted I like expo'::TEXT),
                              (9, 20, interval '5m 36s', 'I don’t use expo as I tend to have to write custom java/objective-c modules for a lot of our scanning software here.'::TEXT),
                              (10, 20, interval '5m 48s', 'So easier to not have to worry about ejecting for me'::TEXT),
                              (11, 1, interval '34m 0s', 'I''m planning on ejecting probably by the end of this week tbh, there are too many things (functionality wise) that I''m missing with expo since the modules are not compatible'::TEXT)])
                              AS mock_comment (id INT, author_id INT, published_at INTERVAL, content TEXT)) AS mock_comment;

COMMIT;
