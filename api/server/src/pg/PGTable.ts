import {PGType, PGTypeGet} from "./PGType";
import {SQLQuery, sql} from "./PGSQL";
import {AccountID} from "@connect/api-client";
import {PGClient} from "./PGClient";

/**
 * Counts the number of aliases each table has so we can create a new alias each
 * time `PGTable.alias()` is called.
 */
const tableAliasCounter = new Map<string, number>();

/**
 * Postgres table definition. This is the entrypoint into our database. You
 * start building your queries, usually, from a `PGTable`.
 *
 * Tables also have the important feature of being able to specify a
 * privacy policy! All queries generated based on `PGTable` will have a privacy
 * policy automatically added to the query.
 */
export class PGTable<Columns extends PGColumnsBase> {
  /**
   * Defines a new Postgres table.
   */
  static define<Columns extends PGColumnsBase>(config: {
    name: string;
    columns: Columns;
    privacy: PGPrivacySelect<Columns>;
  }): PGTable<Columns> & PGTableColumns<Columns> {
    const table = new PGTable(
      config.name,
      null,
      config.columns,
      config.privacy,
    );
    return table.assignColumns();
  }

  private constructor(
    public readonly tableName: string,
    public readonly tableAlias: string | null,
    private readonly _columns: Columns,
    private readonly _privacy: PGPrivacySelect<Columns>,
  ) {}

  /**
   * Creates a `SELECT` query for selecting data from our table.
   */
  select<Selection extends PGSelectionBase>(
    selection: Selection,
  ): PGQuerySelect<PGSelectionType<Selection>> {
    return PGQuerySelect.create(this, selection);
  }

  // TODO:
  // insert<Insertion extends PGInsertionBase>(
  //   insertion: Insertion,
  //   values: ReadonlyArray<PGInsertionType<Insertion>>,
  // ): PGQueryInsert<{}>;

  /**
   * Creates an alias for our table. Useful when we need to write queries with
   * multiple references to the same table.
   */
  alias(): PGTable<Columns> & PGTableColumns<Columns> {
    const aliasCounter = (tableAliasCounter.get(this.tableName) || 1) + 1;
    tableAliasCounter.set(this.tableName, aliasCounter);
    const table = new PGTable(
      this.tableName,
      `${this.tableName}${aliasCounter}`,
      this._columns,
      this._privacy,
    );
    return table.assignColumns();
  }

  /**
   * Generates from `FROM` clause item for this table.
   */
  generateFromItem(): SQLQuery {
    const tableName = sql.identifier(this.tableName);
    if (this.tableAlias == null) {
      return tableName;
    } else {
      return sql`${tableName} AS ${sql.identifier(this.tableAlias)}`;
    }
  }

  /**
   * Apply this table’s privacy policy
   */
  applySelectPrivacyPolicy<Type>(
    accountID: AccountID,
    query: PGQuerySelect<Type>,
  ): PGQuerySelect<Type> {
    return this._privacy(this as any, query, accountID);
  }

  /**
   * Assigns column definitions to our table so that they are
   * easily accessible.
   */
  private assignColumns(): this & PGTableColumns<Columns> {
    for (const key of Object.keys(this._columns)) {
      (this as any)[key] = new PGColumn(this.tableAlias || this.tableName, key);
    }
    return this as any;
  }
}

/**
 * Used for defining a privacy policy for select queries.
 */
type PGPrivacySelect<Columns extends PGColumnsBase> = <Type>(
  columns: PGTableColumns<Columns>,
  query: PGQuerySelect<Type>,
  accountID: AccountID,
) => PGQuerySelect<Type>;

type PGColumnsBase = {[key: string]: PGType<unknown>};

type PGTableColumns<Columns extends PGColumnsBase> = {
  [Column in keyof Columns]: PGColumn<PGTypeGet<Columns[Column]>>
};

/**
 * A `SELECT` query builder. There are many features of `SELECT` we don’t
 * include since they would violate our privacy policy.
 */
export class PGQuerySelect<Type> {
  /**
   * Create a new `SELECT` query.
   */
  static create<Selection extends PGSelectionBase>(
    table: PGTable<any>,
    selection: Selection,
  ): PGQuerySelect<PGSelectionType<Selection>> {
    return new PGQuerySelect(selection, table, null, null, null, null);
  }

  private constructor(
    private readonly _select: PGSelectionBase,
    private readonly _from: PGTable<any>,
    private readonly _where: LinkedList<PGExpression<boolean>>,
    private readonly _limit: number | null,
    private readonly _orderBy: LinkedList<{
      readonly column: PGColumn<unknown>;
      readonly descending: boolean;
    }>,
    private readonly _leftJoin: LinkedList<{
      readonly table: PGTable<any>;
      readonly condition: PGExpression<boolean>;
    }>,
  ) {}

  /**
   * Adds a `WHERE` condition to the query. If multiple conditions are added
   * with `where()` then we will combine them with `AND`.
   */
  where(expression: PGExpression<boolean>): PGQuerySelect<Type> {
    return new PGQuerySelect(
      this._select,
      this._from,
      {value: expression, next: this._where},
      this._limit,
      this._orderBy,
      this._leftJoin,
    );
  }

  /**
   * Sets the limit with `LIMIT` on how many rows should be returned by this
   * query. Will override the previous limit set on this query.
   */
  limit(limit: number): PGQuerySelect<Type> {
    return new PGQuerySelect(
      this._select,
      this._from,
      this._where,
      limit,
      this._orderBy,
      this._leftJoin,
    );
  }

  /**
   * Add a column by which we will order the query. The query will add
   * `ORDER BY` clauses in the order `orderBy()` was called.
   */
  orderBy(
    column: PGColumn<unknown>,
    direction: "ASC" | "DESC" = "ASC",
  ): PGQuerySelect<Type> {
    const descending = direction === "DESC";
    return new PGQuerySelect(
      this._select,
      this._from,
      this._where,
      this._limit,
      {value: {column, descending}, next: this._orderBy},
      this._leftJoin,
    );
  }

  /**
   * Adds a `LEFT JOIN` to the selection with the provided table and some
   * associated condition.
   *
   * **IMPORTANT:** Will not apply our table’s privacy policy to the
   * joined table.
   */
  ignorePrivacy_leftJoin(
    table: PGTable<any>,
    condition: PGExpression<boolean>,
  ): PGQuerySelect<Type> {
    return new PGQuerySelect(
      this._select,
      this._from,
      this._where,
      this._limit,
      this._orderBy,
      {value: {table, condition}, next: this._leftJoin},
    );
  }

  /**
   * This expression only evaluates to true when the sub-query returns at least
   * one row.
   *
   * **IMPORTANT:** Will not apply our table’s privacy policy to the sub-query.
   */
  ignorePrivacy_exists(): PGExpression<boolean> {
    return PGExpression.ignorePrivacy_exists(this);
  }

  /**
   * Generate a SQL query from our query builder.
   *
   * **IMPORTANT:** Will not apply our table’s privacy policy to the
   * generated query.
   */
  ignorePrivacy_generateQuery(): SQLQuery {
    return this.generateQuery();
  }

  /**
   * Generate a SQL query from our query builder.
   */
  private generateQuery(): SQLQuery {
    // The expressions we are selecting in this query.
    const selectExpressions = Object.keys(this._select).map(key => {
      const expression = this._select[key];
      if (expression instanceof PGColumn && expression.columnName === key) {
        return expression.generateQuery();
      } else {
        return sql`${expression.generateQuery()} as ${sql.identifier(key)}`;
      }
    });
    const select =
      selectExpressions.length > 0
        ? sql.join(selectExpressions, sql`, `)
        : sql`1`;

    // The table we are selecting from in this query.
    const from = this._from.generateFromItem();

    // Add all the join items together, reverse them, and add to our query.
    const joinItems: Array<SQLQuery> = [];
    {
      let currentNode = this._leftJoin;
      while (currentNode !== null) {
        const fromItem = currentNode.value.table.generateFromItem();
        const condition = currentNode.value.condition.generateQuery();
        joinItems.push(sql` LEFT JOIN ${fromItem} ON ${condition}`);
        currentNode = currentNode.next;
      }
    }
    joinItems.reverse();
    const join = sql.join(joinItems);

    // The where clause. Get all of our conditions in reverse order and build
    // the where clause if we have at least one condition.
    const whereConditions: Array<SQLQuery> = [];
    {
      let currentNode = this._where;
      while (currentNode !== null) {
        whereConditions.push(currentNode.value.generateQuery());
        currentNode = currentNode.next;
      }
    }
    whereConditions.reverse();
    const where =
      whereConditions.length > 0
        ? sql` WHERE ${sql.join(whereConditions, sql` AND `)}`
        : sql.empty;

    // The `ORDER BY` clause. Get all of the columns we are ordering by from
    // the linked list, reverse, and build the clause if we have some columns.
    const orderByColumns: Array<SQLQuery> = [];
    {
      let currentNode = this._orderBy;
      while (currentNode !== null) {
        orderByColumns.push(
          currentNode.value.descending
            ? sql`${currentNode.value.column.generateQuery()} DESC`
            : currentNode.value.column.generateQuery(),
        );
        currentNode = currentNode.next;
      }
    }
    orderByColumns.reverse();
    const orderBy =
      orderByColumns.length > 0
        ? sql` ORDER BY ${sql.join(orderByColumns, sql`, `)}`
        : sql.empty;

    // If we have a limit then add a limit clause to our query.
    const limit =
      this._limit !== null ? sql` LIMIT ${sql.value(this._limit)}` : sql.empty;

    return sql`SELECT ${select} FROM ${from}${join}${where}${orderBy}${limit}`;
  }

  /**
   * Executes a query in the provided Postgres client. First applies our table’s
   * privacy policy to the query.
   */
  async execute(client: PGClient, accountID: AccountID): Promise<Array<Type>> {
    const queryBuilder = this._from.applySelectPrivacyPolicy(accountID, this);
    const query = queryBuilder.generateQuery();
    const {rows} = await client.query(query);
    return rows;
  }
}

/**
 * The upper bound for a selection map. Returned objects from our selection will
 * be in this form.
 */
export type PGSelectionBase = {
  [key: string]: PGExpression<unknown>;
};

/**
 * The type returned by a Postgres selection.
 */
export type PGSelectionType<Selection extends PGSelectionBase> = {
  [Key in keyof Selection]: PGExpressionType<Selection[Key]>
};

// TODO:
// interface PGQueryInsert<Type> {
//   returning<Selection extends PGSelectionBase>(
//     selection: Selection,
//   ): PGQueryInsert<PGSelectionType<Selection>>;
//
//   onConflictDoNothing(column: PGColumn<unknown>): PGQueryInsert<Type>;
// }

// TODO:
//
// /**
//  * The upper bound for an insertion map. Specifies the columns to be inserted.
//  */
// type PGInsertionBase = {
//   [key: string]: PGColumn<unknown>;
// };
//
// /** The type of an object to be inserted. */
// type PGInsertionType<Selection extends PGInsertionBase> = {
//   [Key in keyof Selection]: PGExpressionType<Selection[Key]>
// };

/**
 * Some expression in a Postgres SQL query. The expression has the type of it’s
 * type parameter.
 */
export class PGExpression<Type> {
  /** An expression which is simply the literal “true”. */
  static true = new PGExpression<true>(sql`true`);

  constructor(private readonly query: SQLQuery) {}

  /**
   * True if this expression equals the provided expression.
   */
  equals(expression: PGExpression<Type> | Type): PGExpression<boolean> {
    let rhs: SQLQuery;
    if (expression instanceof PGExpression) {
      rhs = expression.query;
    } else {
      rhs = sql.value(expression);
    }
    return new PGExpression(sql`${this.query} = ${rhs}`);
  }

  /**
   * True if both the current expression and the provided expression are true.
   * Cannot call this method if the `Type` is not `boolean`.
   */
  and(
    expression: Type extends boolean ? PGExpression<boolean> | boolean : never,
  ): PGExpression<boolean> {
    let rhs: SQLQuery;
    if (expression instanceof PGExpression) {
      rhs = (expression as PGExpression<unknown>).query;
    } else {
      rhs = sql.value(expression);
    }
    return new PGExpression(sql`${this.query} AND ${rhs}`);
  }

  /**
   * True if this expression is equal to any of the provided expression.
   */
  any(values: ReadonlyArray<Type>): PGExpression<boolean> {
    return new PGExpression(sql`${this.query} = ANY (${sql.value(values)})`);
  }

  /**
   * This expression only evaluates to true when the sub-query returns at least
   * one row.
   *
   * **IMPORTANT:** Will not apply our table’s privacy policy to the sub-query.
   */
  static ignorePrivacy_exists(
    query: PGQuerySelect<unknown>,
  ): PGExpression<boolean> {
    return new PGExpression(
      sql`EXISTS (${query.ignorePrivacy_generateQuery()})`,
    );
  }

  /**
   * Generate a SQL query for this expression.
   */
  generateQuery(): SQLQuery {
    return this.query;
  }
}

/**
 * Gets the type of a `PGExpression`.
 */
export type PGExpressionType<
  Expression extends PGExpression<unknown>
> = Expression extends PGExpression<infer Type> ? Type : never;

/**
 * Represents a column expression. A column expression has a table and a
 * column name.
 */
export class PGColumn<Type> extends PGExpression<Type> {
  constructor(
    public readonly tableName: string,
    public readonly columnName: string,
  ) {
    super(sql.identifier(tableName, columnName));
  }
}

/**
 * A linked list data structure which allows for O(1) immutable prepends.
 */
type LinkedList<Value> = null | {
  readonly value: Value;
  readonly next: LinkedList<Value>;
};
