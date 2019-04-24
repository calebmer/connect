import {sql} from "../PGSQL";

test("compiles a template string with only new lines to an empty string", () => {
  expect(
    sql.compile(sql`

    `),
  ).toEqual("");
});

test("compiles a template string with multiple lines correctly", () => {
  expect(
    sql.compile(sql`
        SELECT id, published_at, content
          FROM post
      ORDER BY published_at, id
    `),
  ).toEqual(
    "SELECT id, published_at, content FROM post ORDER BY published_at, id",
  );
});

test("compiles a template string with a single line correctly", () => {
  expect(
    sql.compile(
      sql`SELECT id, published_at, content FROM post ORDER BY published_at, id`,
    ),
  ).toEqual(
    "SELECT id, published_at, content FROM post ORDER BY published_at, id",
  );
});

test("compiles a template string with only new line and a variable to an empty string", () => {
  expect(
    sql.compile(sql`
      ${42}
    `),
  ).toEqual({text: "$1", values: [42]});
});

test("compiles a template string with only new line and multiple variables to an empty string", () => {
  expect(
    sql.compile(sql`
      ${1} ${2}  ${3} ${4}
      ${5} ${6}
      ${7}

      ${8}
    `),
  ).toEqual({
    text: "$1 $2  $3 $4 $5 $6 $7 $8",
    values: [1, 2, 3, 4, 5, 6, 7, 8],
  });
});

test("compiles a template string with multiple lines and multiple values correctly", () => {
  expect(
    sql.compile(sql`
        SELECT id, published_at, content
          FROM post
         WHERE published_at >= ${1} AND id > ${2}
      ORDER BY published_at, id
    `),
  ).toEqual({
    text:
      "SELECT id, published_at, content FROM post WHERE published_at >= $1 AND id > $2 ORDER BY published_at, id",
    values: [1, 2],
  });
});
