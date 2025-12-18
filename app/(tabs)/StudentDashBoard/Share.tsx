import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import React from 'react'
import { Feather, FontAwesome, FontAwesome6 } from '@expo/vector-icons'
import { Entypo } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

const { width } = Dimensions.get('window')
const ICON_SIZE = wp(16)

const items = [
  { id: "1", title: "Copy", icon: "copy", iconType: "Feather", color: "#6C757D" },
  { id: "2", title: "Messenger", icon: "facebook-messenger", iconType: "FontAwesome6", color: "#7B61FF" },
  { id: "3", title: "Linkedin", icon: "linkedin", iconType: "FontAwesome", color: "#0A66C2" },
  { id: "4", title: "Facebook", icon: "facebook", iconType: "FontAwesome", color: "#1877F2" },
  { id: "5", title: "WhatsApp", icon: "whatsapp", iconType: "FontAwesome", color: "#25D366" },
  { id: "6", title: "Mail", icon: "mail", iconType: "Feather", color: "#EA4335" },
]

const Share = () => {
  const navigation = useNavigation()

  const handleShare = (item) => {
    console.log(`Sharing via ${item.title}`)
  }

  const renderIcon = (item) => {
    const IconComponent = item.iconType === "Feather" ? Feather : item.iconType === "FontAwesome6" ? FontAwesome6 : FontAwesome
    return <IconComponent name={item.icon} size={ICON_SIZE * 0.5} color="#FFFFFF" />
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cross Icon in top right corner */}
        <TouchableOpacity 
          style={styles.crossButton}
          onPress={() => navigation.goBack()}
        >
          <Entypo name="cross" size={wp(8)} color="black" />
        </TouchableOpacity>
        
        <Image source={require('../../../assets/image/share.png')} style={styles.shareImage} resizeMode="contain" />
        
        {/* Centered Share via text */}

        {/* Content container that pushes to bottom */}
        <View style={styles.bottomContent}>
          <Text style={styles.shareViaText}>Share via</Text>

          <View style={styles.promoHeader}>
            <Text style={styles.promoTitle}>Sharing is caring !</Text>
            <Text style={styles.promoSubtitle}>Spread the word and connect with others .</Text>
          </View>
          
          <View style={styles.grid}>
            {items.map((item) => (
              <TouchableOpacity key={item.id} style={styles.item} onPress={() => handleShare(item)}>
                <View style={[styles.icon, { backgroundColor: item.color }]}>{renderIcon(item)}</View>
                <Text style={styles.label}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Share

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  container: { flex: 1, backgroundColor: "#FFF", paddingHorizontal: wp("5%") },
  // Cross button styles
  crossButton: {
    position: 'absolute',
    top: hp("2%"),
    right: wp("5%"),
    zIndex: 10,
    width: wp(10),
    height: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareImage: { width: wp("110%"), height: hp("55%"), marginTop: hp("1%"), alignSelf: 'center' },
  shareViaText: { fontSize: wp("6%"), fontWeight: "700", color: "#000", textAlign: 'center', marginVertical: hp("2%") },
  bottomContent: { flex: 1, justifyContent: 'flex-end', paddingBottom: hp("10%") }, // Pushes to bottom with small gap
  promoHeader: { width: '100%', backgroundColor: '#7058ef', borderRadius: wp("20%"), paddingVertical: hp("2.5%"), paddingHorizontal: wp("5%"), alignItems: 'center', justifyContent: 'center', marginBottom: hp("3%") },
  promoTitle: { fontSize: wp("5%"), fontWeight: "700", color: "#FFF", marginBottom: hp("0.5%") },
  promoSubtitle: { fontSize: wp("3.5%"), color: "#FFFFFF", textAlign: "center", fontWeight: "400" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width: '100%' },
  item: { width: "30%", marginBottom: hp("2%") },
  icon: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2, justifyContent: "center", alignItems: "center", marginBottom: hp("1%"), alignSelf: 'center' },
  label: { fontSize: wp("3.5%"), color: "#000", textAlign: "center", fontWeight: "500" },
})