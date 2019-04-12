/**
 * The props accepted by an `<Editor>` component.
 */
export type EditorProps = {
  /**
   * Optional placeholder content when the editor is empty.
   */
  placeholder?: string;
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
