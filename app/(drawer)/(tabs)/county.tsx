import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/County/Header';
import Feed from '@/components/County/Feed';

const County = () => {
  return (
      <View className="flex-1">
        <Header />
        <Feed />
    </View>
  );
}

export default County