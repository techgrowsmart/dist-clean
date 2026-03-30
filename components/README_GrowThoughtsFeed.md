# GrowThoughtsFeed Component

A reusable React Native component for displaying a social media-style feed with posts, likes, comments, and posting functionality.

## Features

- **Post Creation**: Users can create text posts with optional images
- **Feed Display**: Scrollable feed of posts with author information
- **Like Functionality**: Like/unlike posts with optimistic updates
- **Comments Modal**: View and add comments to posts (simplified version)
- **Report System**: Report posts and comments (simplified version)
- **Profile Images**: Displays user profile images with fallback to initials
- **Responsive Design**: Adapts to different screen sizes
- **Pull to Refresh**: Refresh the feed with pull gesture
- **Customizable**: Highly customizable through props

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | string | '#F5F5F5' | Background color of the container |
| `backgroundImage` | any | undefined | Background image (requires ImageBackground) |
| `headerTitle` | string | 'GrowThoughts' | Title displayed in the header |
| `headerSubtitle` | string | 'Explore updates & discussions' | Subtitle displayed in the header |
| `placeholder` | string | "What's on your mind..." | Placeholder text for the post input |
| `showHeader` | boolean | true | Whether to show the header section |
| `showInputSection` | boolean | true | Whether to show the post creation input |
| `maxHeight` | number | undefined | Maximum height of the container |
| `onPostCreated` | function | undefined | Callback when a post is created |
| `customStyles` | object | {} | Custom styles for different sections |

## Usage Examples

### Basic Usage

```tsx
import React from 'react';
import { View } from 'react-native';
import GrowThoughtsFeed from './components/GrowThoughtsFeed';

const MyScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <GrowThoughtsFeed />
    </View>
  );
};
```

### Customized Usage

```tsx
import React from 'react';
import GrowThoughtsFeed from './components/GrowThoughtsFeed';

const CustomFeedScreen = () => {
  return (
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
  );
};
```

### With Background Image

```tsx
import React from 'react';
import GrowThoughtsFeed from './components/GrowThoughtsFeed';
import { require } from 'react-native';

const FeedWithBackground = () => {
  return (
    <GrowThoughtsFeed
      backgroundImage={require('../assets/images/background.png')}
      headerTitle="My Thoughts"
      headerSubtitle="Express yourself"
    />
  );
};
```

## Dependencies

This component requires the following dependencies:

```json
{
  "react": "*",
  "react-native": "*",
  "expo-font": "*",
  "@expo/vector-icons": "*",
  "expo-image-picker": "*",
  "axios": "*"
}
```

## Required Files

The component expects the following utility files to exist:

- `utils/authStorage.ts` - For authentication data storage
- `utils/tokenRefresh.ts` - For token refresh functionality
- `config/index.ts` - For BASE_URL configuration

## API Endpoints

The component interacts with the following API endpoints:

- `GET /api/posts/all` - Fetch all posts
- `POST /api/posts/create` - Create a new post
- `POST /api/posts/:id/like` - Like a post
- `DELETE /api/posts/:id/like` - Unlike a post
- `GET /api/posts/:id/comments` - Fetch post comments
- `POST /api/userProfile` - Get user profile

## Styling

The component uses StyleSheet.create for optimal performance. All styles are responsive and use percentage-based dimensions where appropriate.

## Features Not Included (Simplified)

For simplicity, the following features have been simplified in this reusable component:

1. **Comments**: Shows a placeholder instead of full comments functionality
2. **Reports**: Shows a placeholder instead of full reporting functionality
3. **Likes Modal**: Not included to keep the component lightweight

These can be easily added back by referencing the original RightScreen component.

## Customization Tips

1. **Colors**: Customize colors through props and customStyles
2. **Typography**: Uses Quicksand font family, can be modified in the font loading section
3. **Layout**: All dimensions are responsive using width/height percentages
4. **Functionality**: Extend the component by adding more props for different features

## Performance Considerations

- Uses `useCallback` for optimization
- Implements optimistic updates for likes
- Caches user profiles to avoid repeated API calls
- Uses flat list for large feeds (can be implemented)
- Implements proper error handling and loading states

## License

This component is part of the GoGrowSmart project.
