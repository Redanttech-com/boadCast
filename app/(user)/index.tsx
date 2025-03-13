import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import iebc from "@/iebc.json";
import TypeWriter from "react-native-typewriter";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, storage } from "@/firebase";
import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  getDownloadURL,
  ref,
  uploadBytes,
  uploadString,
} from "firebase/storage";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const Form = () => {
  const [image, setImage] = useState<string | null>(null);
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectData, setSelectData] = useState(null);
  const [data, setselectedData] = useState([
    "Personal Account",
    "Business Account",
    "Non-profit and Community Account",
    "Public Figure Account",
    "Media and Publisher Account",
    "News and Media Outlet",
    "E-commerce and Retail Account",
    "Entertainment and Event Account",
  ]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const [name, setName] = useState("");
  const [lname, setlName] = useState("");
  const [nName, setnName] = useState("");
  const [error, setError] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const colorScheme = useColorScheme();
  const [userData, setUserData] = useState(null);
  const [userDataId, setUserDataId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      const q = query(collection(db, "userPosts"), where("uid", "==", user.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
        const userData = querySnapshot.docs[0]; // ✅ Get first matching post
        setUserDataId(userData.id); // ✅
      }
    };

    fetchUserData();
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  // const filePickerRef = useRef();
  // const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (data) {
      const formatteddata = data.map((data) => ({
        label: data,
        value: data,
      }));
      setselectedData(formatteddata);
    }
  }, []);

  // Populate counties dropdown
  useEffect(() => {
    if (iebc?.counties) {
      const formattedCounties = iebc.counties.map((county) => ({
        label: county.name,
        value: county.name,
      }));
      setCounties(formattedCounties);
    }
  }, []);

  // Update constituencies when county changes
  useEffect(() => {
    if (selectedCounty) {
      const selectedCountyObj = iebc.counties.find(
        (county) => county.name === selectedCounty
      );

      if (selectedCountyObj?.constituencies) {
        const formattedConstituencies = selectedCountyObj.constituencies.map(
          (constituency) => ({
            label: constituency.name,
            value: constituency.name,
          })
        );
        setConstituencies(formattedConstituencies);
      } else {
        setConstituencies([]);
      }

      // Reset constituency and ward when county changes
      setSelectedConstituency(null);
      setSelectedWard(null);
    }
  }, [selectedCounty]);

  // Update wards when constituency changes
  useEffect(() => {
    if (selectedConstituency) {
      const selectedCountyObj = iebc.counties.find(
        (county) => county.name === selectedCounty
      );

      const selectedConstituencyObj = selectedCountyObj?.constituencies.find(
        (constituency) => constituency.name === selectedConstituency
      );

      if (selectedConstituencyObj?.wards) {
        const formattedWards = selectedConstituencyObj.wards.map((ward) => ({
          label: ward.name,
          value: ward.name,
        }));
        setWards(formattedWards);
      } else {
        setWards([]);
      }

      // Reset ward when constituency changes
      setSelectedWard(null);
    }
  }, [selectedConstituency]);

  const renderDropdownItem = (item) => (
    <View style={styles.item}>
      <Text style={styles.textItem}>{item.label}</Text>
      <AntDesign
        style={styles.icon}
        color={
          item.value === selectData ||
          item.value === selectedCounty ||
          item.value === selectedConstituency ||
          item.value === selectedWard
            ? "blue"
            : "black"
        }
        name="Safety"
        size={20}
      />
    </View>
  );

  const submit = async () => {
    try {
      if (loading) return;
      setLoading(true);

      let docRef;
      const updatedFields = {
        name: name || userData?.name,
        lastname: lname || userData?.lastname,
        nickname: nName || userData?.nickname,
        category: selectData || userData?.category,
        county: selectedCounty || userData?.county,
        constituency: selectedConstituency || userData?.constituency,
        ward: selectedWard || userData?.ward,
        timestamp: serverTimestamp(),
      };

      // ✅ Remove undefined or null values
      Object.keys(updatedFields).forEach(
        (key) =>
          (updatedFields[key] === null || updatedFields[key] === undefined) &&
          delete updatedFields[key]
      );

      if (userDataId) {
        // ✅ Update only changed fields
        docRef = doc(db, "userPosts", userDataId);
        await updateDoc(docRef, updatedFields);
      } else {
        // ✅ Create a new post
        docRef = await addDoc(collection(db, "userPosts"), {
          uid: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
          ...updatedFields, // ✅ Use filtered data
        });

        setUserData(docRef.id);
      }

      // ✅ Upload Image Function
      const uploadImage = async (imageUri) => {
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const imageRef = ref(storage, `userPosts/${docRef.id}/userImg`);

          await uploadBytes(imageRef, blob);
          const downloadUrl = await getDownloadURL(imageRef);

          await updateDoc(docRef, { userImg: downloadUrl || user?.imageUrl });
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      };

      if (image) {
        await uploadImage(image);
      }

      // ✅ Reset Form
      setImage(null);
      setName("");
      setselectedData([]);
      setSelectedCounty(null);
      setSelectedConstituency(null);
      setSelectedWard(null);
      setLoading(false);
      router.push("/(drawer)/(tabs)");
    } catch (error) {
      console.error("Error submitting:", error);
    }

    if (!name.trim() || !lname.trim() || !nName.trim()) {
      setError("Required!");
    } else {
      setError("");
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "userPosts"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // ✅ Map through all user posts
          const allUsers = querySnapshot.docs.map((doc) => ({
            id: doc.id, // ✅ Include document ID to identify the current user
            ...doc.data(),
          }));

          setUserDetails(allUsers); // Save all user data in state

          // ✅ Check if any existing nickname matches nName (excluding current user)
          const nicknameExists = allUsers.some(
            (user) => user.nickname === nName && user.id !== userDataId
          );

          if (nicknameExists) {
            Alert.alert("Error", "Nickname already exists");
          }
        } else {
          console.warn("⚠️ No userPosts found.");
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (nName) {
      fetchUserDetails();
    }
  }, [nName, userDataId]); // ✅ Re-run when nickname or userDataId changes

  return (
    <SafeAreaView className="flex-1 p-5 justify-center dark:bg-gray-800">
      <StatusBar style="auto" />
      <View className="h-32 mb-4">
        <TypeWriter
          typing={1}
          className="m-5 text-2xl font-bold dark:text-white text-center"
          numberOfLines={2}
        >
          'Welcome to BroadCast', "In pursuit of a perfect nation"
        </TypeWriter>
      </View>

      <ScrollView>
        <View className="flex-row dark:bg-gray-800 items-center bg-white rounded-full border border-gray-300 px-4 py-4 mb-3">
          <MaterialIcons
            name="person"
            size={24}
            color="gray"
            className="mr-3"
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={(userData && userData?.name) || "Enter Name"}
            placeholderTextColor={
              colorScheme === "dark" ? "#FFFFFF" : "#808080"
            } // Light gray for light mode, white for dark mode
            className="flex-1 text-base dark:text-white"
          />
        </View>
        {error && <Text className="text-red-500 mb-3">{error}</Text>}

        {/* Last Name Input */}
        <View className="flex-row dark:bg-gray-800 items-center bg-white rounded-full border border-gray-300 px-4 py-4 mb-3">
          <MaterialIcons
            name="person-outline"
            size={24}
            color="gray"
            className="mr-3"
          />
          <TextInput
            value={lname}
            onChangeText={setlName}
            placeholder={(userData && userData?.lastname) || "Enter Last Name"}
            placeholderTextColor={
              colorScheme === "dark" ? "#FFFFFF" : "#808080"
            } // Light gray for light mode, white for dark mode
            className="flex-1 text-base dark:text-white"
          />
        </View>
        {error && <Text className="text-red-500 mb-3">{error}</Text>}

        {/* Nick Name Input */}
        <View className="flex-row dark:bg-gray-800 items-center bg-white rounded-full border border-gray-300 px-4 py-4 mb-3">
          <MaterialIcons
            name="person-pin"
            size={24}
            color="gray"
            className="mr-3"
          />
          <TextInput
            value={nName}
            onChangeText={setnName}
            placeholder={(userData && userData?.nickname) || "Enter nickname"}
            placeholderTextColor={
              colorScheme === "dark" ? "#FFFFFF" : "#808080"
            } // Light gray for light mode, white for dark mode
            className="flex-1 text-base dark:text-white"
          />
        </View>
        {error && <Text className="text-red-500 mb-3">{error}</Text>}
        <View className="items-center">
          <Pressable
            onPress={pickImage}
            className="bg-blue-950  rounded-full p-4"
          >
            <Text className="text-white">Choose profile</Text>
          </Pressable>
          {image && <Image source={{ uri: image }} style={styles.image} />}
        </View>
        <View>
          <Dropdown
            style={styles.dropdown}
            data={data}
            labelField="label"
            valueField="value"
            placeholder={(userData && userData?.category) || "Select Category"}
            value={selectData}
            onChange={(item) => setSelectData(item.value)}
            renderItem={renderDropdownItem}
          />
        </View>
        <View>
          <Dropdown
            style={styles.dropdown}
            data={counties}
            labelField="label"
            valueField="value"
            placeholder={(userData && userData?.county) || "Select County"}
            value={selectedCounty}
            onChange={(item) => setSelectedCounty(item.value)}
            renderItem={renderDropdownItem}
          />
        </View>
        <View>
          <Dropdown
            style={styles.dropdown}
            data={constituencies}
            labelField="label"
            valueField="value"
            placeholder={
              (userData && userData?.constituency) || "Select Constituency"
            }
            value={selectedConstituency}
            onChange={(item) => setSelectedConstituency(item.value)}
            renderItem={renderDropdownItem}
          />
        </View>
        <View>
          <Dropdown
            style={styles.dropdown}
            data={wards}
            labelField="label"
            valueField="value"
            placeholder={(userData && userData?.ward) || "Select Ward"}
            value={selectedWard}
            onChange={(item) => setSelectedWard(item.value)}
            renderItem={renderDropdownItem}
          />
        </View>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Pressable
            onPress={submit}
            disabled={
              !userData // If no userData, require all fields
                ? !name ||
                  !nName ||
                  !lname ||
                  !selectData ||
                  !selectedCounty ||
                  !selectedConstituency ||
                  !selectedWard
                : !(
                    name !== userData?.name ||
                    nName !== userData?.nickname ||
                    lname !== userData?.lastname ||
                    selectData !== userData?.category ||
                    selectedCounty !== userData?.county ||
                    selectedConstituency !== userData?.constituency ||
                    selectedWard !== userData?.ward
                  )
            }
            className={`${
              !userData
                ? !name ||
                  !nName ||
                  !lname ||
                  !selectData ||
                  !selectedCounty ||
                  !selectedConstituency ||
                  !selectedWard
                  ? "bg-gray-700 p-4 rounded-full items-center"
                  : "justify-center items-center  p-4 bg-blue-950 rounded-full"
                : !(
                    name !== userData?.name ||
                    nName !== userData?.nickname ||
                    lname !== userData?.lastname ||
                    selectData !== userData?.category ||
                    selectedCounty !== userData?.county ||
                    selectedConstituency !== userData?.constituency ||
                    selectedWard !== userData?.ward
                  )
                ? "bg-gray-700 p-4 rounded-full items-center"
                : "justify-center items-center  p-4 bg-blue-950 rounded-full"
            }`}
          >
            <Text className="text-white">Submit</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Form;

const styles = StyleSheet.create({
  dropdown: {
    margin: 8,
    height: 50,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  inputError: {
    borderColor: "red",
  },
  input: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 50,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    objectFit: "cover",
  },
  item: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  textItem: {
    fontSize: 16,
    flex: 1,
  },
  icon: {
    marginLeft: 8,
  },
});
