import chalk from "chalk";

/**
 * Simple utility for logging an unexpected error.
 */
export function logError(error: unknown) {
  // eslint-disable-next-line no-console
  console.error(
    chalk.red(
      error instanceof Error ? error.stack || error.message : String(error),
    ),
  );
}
