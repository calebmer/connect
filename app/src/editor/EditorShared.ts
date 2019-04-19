/**
 * The props accepted by an `<Editor>` component.
 */
export type EditorProps = {
  /**
   * The minimum height of our editor. The editor may always grow so we never
   * accept anything more than a minimum height.
   */
  minHeight?: number;

  /**
   * Optional placeholder content when the editor is empty.
   */
  placeholder?: string;

  /**
   * Is the editor disabled? The user will still be able to read the contents
   * of the editor but they will not be able to change those contents.
   */
  disabled?: boolean;

  /**
   * Event that’s fired whenever the editor content changes. We don’t provide
   * the full content since that is expensive to compute. We only provide
   * information that is cheap to compute.
   */
  onChange?: (info: EditorChangeInfo) => void;
};

/**
 * Information we get whenever the editor input changes. We don’t get the full
 * editor contents on every change since the full editor contents can be
 * expensive to compute.
 */
export type EditorChangeInfo = {
  /**
   * Is the editor content either empty or only whitespace?
   */
  isWhitespaceOnly: boolean;
};

/**
 * The instance of an `<Editor>` component.
 */
export type EditorInstance = {
  /**
   * Get the content the user has currently input into the text area. This
   * operation might be expensive.
   */
  readonly getContent: () => string;

  /**
   * Focuses the editor text input area.
   */
  readonly focus: () => void;
};
