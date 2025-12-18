import React from "react";
import Svg, { Path } from "react-native-svg";

const BackArrowIcon = ({ width = 10, height = 16, color = "#03070E" }) => (
  <Svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 16" width={width} height={height}>
    <Path
      d="M8.5 15L1.5 8L8.5 1"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default BackArrowIcon;
