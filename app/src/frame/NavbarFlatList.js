// This is a `.js` file so that we can get the types from our sibling
// `.d.ts` file with the same name.

import {FlatList} from "react-native";
import {NavbarLayout} from "./NavbarLayout";

export const NavbarFlatList = NavbarLayout.create(FlatList);
