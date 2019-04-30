// We use a `.d.ts` file to export a function type that preserves the generic
// type of `<VirtualizedList>`.

import React, {ReactNode} from "react";
import {ScrollView, VirtualizedListProps} from "react-native";
import {NavbarLayoutProps} from "./NavbarLayout";

export declare function NavbarVirtualizedList<Item>(
  props: NavbarLayoutProps &
    VirtualizedListProps<Item> &
    React.RefAttributes<ScrollView>,
): JSX.Element;
