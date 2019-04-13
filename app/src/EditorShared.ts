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
};

/**
 * The instance of an `<Editor>` component.
 */
export type EditorInstance = {
  /**
   * Focuses the editor text input area.
   */
  readonly focus: () => void;
};
