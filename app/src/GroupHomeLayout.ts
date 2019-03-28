import React from "react";

/**
 * The layout we’re using for the `<GroupHome>` component.
 */
export enum GroupHomeLayout {
  /**
   * When we are on mobile the each of our layers from the laptop layout will
   * take up the entire screen.
   */
  Mobile,

  /**
   * When we are on a laptop we will use a multi-layered side navigation.
   */
  Laptop,
}

export const GroupHomeLayoutContext = React.createContext(
  GroupHomeLayout.Mobile,
);
