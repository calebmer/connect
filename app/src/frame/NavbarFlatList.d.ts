// We use a `.d.ts` file to export a function type that preserves the generic
// type of `<FlatList>`.

import {FlatListProps, ScrollView} from "react-native";
import React, {ReactNode} from "react";
import {NavbarLayoutProps} from "./NavbarLayout";

export declare function NavbarFlatList<Item>(
  props: NavbarLayoutProps &
    FlatListProps<Item> &
    React.RefAttributes<ScrollView>,
): JSX.Element;
