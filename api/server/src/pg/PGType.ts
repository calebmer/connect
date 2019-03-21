import {DateTime} from "@connect/api-client";

/**
 * Some Postgres type. By default, all types are non-null.
 */
export class PGType<Type> {
  /** `INT`. */
  static readonly int = new PGType<number>();

  /** `TEXT` */
  static readonly text = new PGType<string>();

  /** `TIMESTAMP` */
  static readonly timestamp = new PGType<DateTime>();

  /** `UUID` */
  static readonly uuid = new PGType<string>();

  /**
   * Gets a nullable variant of this Postgres type.
   */
  public nullable(): PGType<Type | null> {
    return this;
  }
}

/**
 * Gets the type from a `PGType`.
 */
export type PGTypeGet<T extends PGType<unknown>> = T extends PGType<infer Type>
  ? Type
  : never;
