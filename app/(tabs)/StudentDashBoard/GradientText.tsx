import React from 'react';
import { Text, StyleProp, TextStyle, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientTextProps {
    text: string;
    style?: StyleProp<TextStyle>;
    gradientColors: string[];
}

const GradientText: React.FC<GradientTextProps> = ({ text, style, gradientColors }) => {
   
    const safeGradientColors: [string, string, ...string[]] =
        gradientColors.length >= 2 ? gradientColors as [string, string, ...string[]] : ['#ff0000', '#0000ff'];

    return (
        <View>
            <MaskedView
                style={{ flex: 1 }}
                maskElement={<Text style={[styles.text, style]}>{text}</Text>}
            >
                <LinearGradient
                    colors={safeGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </MaskedView>
        </View>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default GradientText;
