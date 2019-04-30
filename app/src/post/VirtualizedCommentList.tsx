import {ScrollView, ScrollViewProps, View} from "react-native";
import React from "react";

type Props = {
  itemCount: number;
  renderItem: (index: number) => React.Node;

  initialRenderItemCount: number;

  ScrollViewComponent: React.ComponentType<ScrollViewProps>;
};

type State = {
  first: number;
  last: number;
};

export class VirtualizedCommentList extends React.Component<Props, State> {
  static defaultProps = {
    ScrollViewComponent: ScrollView,
  };

  state = {
    first: 0,
    last: this.props.initialRenderItemCount,
  };

  render() {
    const {itemCount, renderItem, ScrollViewComponent} = this.props;
    const {first, last} = this.state;

    const cells = [];
    for (let i = first; i <= last && i < itemCount; i++) {
      cells.push(<View key={i}>{renderItem(i)}</View>);
    }

    return <ScrollViewComponent>{cells}</ScrollViewComponent>;
  }
}
