import React, { useState, useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';

const Button = ({ text, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const animatedValue = useRef(new Animated.Value(0)).current;

    const handleHoverIn = () => {
        setIsHovered(true);
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
        }).start();
    };

    const handleHoverOut = () => {
        setIsHovered(false);
        Animated.timing(animatedValue, {
            toValue: 0,
            duration: 150,
            useNativeDriver: false,
        }).start();
    };

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#007bff', 'white']
    });

    const textColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['white', 'black']
    });


    return (
        <Pressable
            onPress={onClick}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
        >
            <Animated.View style={[styles.button, {backgroundColor}]}>
                <Animated.Text style={[styles.text, { color: textColor }]}>
                    {text}
                </Animated.Text>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 5,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: '#007bff',
    },
    text: {
        fontSize: 14,
    },
});

export default Button;
