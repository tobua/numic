import React from 'react'
import { SafeAreaView, StatusBar, StyleSheet, View, Text, Image } from 'react-native'
import logo from './logo.png'

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 40,
    marginBottom: 40,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  green: {
    color: '#3add85',
  },
})

export function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.wrapper}>
        <Image style={styles.image} source={logo} />
        <Text style={styles.text}>
          Welcome to <Text style={styles.green}>numic</Text>!
        </Text>
      </View>
    </SafeAreaView>
  )
}
