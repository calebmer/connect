/**
 * Determines if a URL path matches a provided pattern. A pattern can have
 * variables in it which will capture the value of their path part.
 */
export interface PathPattern<Path extends PathBase> {
  /**
   * Gets an identifier for this path which may be used as a registration
   * identifier, for instance.
   */
  getID(): string;

  /**
   * Prints a path using the variables required by this path‘s pattern.
   */
  print(variables: PathVariableProps<Path>): string;

  /**
   * Parses a path. If we return undefined then the path does not match this
   * pattern. Otherwise we return an object with the variables for this path.
   */
  parse(path: string): PathVariableProps<Path> | undefined;
}

/**
 * Gets the type of a props object with all the variables from our path. Uses
 * `PathVariableKeys` and creates an object with that type.
 */
export type PathVariableProps<Path extends PathBase> = {
  [Key in PathVariableKeys<Path>]: string
};

/**
 * Gets all the variable keys from a path. Here’s how the type works:
 *
 * 1. Get the element type from the path. This will be a union of all the
 *    different tuple element types.
 * 2. Extract the variable name from all the variable element types. All the
 *    constants will become the never type and will be removed from the
 *    resulting type.
 *
 * Some examples:
 *
 * ```ts
 * type A = PathVariableKeys<["user", {variable: "name"}, "post", {variable: "id"}]>;
 * type B = PathVariableKeys<["sign-in"]>;
 * ```
 *
 * The type of `A` will be `"name" | "id"`. The type of `B` will be `never`.
 */
export type PathVariableKeys<Path extends PathBase> =
  // prettier-ignore
  Path extends Array<infer Item>
    ? Item extends {variable: infer Variable} ? Variable : never
    : never;

/**
 * The ”upper bound” of a path type. All paths should be in this general shape,
 * but TypeScript will infer a more specific types for us. For example a tuple
 * instead of an unbounded array.
 */
export type PathBase = Array<string | {variable: string}>;

export const Path = {
  /**
   * Creates a variable path part for use in `Path.create()`.
   */
  variable<Variable extends string>(variable: Variable): {variable: Variable} {
    return {variable};
  },

  /**
   * Creates a new `PathPattern` based on the provided path parts. The path may
   * include a variable part with `Path.variable()`.
   */
  create<Path extends PathBase>(...pathPattern: Path): PathPattern<Path> {
    return {
      getID(): string {
        return pathPattern
          .map(part => (typeof part === "string" ? part : part.variable))
          .join(".");
      },

      print(variables: PathVariableProps<Path>): string {
        let path = "";
        for (let i = 0; i < pathPattern.length; i++) {
          const pathPatternPart = pathPattern[i];
          if (typeof pathPatternPart === "string") {
            path += "/" + pathPatternPart;
          } else {
            path += "/" + (variables as any)[pathPatternPart.variable];
          }
        }
        return path;
      },

      parse(path: string): PathVariableProps<Path> | undefined {
        // Remove leading slash if we have one.
        if (path[0] === "/") {
          path = path.slice(1);
        }

        // If the path is empty, then only successfully parse the path if our
        // pattern has no parts in it.
        if (path === "") {
          return pathPattern.length === 0 ? ({} as any) : undefined;
        }

        // Split the path into its individual parts.
        const pathParts = path.split("/");
        const variables: {[key: string]: string} = {};

        // If we have a different number of parts then our pattern allows we do
        // not successfully parse this path.
        if (pathParts.length !== pathPattern.length) {
          return undefined;
        }

        // Loop through all the parts of our path to make sure they match.
        for (let i = 0; i < pathPattern.length; i++) {
          const pathPatternPart = pathPattern[i];
          const pathPart = decodeURIComponent(pathParts[i]);

          // If our pattern has a string constant then make sure that string is
          // the same as our path.
          if (typeof pathPatternPart === "string") {
            if (pathPart !== pathPatternPart) {
              return undefined;
            }
          } else {
            // If our pattern has a variable part then add the value from our
            // path to our variables object.
            variables[pathPatternPart.variable] = pathPart;
          }
        }

        // If we made it to the end then we have successfully parsed our path!
        return variables;
      },
    };
  },
};
