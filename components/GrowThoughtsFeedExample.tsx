import React from 'react';
import { View, StyleSheet } from 'react-native';
import GrowThoughtsFeed from './GrowThoughtsFeed';

const GrowThoughtsFeedExample: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Basic usage */}
      <GrowThoughtsFeed />
      
      {/* Customized usage */}
      {/* 
      <GrowThoughtsFeed
        backgroundColor="#F8FAFC"
        headerTitle="Community Feed"
        headerSubtitle="Share your thoughts with the community"
        placeholder="Share something amazing..."
        showHeader={true}
        showInputSection={true}
        onPostCreated={(post) => {
          console.log('New post created:', post);
        }}
        customStyles={{
          container: {
            paddingHorizontal: 20,
          },
          postCard: {
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
          }
        }}
      />
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GrowThoughtsFeedExample;
