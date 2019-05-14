import chalk from "chalk";

/**
 * Simple utility for logging an unexpected error.
 *
 * TODO: Better error handling. At least record that an error happened in our
 * monitoring software.
 */
export function logError(error: unknown) {
  // eslint-disable-next-line no-console
  console.error(
    chalk.red(
      error instanceof Error ? error.stack || error.message : String(error),
    ),
  );
}
