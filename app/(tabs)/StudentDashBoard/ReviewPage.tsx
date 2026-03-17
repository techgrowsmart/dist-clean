import React, { useState } from 'react';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../config';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { isTablet } from '../../../utils/devices';
import { Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import {
  RedHatDisplay_400Regular,
  RedHatDisplay_500Medium,
} from '@expo-google-fonts/red-hat-display';

const TAGS = [
  'Best teacher',
  'Price',
  'Great notes',
  'Quality of Class',
  'Tution',
  'Value for Money',
  'Unique and Easy Class',
];

const isWeb = Platform.OS === 'web';
const GREEN = '#4caf50';

export default function ReviewPage() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    RedHatDisplay_500Medium,
    RedHatDisplay_400Regular,
  });

  const { teacherName, teacherEmail, teacherProfilePic } =
    useLocalSearchParams<{
      teacherName: string;
      teacherEmail: string;
      teacherProfilePic: string;
    }>();

  const router = useRouter();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const profilePicUrl = teacherProfilePic
    ? decodeURIComponent(teacherProfilePic)
    : null;

  const initials = teacherName ? teacherName.charAt(0).toUpperCase() : 'T';

  const handleCancel = () => {
    router.push('/StudentDashBoard/Student');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const logAllAsyncStorageItems = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      stores.forEach(([key, value]) => {
        console.log(` ${key}:`, value);
      });
    } catch (e) {
      console.error('Error logging AsyncStorage items:', e);
    }
  };

  const handleSubmit = async () => {
    try {
      await logAllAsyncStorageItems();
      const studentEmail = await AsyncStorage.getItem('user_email');
      const studentName = await AsyncStorage.getItem('studentName');
      const studentProfilePic = await AsyncStorage.getItem('studentProfilePic');

      if (!studentEmail || !studentName) {
        alert('Student details missing in AsyncStorage');
        return;
      }

      const reviewData = {
        teacherEmail,
        teacherName,
        studentEmail,
        studentName,
        studentProfilePic: studentProfilePic || '',
        rating,
        selectedTags,
        reviewText,
      };

      const response = await fetch(`${BASE_URL}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        router.push('/StudentDashBoard/ReviewVerification');
      } else {
        const error = await response.json();
        console.error('Error submitting review:', error);
        alert('Failed to submit review');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Something went wrong');
    }
  };

  const displayRating = hoverRating || rating;

  if (isWeb) {
    return (
      <div style={webStyles.overlay}>
        <div style={webStyles.modal}>

          <div style={webStyles.header}>
            <button style={webStyles.closeBtn} onClick={handleCancel}>
              ✕
            </button>
          </div>

          <div style={webStyles.body}>

            <div style={webStyles.profileRow}>
              <div style={webStyles.avatarWrap}>
                {profilePicUrl && !imageError ? (
                  <img
                    src={profilePicUrl}
                    alt={teacherName ?? 'Teacher'}
                    style={webStyles.avatarImg}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                ) : (
                  <div style={webStyles.avatarInitialWrap}>
                    <span style={webStyles.avatarInitialText}>{initials}</span>
                  </div>
                )}
              </div>
              <div>
                <div style={webStyles.teacherName}>{teacherName}</div>
                <div style={webStyles.teacherEmail}>{teacherEmail}</div>
              </div>
            </div>

            <div style={webStyles.ratingSection}>
              <div style={webStyles.sectionLabel}>Overall Rating:</div>
              <div style={webStyles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    style={{
                      ...webStyles.star,
                      color: star <= displayRating ? '#ffc979' : '#ccc',
                    }}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div style={webStyles.ratingCaption}>{displayRating} out of 5</div>
            </div>

            <div style={webStyles.sectionLabel}>What did you like?</div>
            <div style={webStyles.tagsWrap}>
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  style={{
                    ...webStyles.tagChip,
                    ...(selectedTags.includes(tag) ? webStyles.tagChipActive : {}),
                  }}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div style={webStyles.sectionLabel}>Write about your experience</div>
            <textarea
              style={webStyles.textarea}
              placeholder="How was your experience?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <div style={webStyles.btnRow}>
              <button style={webStyles.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button style={webStyles.publishBtn} onClick={handleSubmit}>
                Publish review
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeIcon}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrapper}>

        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            {imageLoading && profilePicUrl && !imageError && (
              <ActivityIndicator
                size="small"
                color={GREEN}
                style={styles.loader}
              />
            )}
            {profilePicUrl && !imageError ? (
              <Image
                source={{ uri: profilePicUrl }}
                style={styles.profilePic}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            ) : (
              <View style={styles.initialContainer}>
                <Text style={styles.initialText}>{initials}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.teacherName}>{teacherName}</Text>
            <Text style={styles.teacherEmail}>{teacherEmail}</Text>
          </View>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Overall Rating:</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name="star"
                  size={28}
                  color={star <= rating ? '#ffc979' : '#808080'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ marginTop: 4, fontSize: 14, color: 'gray' }}>
            {rating} out of 5
          </Text>
        </View>

        <Text style={styles.sectionTitle}>What did you like?</Text>
        <View style={styles.tagsContainer}>
          {TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                selectedTags.includes(tag) && styles.tagSelected,
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={
                  selectedTags.includes(tag)
                    ? styles.tagTextSelected
                    : styles.tagText
                }
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>How was your experience?</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="How was your experience?"
          placeholderTextColor="#aaa"
          value={reviewText}
          onChangeText={setReviewText}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={[styles.buttonText, { color: '#000' }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Publish review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const webStyles: Record<string, React.CSSProperties> = {
  overlay: {
    minHeight: '100vh',
    background: '#ddf7de',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Red Hat Display', sans-serif",
    boxSizing: 'border-box',
  },
  modal: {
    background: GREEN,
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
  },
  header: {
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 22,
    lineHeight: '1',
    padding: '4px 8px',
    borderRadius: '50%',
  },
  body: {
    background: GREEN,
    padding: '24px 24px 20px',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  profileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    marginBottom: 22,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
    background: '#c8f0c8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  avatarInitialWrap: {
    width: '100%',
    height: '100%',
    background: '#c8f0c8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 38,
    fontWeight: '700',
    color: GREEN,
    fontFamily: "'Poppins', sans-serif",
  },
  teacherName: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    color: '#111',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 13,
    color: '#888',
  },
  ratingSection: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#222',
    marginBottom: 10,
  },
  starsRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 6,
  },
  star: {
    fontSize: 30,
    cursor: 'pointer',
    transition: 'transform 0.1s',
    lineHeight: '1',
  },
  ratingCaption: {
    fontSize: 13,
    color: '#460000',
    marginTop: 4,
  },
  tagsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  tagChip: {
    padding: '7px 14px',
    borderRadius: 20,
    border: `1.5px solid ${GREEN}`,
    background: '#fff',
    fontSize: 13,
    fontWeight: 500,
    color: '#111',
    cursor: 'pointer',
    fontFamily: "'Red Hat Display', sans-serif",
    transition: 'background 0.15s',
  },
  tagChipActive: {
    background: '#f5b726',
    borderColor: '#f5b726',
    color: '#000',
  },
  textarea: {
    width: '100%',
    height: 120,
    border: `1.5px solid ${GREEN}`,
    borderRadius: 10,
    padding: '12px 14px',
    fontFamily: "'Red Hat Display', sans-serif",
    fontSize: 14,
    color: '#111',
    resize: 'none',
    outline: 'none',
    marginBottom: 22,
    boxSizing: 'border-box',
  },
  btnRow: {
    display: 'flex',
    gap: 14,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 30,
    background: '#fff',
    border: '1.5px solid #ff4444',
    color: '#222',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'Red Hat Display', sans-serif",
  },
  publishBtn: {
    flex: 1,
    height: 46,
    borderRadius: 30,
    background: '#0d8aff',
    border: 'none',
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'Red Hat Display', sans-serif",
  },
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    height: hp('9%'),
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: wp('5%'),
    paddingTop: hp('2%'),
  },
  closeIcon: {
    padding: 4,
  },
  contentWrapper: {
    padding: wp('5.3%'),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
  },
  imageContainer: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: wp('3%'),
    marginRight: wp('4%'),
    overflow: 'hidden',
    backgroundColor: '#c8f0c8',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  initialContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#c8f0c8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: wp('9%'),
    fontWeight: 'bold',
    color: GREEN,
    fontFamily: 'Poppins_400Regular',
  },
  teacherName: {
    fontSize: isTablet ? wp('4%') : wp('4.5%'),
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins_400Regular',
  },
  teacherEmail: {
    color: 'gray',
    fontSize: isTablet ? wp('3.2%') : wp('3.7%'),
  },
  ratingSection: {
    marginBottom: hp('2.5%'),
  },
  ratingLabel: {
    fontSize: isTablet ? wp('3.7%') : wp('4.2%'),
    marginBottom: hp('1%'),
    fontWeight: '500',
  },
  stars: {
    flexDirection: 'row',
  },
  sectionTitle: {
    fontSize: isTablet ? wp('3.8%') : wp('4.4%'),
    fontWeight: '600',
    marginBottom: hp('1.2%'),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: hp('2.5%'),
  },
  tag: {
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.8%'),
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: wp('5.3%'),
    marginRight: wp('2.5%'),
    marginBottom: hp('1%'),
  },
  tagSelected: {
    backgroundColor: '#f5b726',
    borderColor: '#f5b726',
  },
  tagText: {
    color: '#000',
    fontSize: isTablet ? wp('3%') : wp('3.5%'),
  },
  tagTextSelected: {
    color: '#000',
    fontSize: isTablet ? wp('3%') : wp('3.5%'),
  },
  textArea: {
    width: '100%',
    height: hp('21.5%'),
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1.5%'),
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: wp('2%'),
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: isTablet ? wp('3%') : wp('3.5%'),
    lineHeight: hp('2.5%'),
    fontFamily: 'RedHatDisplay_400Regular',
    textAlignVertical: 'top',
    marginBottom: hp('2.5%'),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: wp('43%'),
    height: hp('5.4%'),
    paddingHorizontal: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('7%'),
    backgroundColor: GREEN,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: isTablet ? wp('3.2%') : wp('3.8%'),
    fontFamily: 'RedHatDisplay_400Regular',
    fontWeight: '500',
    lineHeight: hp('2.2%'),
  },
});
