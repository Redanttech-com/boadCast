
import Feed from "@/components/National/Feed";
import Header from "@/components/National/Header";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeScreen = () => {

  return (
    <SafeAreaView className="flex-1">
      <Header />
      <Feed />
      
    </SafeAreaView>
  );
};

export default HomeScreen;
