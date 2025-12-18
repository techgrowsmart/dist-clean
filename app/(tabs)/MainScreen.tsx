import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get("window");

const slides = [
  {
    key: "1",
    title: "Your favorite classes\nare now online",
    description: "Now you can take your classes\nfrom anywhere you want to, learn\non the go.",
    image: require("../../assets/image/welcome-1.png"),
  },
  {
    key: "2",
    title: "Live Classes + Personal Doubt Sessions",
    description: "Attend live, interactive classes and book\none-on-one sessions for instant doubt\nclearing and deeper understanding.",
    image: require("../../assets/image/welcome-3.png"),
  },
  {
    key: "3",
    title: "Learn from Top-Rated\nTeachers Across India",
    description: "Get coached by the best — access expert\neducators, subject toppers, and professional\ntutors from every corner of the country.",
    image: require("../../assets/image/welcome-2.png"),
  },
  {
    key: "4",
    title: "Tuition Made Flexible\nAnytime, Anywhere",
    description: "Missed a class? No worries. Watch recorded\nlessons, download notes, and revise at\nyour own pace, anytime.",
    image: require("../../assets/image/welcome-4.png"),
  },
];

export default function HomePage() {
  const router = useRouter();
  const flatListRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentSlideIndex + 1, animated: true });
    } else {
      router.replace("/Login");
    }
  };

  const handleSkip = () => {
    router.replace("/Login");
  };

  const updateCurrentSlideIndex = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  let [fontsLoaded] = useFonts({
    Poppins_Regular: Poppins_400Regular,
    Poppins_Medium: Poppins_500Medium,
    Poppins_Bold: Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  const SlideItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.topSection}>
        <View style={styles.imageBox}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />
        </View>
      </View>
      <View style={styles.leftExtension} />
      <View style={styles.rightExtension} />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => (
        <View key={index} style={[styles.dot, currentSlideIndex === index ? styles.activeDot : styles.inactiveDot]} />
      ))}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        renderItem={({ item }) => <SlideItem item={item} />}
        getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
      />

      {renderPaginationDots()}

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentSlideIndex === slides.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", position: "relative" },
  slide: { flex: 1, backgroundColor: "#fff", position: "relative" },
  topSection: { backgroundColor: "#609fff", alignItems: "center", paddingTop: hp("8%"), height: hp("61.5%"), justifyContent: "flex-end", paddingBottom: 0 },
  leftExtension: { position: "absolute", bottom: hp("38.5%"), left: 0, width: wp("25%"), height: hp("10%"), backgroundColor: "#609fff", borderTopRightRadius: wp("20%"), transform: [{ rotate: "-15deg" }], zIndex: 1 },
  rightExtension: { position: "absolute", bottom: hp("38.5%"), right: 0, width: wp("25%"), height: hp("10%"), backgroundColor: "#609fff", borderTopLeftRadius: wp("20%"), transform: [{ rotate: "15deg" }], zIndex: 1 },
  imageBox: { width: wp("100%"), height: hp("47%"), overflow: "visible", justifyContent: "center", alignItems: "center", marginBottom: 0, alignSelf: "center", zIndex: 2 },
  image: { width: "100%", height: "100%", borderRadius: wp("4%") },
  contentContainer: { width: "100%", height: hp("60%"), backgroundColor: "#ffffff", borderTopLeftRadius: wp("10%"), borderTopRightRadius: wp("10%"), paddingTop: hp("5%"), paddingHorizontal: wp("1%"), alignItems: "center", marginTop: hp("-2%"), zIndex: 3 },
  title: { color: "#090909", fontSize: wp("8%"), fontFamily: "Poppins_Bold", lineHeight: hp("4.5%"), textAlign: "center", marginBottom: hp("2%") },
  description: { color: "#a4a4a4", fontSize: wp("3.8%"), fontFamily: "Poppins_Regular", lineHeight: hp("2.8%"), textAlign: "center" },
  skipButton: { position: "absolute", top: hp("6%"), right: wp("6%"), zIndex: 10, paddingVertical: hp("1%"), paddingHorizontal: wp("2%") },
  skipText: { fontSize: wp("4.2%"), color: "#ffffff", fontFamily: "Poppins_Medium" },
  button: { position: "absolute", bottom: hp("8%"), left: wp("4%"), width: wp("92%"), height: hp("6.5%"), backgroundColor: "#000000", borderRadius: wp("3%"), justifyContent: "center", alignItems: "center", zIndex: 4 },
  buttonText: { color: "#ffffff", fontSize: wp("4.5%"), fontFamily: "Poppins_Medium" },
  paginationContainer: { position: "absolute", bottom: hp("17.5%"), left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", zIndex: 4 },
  dot: { width: wp("2.2%"), height: wp("2.2%"), borderRadius: wp("1.1%"), marginHorizontal: wp("1.2%") },
  activeDot: { backgroundColor: "#666666", width: wp("8%") },
  inactiveDot: { backgroundColor: "#c4c4c4" },
});