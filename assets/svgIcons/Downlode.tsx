import React from "react";
import Svg, { Path } from "react-native-svg";

const DownloadIcon = ({ size = 24, color = "#c2c2c2" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M0 0h24v24H0z" fill="none" />
    <Path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </Svg>
);

export default DownloadIcon;
