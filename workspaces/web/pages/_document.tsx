import Document, {
  Head,
  Main,
  NextScript,
  NextDocumentContext,
} from "next/document";
import * as React from "react";
import {AppRegistry} from "react-native";

// Force Next-generated DOM elements to fill their parent's height
const normalizeNextElements = `
  #__next {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
`;

export default class MyDocument extends Document {
  static async getInitialProps({renderPage}: NextDocumentContext) {
    AppRegistry.registerComponent("Main", () => Main);
    const {getStyleElement} = (AppRegistry as any).getApplication("Main");
    const page = renderPage();
    const styles = [
      <style dangerouslySetInnerHTML={{__html: normalizeNextElements}} />, // eslint-disable-line react/jsx-key
      getStyleElement(),
    ];
    return {...page, styles: React.Children.toArray(styles)};
  }

  render() {
    return (
      <html style={{height: "100%"}}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://use.typekit.net/yno3yns.css" />
        </Head>
        <body style={{height: "100%", overflow: "hidden"}}>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
