import React from 'react';
import Svg, { Path } from 'react-native-svg';

const PrivacyAndPolicy = ({ width = 24, height = 24, color = '#fff' }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill={color}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="m21 5-9-4-9 4v6c0 5.55 3.84 10.74 9 12 2.3-.56 4.33-1.9 5.88-3.71l-3.12-3.12a4.994 4.994 0 0 1-6.29-.64 5.003 5.003 0 0 1 0-7.07 5.003 5.003 0 0 1 7.07 0 5.006 5.006 0 0 1 .64 6.29l2.9 2.9C20.29 15.69 21 13.38 21 11V5z" />
    <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
  </Svg>
);

export default PrivacyAndPolicy;
