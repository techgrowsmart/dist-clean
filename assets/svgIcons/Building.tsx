import React from 'react';
import Svg, { Path } from 'react-native-svg';

const Building = ({ size = 24, color = '#A855F7' }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
  >
    <Path 
      strokeLinejoin="round" 
      strokeLinecap="round" 
      strokeWidth="1.5" 
      stroke={color} 
      d="M1.5 16.5008H16.5M4 14.0008V7.33417M7.33333 14.0008V7.33417M10.6667 14.0008V7.33417M14 14.0008V7.33417M15.6667 4.83417L9.35333 0.888334C9.22515 0.808221 9.16106 0.768164 9.09233 0.752545C9.03155 0.738735 8.96845 0.738735 8.90767 0.752545C8.83894 0.768164 8.77485 0.808221 8.64667 0.888334L2.33333 4.83417H15.6667Z"
    />
  </Svg>
);

export default Building;