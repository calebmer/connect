interface DataTransfer {
  /**
   * Returns the specified data. If there is no such data, returns the empty string.
   */
  getData(format: string): string;
}
