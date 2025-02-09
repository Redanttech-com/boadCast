import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Ward/Header';
import Feed from '@/components/Ward/Feed';

const Ward = () => {
  return (
    <SafeAreaView className="flex-1">
      
      <Feed />
    </SafeAreaView>
  );
}

export default Ward