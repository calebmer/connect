/**
 * The props accepted by an `<Editor>` component.
 */
export type EditorProps = {
  /**
   * The current content of the editor.
   */
  content: string;

  /**
   * Optional placeholder content when the editor is empty.
   */
  placeholder?: string;

  /**
   * Automatically focuses the editor when it mounts.
   */
  autoFocus?: boolean;

  /**
   * The user edited the content in some way and this is the new value.
   */
  onChange: (content: string) => void;
};
