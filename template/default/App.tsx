import React from 'react'
import { SafeAreaView, StatusBar, StyleSheet, View, Text } from 'react-native'

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
    padding: 20,
  },
  text: {
    fontWeight: 'bold',
  },
})

export function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.wrapper}>
        <Text style={styles.text}>Hello numic!</Text>
      </View>
    </SafeAreaView>
  )
}
