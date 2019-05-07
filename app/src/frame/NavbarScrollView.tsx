import {NavbarLayout, NavbarLayoutProps} from "./NavbarLayout";
import {ScrollView, ScrollViewProps} from "react-native";
import React from "react";

export const NavbarScrollView: React.ComponentType<
  NavbarLayoutProps & ScrollViewProps & React.RefAttributes<ScrollView>
> = NavbarLayout.create(ScrollView);
