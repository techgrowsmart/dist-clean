import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform } from 'react-native';

interface TeacherPostComposerProps {
  onCreatePost?: (content: string) => Promise<void>;
  placeholder?: string;
}

const inputBar = StyleSheet.create({
  container: {
    position: 'sticky',
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    fontFamily: 'RedHatDisplay_400Regular',
    marginRight: 12,
  },
  postButton: {
    backgroundColor: '#4A7BF7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'RedHatDisplay_600SemiBold',
  },
  postButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export const TeacherPostComposer: React.FC<TeacherPostComposerProps> = ({ 
  onCreatePost, 
  placeholder = "Post your Grow Thoughts..."
}) => {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!postContent.trim()) {
      Alert.alert('Error', 'Please enter some content for your post.');
      return;
    }

    if (!onCreatePost) {
      Alert.alert('Error', 'Post creation not available.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreatePost(postContent.trim());
      setPostContent('');
      Alert.alert('Success', 'Your post has been published!');
    } catch (error: any) {
      console.error('Error creating post:', error);
      // Show specific error message if available
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
      <View style={inputBar.inputRow}>
        <TextInput
          style={inputBar.textInput}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={postContent}
          onChangeText={setPostContent}
          multiline
          maxLength={500}
          editable={!isSubmitting}
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity 
          style={[inputBar.postButton, (!postContent.trim() || isSubmitting) && inputBar.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={!postContent.trim() || isSubmitting}
        >
          <Text style={[inputBar.postButtonText, (!postContent.trim() || isSubmitting) && inputBar.postButtonTextDisabled]}>
            {isSubmitting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TeacherPostComposer;
