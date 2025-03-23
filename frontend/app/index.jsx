import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

export default function App() {
  return (
    <View className='flex h-full justify-center items-center'>
      <Text className='text-red-800'>Open up App.js to start working on your app!</Text>
      <Link href='/home'>Go to Home Page</Link>
      {/* <Link href='/routescreen'>Go to Home Page</Link> */}
      <StatusBar backgroundColor='#000000' style='auto' />
    </View>
  )
}