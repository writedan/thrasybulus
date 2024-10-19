import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ErrorBox = ({ head, body }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{head}</Text>
      <Text style={styles.message}>{body}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    marginBottom: 16,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#721c24',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#721c24',
  },
});

export default ErrorBox;
