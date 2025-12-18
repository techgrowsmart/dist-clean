import React from 'react';
import Svg, { Path } from 'react-native-svg';

const TutorCap = ({ width = 24, height = 24, color = '#fff' }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill={color}
  >
    <Path d="M0 0h24v24H0z" fill="none" />
    <Path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
  </Svg>
);

export default TutorCap;
