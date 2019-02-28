import * as React from "react";
import {StyleSheet, View, Text} from "react-native";
import {$} from "./DesignSystem";

export function DesignPlayground() {
  return (
    <View style={{paddingHorizontal: 18, paddingVertical: 16}}>
      <Text style={$.titleText}>Name of the Wind</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          paddingTop: 4,
          paddingBottom: 8,
        }}
      >
        <Text style={$.labelText}>Patrick Rothfuss</Text>
        <Text style={[{paddingLeft: 8}, $.metaText]}>2007</Text>
      </View>
      <Text style={$.bodyText}>
        Contrary to popular belief, not all traveling performers are of the Ruh.
        My troupe was not some poor batch of mummers, japing at crossroads for
        pennies, singing for our suppers. We were court performers, Lord
        Greyfallow’s Men. Our arrival in most towns was more of an event than
        the Midwinter Pageantry and Solinade Games rolled together. There were
        usually at least eight wagons in our troupe and well over two dozen
        performers: actors and acrobats, musicians and hand magicians, jugglers
        and jesters: My family.{"\n\n"}My father was a better actor and musician
        than any you have ever seen. My mother had a natural gift for words.
        They were both beautiful, with dark hair and easy laughter. They were
        Ruh down to their bones, and that, really, is all that needs to be said.
      </Text>
    </View>
  );
}
