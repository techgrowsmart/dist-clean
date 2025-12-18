import React from "react";
import Svg, { Path } from "react-native-svg";

const PhoneIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
  >
    <Path d="M0 0h24v24H0z" fill="none" />
    <Path d="M6.62 10.79a15.91 15.91 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24 11.36 11.36 0 0 0 3.58.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.58 1 1 0 0 1-.24 1.05l-2.2 2.2z" />
  </Svg>
);

export default PhoneIcon;
