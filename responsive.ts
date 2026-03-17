
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');


const responsive = {
  width: (percent: number) => width * percent,
  height: (percent: number) => height * percent,
  fontSize: (percent: number) => {
    const scaleFactor = Math.min(width / 375, height / 812);
    return Math.round(percent * 375 * scaleFactor); 
  },
  padding: (percent: number) => width * percent,
  margin: (percent: number) => width * percent,
  borderRadius: (percent: number) => width * percent,
};

export default responsive;
