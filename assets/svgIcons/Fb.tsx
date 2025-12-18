
import React from "react";
import Svg, { Path } from "react-native-svg";

const FB = ({ width = 24, height = 24, color = "#FFFFFF" }) => {
  return (
    <Svg
      width={width}
      height={height}
     viewBox="0 0 11 21"
      fill="none"
    >
     
      <Path d="M0 0h24v24H0V0z" fill="none" />

   
      <Path
        d="M7 12.208H9.5L10.5 8.20801H7V6.20801C7 5.17801 7 4.20801 9 4.20801H10.5V0.848008C10.174 0.805008 8.943 0.708008 7.643 0.708008C4.928 0.708008 3 2.36501 3 5.40801V8.20801H0V12.208H3V20.708H7V12.208Z"
        fill={color}
      />
    </Svg>
  );
};

export default FB;
