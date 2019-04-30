// This is a `.js` file so that we can get the types from our sibling
// `.d.ts` file with the same name.

import {NavbarLayout} from "./NavbarLayout";
import {VirtualizedList} from "react-native";

export const NavbarVirtualizedList = NavbarLayout.create(VirtualizedList);
