import Document, {
  Head,
  Main,
  NextScript,
  NextDocumentContext,
} from "next/document";
import * as React from "react";
import { AppRegistry } from "react-native";

// Force Next-generated DOM elements to fill their parent's height
let normalizeNextElements = `
  #__next {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
`;

export default class MyDocument extends Document {
  static async getInitialProps({ renderPage }: NextDocumentContext) {
    AppRegistry.registerComponent("Main", () => Main);
    let { getStyleElement } = (AppRegistry as any).getApplication("Main");
    let page = renderPage();
    let styles = [
      <style dangerouslySetInnerHTML={{ __html: normalizeNextElements }} />, // eslint-disable-line react/jsx-key
      getStyleElement(),
    ];
    return { ...page, styles: React.Children.toArray(styles) };
  }

  render() {
    return (
      <html style={{ height: "100%" }}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <body style={{ height: "100%", overflow: "hidden" }}>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
