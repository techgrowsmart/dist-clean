import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface TeacherPostComposerProps {
  onCreatePost?: (content: string, imageUri?: string | null) => Promise<void>;
  placeholder?: string;
}

const inputBar = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputWrapper: {
    flex: 1,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Poppins_400Regular',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  textInputOverLimit: {
    color: '#EF4444',
  },
  wordCount: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
    textAlign: 'right',
  },
  wordCountOverLimit: {
    color: '#EF4444',
  },
  postButton: {
    backgroundColor: '#3B5BFE',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  postButtonTextDisabled: {
    color: '#9CA3AF',
  },
  imageButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  removeImageButton: {
    padding: 4,
    marginLeft: 4,
  },
});

export const TeacherPostComposer: React.FC<TeacherPostComposerProps> = ({
  onCreatePost,
  placeholder = "Post your Grow Thoughts..."
}) => {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Word count validation
  const wordCount = postContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isOverLimit = wordCount > 100;

  const handleContentChange = (text: string) => {
    const newWordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (newWordCount <= 100) {
      setPostContent(text);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select an image');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        setSelectedImage(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if ((!postContent.trim() && !selectedImage) || isSubmitting || isOverLimit) return;
    
    setIsSubmitting(true);
    try {
      await onCreatePost(postContent.trim(), selectedImage);
      setPostContent('');
      setSelectedImage(null);
      Alert.alert('Success', 'Your post has been published!');
    } catch (error: any) {
      console.error('Error creating post:', error);
      const errorMessage = error?.message || 'Failed to create post. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={inputBar.container}>
      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={inputBar.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={inputBar.imagePreview} />
          <TouchableOpacity
            style={inputBar.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <View style={inputBar.inputRow}>
        <TouchableOpacity style={inputBar.imageButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={22} color="#6366F1" />
        </TouchableOpacity>
        <View style={inputBar.inputWrapper}>
          <TextInput
            style={[inputBar.textInput, isOverLimit && inputBar.textInputOverLimit]}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={postContent}
            onChangeText={handleContentChange}
            multiline
            maxLength={500}
            editable={!isSubmitting}
            onSubmitEditing={handleSubmit}
          />
          <Text style={[inputBar.wordCount, isOverLimit && inputBar.wordCountOverLimit]}>
            {wordCount}/100
          </Text>
        </View>
        <TouchableOpacity
          style={[inputBar.postButton, (!postContent.trim() && !selectedImage || isSubmitting) && inputBar.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={(!postContent.trim() && !selectedImage) || isSubmitting}
        >
          <Text style={[inputBar.postButtonText, (!postContent.trim() && !selectedImage || isSubmitting) && inputBar.postButtonTextDisabled]}>
            {isSubmitting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TeacherPostComposer;
