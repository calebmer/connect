import React, {ReactNode, useContext, useMemo, useState} from "react";

const PostEditorModal = React.lazy(() => {
  return import("./PostEditorModal").then(m => ({default: m.PostEditorModal}));
});

/**
 * Context for a “new post” modal.
 */
export interface PostEditorModalContext {
  /**
   * Is the post editor modal available? Returns false on small screens where we
   * will not allow the use of the modal.
   */
  readonly available: boolean;

  /**
   * Is the modal currently visible?
   */
  readonly visible: boolean;

  /**
   * If the modal is not currently visible, then show it. Otherwise do nothing.
   */
  show(): void;
}

/**
 * React context for our post modal.
 */
const _PostEditorModalContext = React.createContext<PostEditorModalContext>({
  available: false,
  visible: false,
  show() {
    throw new Error(
      "Must render a <PostEditorModalProvider> to be able to show the modal.",
    );
  },
});

/**
 * Use the `PostEditorModalContext` provided by our context.
 */
export function usePostEditorModalContext(): PostEditorModalContext {
  return useContext(_PostEditorModalContext);
}

/**
 * Provides an instance of `PostEditorModalContext` to the children of this
 * component which allows them to control the modal.
 */
export function PostEditorModalContext({
  available = true,
  children,
}: {
  available?: boolean;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  // Memorize the context value so we don’t create a new one on every render.
  const context: PostEditorModalContext = useMemo(
    () => ({
      available,
      visible,
      show: () => {
        if (available) {
          setVisible(true);
        } else {
          throw new Error("<PostEditorModal> is not available right now.");
        }
      },
    }),
    [available, visible],
  );

  return (
    <_PostEditorModalContext.Provider value={context}>
      {children}

      {/* TODO: Some loading indicator when the bundle is taking too long
          to load. */}
      {available && visible && (
        <React.Suspense fallback={null}>
          <PostEditorModal onClose={() => setVisible(false)} />
        </React.Suspense>
      )}
    </_PostEditorModalContext.Provider>
  );
}
