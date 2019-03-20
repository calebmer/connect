import {
  AccountID,
  Cursor,
  JSONValue,
  Range,
  RangeDirection,
} from "@connect/api-client";
import {PGColumn, PGExpression, PGQuerySelect} from "./PGTable";
import {PGClient} from "./PGClient";
import {sql} from "./PGSQL";

/**
 * Utility for paginating a SQL table using cursors. The constructor accepts an
 * array of columns that we will use for defining the table order.
 *
 * Cursor pagination logic can be a little bit complex, so we want to abstract
 * that logic into a testable helper.
 */
export class PGPagination {
  constructor(
    private readonly columns: ReadonlyArray<{
      readonly column: PGColumn<unknown>;
      readonly descending?: boolean;
    }>,
  ) {
    if (columns.length < 1) {
      throw new Error("Expected at least one column.");
    }
  }

  /**
   * Execute a paginated query!
   */
  async query<Selection>(
    client: PGClient,
    accountID: AccountID,
    range: Range<Cursor<ReadonlyArray<JSONValue>>>,
    query: PGQuerySelect<Selection>,
  ): Promise<Array<Selection>> {
    // If we have an “after” cursor then let’s add some conditions for
    // our cursor...
    if (range.after != null) {
      const cursor = Cursor.decode(range.after);

      if (cursor.length !== this.columns.length) {
        throw new Error(
          `Expected cursor to have ${this.columns.length} values but it ` +
            `actually has ${cursor.length}.`,
        );
      }

      for (let i = 0; i < this.columns.length; i++) {
        const column = this.columns[i];
        const cursorValue = cursor[i];

        let operator = column.descending ? "<" : ">";

        // Say we had a table that looked like `...[1, 2], [1, 3], [1, 4]...`
        // and we had an “after” cursor of `[1, 3]`. We would want to select
        // `[1, 4]`. So we allow equality for all columns but the last one.
        if (i !== this.columns.length - 1) operator += "=";

        const sqlColumn = column.column.generateQuery();
        const sqlOperator = sql.dangerouslyInjectRawString(operator);
        query = query.where(
          new PGExpression(
            sql`${sqlColumn} ${sqlOperator} ${sql.value(cursorValue)}`,
          ),
        );
      }
    }

    // If we have a “before” cursor then let’s add some conditions for
    // our cursor...
    if (range.before != null) {
      const cursor = Cursor.decode(range.before);

      if (cursor.length !== this.columns.length) {
        throw new Error(
          `Expected cursor to have ${this.columns.length} values but it ` +
            `actually has ${cursor.length}.`,
        );
      }

      for (let i = 0; i < this.columns.length; i++) {
        const column = this.columns[i];
        const cursorValue = cursor[i];

        let operator = column.descending ? ">" : "<";

        // Say we had a table that looked like `...[1, 2], [1, 3], [1, 4]...`
        // and we had an “before” cursor of `[1, 3]`. We would want to select
        // `[1, 2]`. So we allow equality for all columns but the last one.
        if (i !== this.columns.length - 1) operator += "=";

        const sqlColumn = column.column.generateQuery();
        const sqlOperator = sql.dangerouslyInjectRawString(operator);
        query = query.where(
          new PGExpression(
            sql`${sqlColumn} ${sqlOperator} ${sql.value(cursorValue)}`,
          ),
        );
      }
    }

    // Add `ORDER BY` clauses for each column.
    this.columns.forEach(({column, descending}) => {
      // Use the column definition to know if this table is descending, but
      // if our range direction is reversed then reverse the order of all our
      // columns. This way the `LIMIT` we set on our query will only take
      // columns from the reverse direction.
      const actuallyDescending =
        range.direction !== RangeDirection.Last ? descending : !descending;

      // Add an order by clause for this column.
      query = query.orderBy(column, actuallyDescending ? "DESC" : "ASC");
    });

    // Limit the query by our provided count.
    query = query.limit(range.count);

    // Run our query!
    const result = await query.execute(client, accountID);

    // If our range direction is “last” then that means we reversed all the
    // directions in the `ORDER BY` clause. Make sure we reverse our rows back
    // to their expected direction here.
    if (range.direction === RangeDirection.Last) {
      result.reverse();
    }

    return result;
  }
}
