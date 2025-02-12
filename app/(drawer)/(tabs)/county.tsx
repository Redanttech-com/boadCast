import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/County/Header';
import Feed from '@/components/County/Feed';

const County = () => {
  return (
    <SafeAreaView className="flex-1 mt-10 dark:bg-gray-800 bg-white">
      <Feed />
    </SafeAreaView>
  );
}

export default County