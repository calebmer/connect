import React from "react";

/**
 * The layout we’re using for the `<GroupHome>` component.
 */
enum GroupHomeLayout {
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

const GroupHomeLayoutContext = React.createContext(GroupHomeLayout.Mobile);

const _GroupHomeLayout = {...GroupHomeLayout, Context: GroupHomeLayoutContext};
export {_GroupHomeLayout as GroupHomeLayout};
