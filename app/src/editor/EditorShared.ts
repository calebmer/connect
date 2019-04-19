/**
 * The props accepted by an `<Editor>` component.
 */
export type EditorProps = {
  /**
   * Should we use a larger font size than the regular body font size?
   */
  large?: boolean;

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
   * The minimum height of our editor. The editor may always grow so we never
   * accept anything more than a minimum height.
   */
  minHeight?: number;

  /**
   * The maximum height of our editor. By setting this property you also enable
   * scrolling. When the editor surpasses this height the user will be able to
   * scroll to see content that is now out of view.
   */
  maxHeight?: number;

  /**
   * Adds some padding to the editor.
   */
  paddingRight?: number;

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