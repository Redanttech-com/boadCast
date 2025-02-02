import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";

import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "@/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useUserInfo } from "@/providers/UserContext";
import { router } from "expo-router";
import { deleteObject, ref } from "firebase/storage";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRecoilState } from "recoil";
import { modalComment } from "@/atoms/modalAtom";
import Moment from "react-moment";
import moment from "moment";

const Comments = ({ id, comment }) => {
  return (
    <View key={id} className=" p-5">
      <View className="flex-row items-center gap-3">
        <Image
          source={{
            uri: comment?.data()?.userImg,
          }}
          className="h-10 w-10 rounded-md"
        />
        <FontAwesome name="check-circle" size={15} color="green" />
        <View className="flex-row gap-2 items-center">
          <Text className="text-sm">@{comment?.data()?.nickname}</Text>
          <Text className="text-sm">{comment?.data()?.lastname}</Text>

          <View className="flex-row items-center gap-2 bg-blue-200 rounded-full p-2">
            <MaterialCommunityIcons
              name="clock-check-outline"
              size={14}
              color="black"
            />
            <Text style={{ fontSize: 12, color: "gray" }}>
              {moment(comment?.data()?.timestamp?.toDate()).fromNow()}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center ml-auto gap-2">
          <Pressable >
            <Feather name="trash-2" size={20} color="black" />
          </Pressable>
          <TouchableOpacity>
            <Feather name="more-horizontal" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="ml-12">
        <Text>{comment?.data()?.comment}</Text>
        <Text>@{comment?.data()?.fromNickname}</Text>
      </View>
      <View>
        <Image source={{ uri: comment?.data()?.image }} />
      </View>
    </View>
  );
};

export default Comments;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "grey",
  },
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: "center",
  },
});
