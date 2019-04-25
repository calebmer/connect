import React from "react";
import {NavbarLayout, NavbarLayoutProps} from "./NavbarLayout";
import {ScrollView, ScrollViewProps} from "react-native";

export const NavbarScrollView: React.ComponentType<
  NavbarLayoutProps & ScrollViewProps & React.RefAttributes<ScrollView>
> = NavbarLayout.create(ScrollView);
