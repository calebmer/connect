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
  (19, 'Budd', 'budd@example.com', '$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.');

ALTER SEQUENCE account_id_seq RESTART WITH 20;

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
  (19, 3);

COMMIT;
