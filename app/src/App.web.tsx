import React, {useEffect, useState} from "react";
import {getRoute, history} from "./router/Route.web";
import {TitleText} from "./atoms";

/**
 * Manages routing based on the location for our web-app.
 */
export function App() {
  const [location, setLocation] = useState(history.location);

  useEffect(() => {
    const unlisten = history.listen(newLocation => {
      setLocation(newLocation);
    });
    return unlisten;
  }, []);

  // Get the element to render for this location.
  const element = getRoute(location);

  // Render a 404 page if our router was not able to create an element for
  // this location.
  if (element === undefined) {
    return <TitleText>TODO: 404 Not Found</TitleText>;
  } else {
    return element;
  }
}
