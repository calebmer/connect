// Heavily inspired by my (Caleb’s) old [`pg-sql`][1] module. Updated now that
// I’ve learned a thing or two. Main differences include:
//
// - A more efficient implementation.
// - Symbol stamps to avoid SQL injection attacks using JSON.
//
// Also takes inspiration from Benjie’s fork, [`pg-sql2`][2].
//
// [1]: https://github.com/calebmer/pg-sql
// [2]: https://github.com/graphile/pg-sql2

import {QueryConfig} from "pg";

/**
 * Used to prevent SQL injection attacks using JSON. Only code that has access
 * to the Node.js runtime will be able to add the `sqlQuery` symbol.
 */
const sqlQuery = Symbol("sql.query");

/**
 * The type of a SQL query. Designed to prevent [SQL injection][1] attacks. The
 * main query types:
 *
 * - `SQLQueryTemplate`: Represents a template string. Template strings are
 *   always constructed statically. This way dynamic strings are never used
 *   to construct a SQL query.
 * - `SQLQueryValue`: Represents a dynamic query value. We will substitute this
 *   value with a placeholder to prevent injection attacks.
 *
 * [1]: https://en.wikipedia.org/wiki/SQL_injection
 */
export type SQLQuery =
  | SQLQueryTemplate
  | SQLQueryValue
  | SQLQueryIdentifier
  | SQLQueryJoin
  | SQLQueryRaw;

/**
 * A type of a SQL query created by a template string.
 */
type SQLQueryTemplate = {
  readonly $$typeof: typeof sqlQuery;
  readonly type: "TEMPLATE";
  readonly strings: ReadonlyArray<string>;
  readonly values: ReadonlyArray<SQLQuery>;
};

/**
 * The type of a dynamic value in a SQL query.
 */
type SQLQueryValue = {
  readonly $$typeof: typeof sqlQuery;
  readonly type: "VALUE";
  readonly value: unknown;
};

/**
 * Adds a namespaced SQL identifier to our query.
 */
type SQLQueryIdentifier = {
  readonly $$typeof: typeof sqlQuery;
  readonly type: "IDENTIFIER";
  readonly identifiers: [string, ...Array<string>];
};

/**
 * Joins an array of SQL queries into a single query with the optional joiner in
 * between each query. Just like `String.prototype.join`. This is different from
 * the SQL `JOIN` keyword!
 */
type SQLQueryJoin = {
  readonly $$typeof: typeof sqlQuery;
  readonly type: "JOIN";
  readonly queries: ReadonlyArray<SQLQuery>;
  readonly joiner: SQLQuery | undefined;
};

/**
 * Dangerously injects **raw SQL** into our query. Only use this if you are 100%
 * sure that the SQL does not contain arbitrary user input.
 */
type SQLQueryRaw = {
  readonly $$typeof: typeof sqlQuery;
  readonly type: "RAW";
  readonly text: string;
};

/**
 * Creates a SQL template query.
 */
export function sql(
  templateStrings: TemplateStringsArray,
  ...values: Array<unknown>
): SQLQuery {
  // Check to make sure we have the right number of values.
  if (
    templateStrings.length > 0 &&
    templateStrings.length !== values.length + 1
  ) {
    throw new Error(
      "Template string was given arguments in an incorrect format.",
    );
  }

  let queryStrings: ReadonlyArray<string> = templateStrings;

  // If our SQL query starts with a new line then we have a multiline template
  // string. We want to strip out all new lines and whitespace so that the
  // query fits on one line.
  if (templateStrings[0][0] === "\n") {
    const newStrings = Array<string>(queryStrings.length);
    for (let i = 0; i < queryStrings.length; i++) {
      const string = queryStrings[i];
      let newString = "";
      let j = 0;
      let k = 0;
      while (k < string.length) {
        const c = string[k];
        if (c === "\n") {
          const isFirst = i === 0 && k === 0;
          newString += string.slice(j, k);
          k++;
          while (k < string.length && string[k] === " ") {
            k++;
          }
          j = k;
          const isLast = i === queryStrings.length - 1 && k === string.length;
          if (!isFirst && !isLast && string[k] !== "\n") {
            newString += " ";
          }
        } else {
          k++;
        }
      }
      newString += string.slice(j, k);
      newStrings[i] = newString;
    }
    queryStrings = newStrings;
  }

  // Wrap any values that are not SQL queries with `sql.value()`.
  const wrappedValues = values.map<SQLQuery>(value =>
    typeof value === "object" &&
    value !== null &&
    (value as any).$$typeof === sqlQuery
      ? (value as SQLQuery)
      : sql.value(value),
  );

  return {
    $$typeof: sqlQuery,
    type: "TEMPLATE",
    strings: queryStrings,
    values: wrappedValues,
  };
}

/**
 * Adds an arbitrary JavaScript value to a SQL query. This value will be
 * represented with a substitution in the final SQL query.
 */
sql.value = function value(value: unknown): SQLQuery {
  return {
    $$typeof: sqlQuery,
    type: "VALUE",
    value,
  };
};

/**
 * Adds a SQL identifier to our query. The identifier will always be escaped in
 * the query.
 */
sql.identifier = function identifier(
  identifier: string,
  ...identifiers: Array<string>
): SQLQuery {
  return {
    $$typeof: sqlQuery,
    type: "IDENTIFIER",
    identifiers: [identifier, ...identifiers],
  };
};

/**
 * Dangerously injects a **RAW SQL STRING** into your SQL query. Only use this
 * when you are 100% sure that the raw SQL string does not come from user input.
 */
sql.dangerouslyInjectRawString = function dangerouslyInjectRawString(
  text: string,
): SQLQuery {
  return {
    $$typeof: sqlQuery,
    type: "RAW",
    text,
  };
};

/**
 * Joins a list of SQL queries together into one with an optional joiner query.
 */
sql.join = function join(
  queries: ReadonlyArray<SQLQuery>,
  joiner?: SQLQuery,
): SQLQuery {
  return {
    $$typeof: sqlQuery,
    type: "JOIN",
    queries,
    joiner,
  };
};

// NOTE: We use `sql.dangerouslyInjectRawString` for constant queries because
// it has a lower memory footprint than a SQL template.

/** Empty SQL query. */
sql.empty = sql.dangerouslyInjectRawString("");

const trueNode = sql.dangerouslyInjectRawString("TRUE");
const falseNode = sql.dangerouslyInjectRawString("FALSE");
const nullNode = sql.dangerouslyInjectRawString("NULL");

/**
 * If the value is simple will inline it into the query, otherwise will defer
 * to `sql.value`.
 *
 * Ported from [Benjie’s `pg-sql2`][1].
 *
 * [1]: https://github.com/graphile/pg-sql2/blob/97e5c17bcb716f70e2021b420dbd5873346074e6/src/index.ts#L232
 */
sql.literal = function literal(
  value: string | number | boolean | null,
): SQLQuery {
  if (typeof value === "string" && /^[-a-zA-Z0-9_@!. ]*$/.test(value)) {
    return sql.dangerouslyInjectRawString(`'${value}'`);
  } else if (typeof value === "number" && Number.isFinite(value)) {
    if (Number.isInteger(value)) {
      return sql.dangerouslyInjectRawString(String(value));
    } else {
      return sql.dangerouslyInjectRawString(`'${0 + value}'::float`);
    }
  } else if (typeof value === "boolean") {
    return value ? trueNode : falseNode;
  } else if (value == null) {
    return nullNode;
  } else {
    return sql.value(value);
  }
};

/**
 * Compiles a `SQLQuery` into a query object we can provide to the `pg` module.
 */
sql.compile = function compile(initialQuery: SQLQuery): string | QueryConfig {
  let text = "";
  const values: Array<unknown> = [];

  // Our stack will contain `SQLQuery`s that we are processing. As long as the
  // stack is not empty we will have another `SQLQuery` to process.
  //
  // Remember that this stack is First-In-Last-Out (FILO)! So push queries in
  // the reverse order that they should be processed.
  const stack: Array<SQLQuery> = [initialQuery];

  while (stack.length !== 0) {
    const query = stack.pop()!;

    // Verify that our SQL query indeed has our private symbol. If it does not
    // then we know this module did not create the SQL query. Something or
    // someone else did.
    if (query.$$typeof !== sqlQuery) {
      throw new Error(
        "Expected all queries to have a `$$typeof` property with our private SQL " +
          "query symbol. This may be a SQL injection attempt!",
      );
    }

    switch (query.type) {
      case "TEMPLATE": {
        // Loop through our template in reverse order and push our strings and
        // values to the stack. Our stack is First-in-Last-Out which is why
        // we need to iterate in reverse.
        for (let i = query.values.length - 1; i >= 0; i--) {
          stack.push(sql.dangerouslyInjectRawString(query.strings[i + 1]));
          stack.push(query.values[i]);
        }

        // Immediately add the first string in our template to our query text.
        // Skip pushing to the stack since it would be popped
        // immediately anyway.
        text += query.strings[0];

        break;
      }

      case "VALUE": {
        values.push(query.value);
        text += `$${values.length}`;
        break;
      }

      // Escape a namespaced identifier and add it to our query text.
      case "IDENTIFIER": {
        for (let j = 0; j < query.identifiers.length; j++) {
          const identifier = query.identifiers[j];
          if (j !== 0) text += ".";
          text += '"';
          for (let i = 0; i < identifier.length; i++) {
            const c = identifier[i];
            if (c === '"') text += c + c;
            else text += c;
          }
          text += '"';
        }
        break;
      }

      case "JOIN": {
        // Loop through our queries in reverse order and push them to our stack.
        // Our stack is First-in-Last-Out which is why we need to iterate
        // in reverse.
        for (let i = query.queries.length - 1; i >= 0; i--) {
          stack.push(query.queries[i]);
          if (i !== 0 && query.joiner !== undefined) {
            stack.push(query.joiner);
          }
        }
        break;
      }

      case "RAW": {
        text += query.text;
        break;
      }

      default: {
        const never: never = query;
        throw new Error(`Unexpected query type: ${never["type"]}`);
      }
    }
  }

  // Return the final query config. If there are no values only return the
  // query text.
  return values.length === 0 ? text : {text, values};
};
