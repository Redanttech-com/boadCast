import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import iebc from "@/iebc.json";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
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
      if (loading) return <ActivityIndicator />;
      setLoading(true);

      const docRef = await addDoc(collection(db, "userPosts"), {
        id: user?.id,
        email: user?.primaryEmailAddress?.emailAddress,
        timestamp: serverTimestamp(),
        name: name,
        lastname: lname,
        nickname: nName,
        category: selectData,
        county: selectedCounty,
        constituency: selectedConstituency,
        ward: selectedWard,
      });

      const uploadImage = async (imageUri, docRef) => {
        try {
          // Convert image URI to Blob
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // Reference to the storage location
          const imageRef = ref(storage, `userPosts/${docRef.id}/userImg`);

          // Upload the Blob
          await uploadBytes(imageRef, blob);

          // Get the download URL
          const downloadUrl = await getDownloadURL(imageRef);

          // Update Firestore document with the image URL
          await updateDoc(doc(db, "userPosts", docRef.id), {
            userImg: downloadUrl,
          });

          console.log("Image uploaded and Firestore updated successfully!");
        } catch (error) {
          console.error("Error uploading image or updating Firestore:", error);
        }
      };

      if (image) {
        await uploadImage(image, docRef);
      }

      setImage(null);
      setName("");
      setselectedData([]);
      setSelectedCounty(null);
      setSelectedConstituency(null);
      setSelectedWard(null);

      setLoading(false);

      router.push("/(drawer)/(tabs)");
    } catch (error) {
      console.log(error);
    }
    if (!name.trim() || !lname.trim() || !nName.trim()) {
      setError("Required!");
    } else {
      setError("");
      // Proceed with form submission
    }
  };


  


  return (
    <SafeAreaView className="flex-1 m-5 justify-center">
      <ScrollView>
        <View>
          <Text>Typewrite</Text>
        </View>
        <View>
          <TextInput
            value={name}
            onChangeText={(text) => setName(text)}
            placeholder="Enter Name"
            style={[styles.input, error ? styles.inputError : null]}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
        <View>
          <TextInput
            value={lname}
            onChangeText={setlName}
            placeholder="Enter Last Name"
            style={[styles.input, error ? styles.inputError : null]}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
        <View>
          <TextInput
            value={nName}
            onChangeText={setnName}
            placeholder="Enter Nick Name"
            style={[styles.input, error ? styles.inputError : null]}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
        <View>
          <Pressable
            onPress={pickImage}
            className="border-2 bg-blue-950  rounded-full p-4"
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
            placeholder="Select Category"
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
            placeholder="Select County"
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
            placeholder="Select Constituency"
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
            placeholder="Select Ward"
            value={selectedWard}
            onChange={(item) => setSelectedWard(item.value)}
            renderItem={renderDropdownItem}
          />
        </View>

        <Pressable
          onPress={submit}
          disabled={
            !name ||
            !nName ||
            !lname ||
            !selectData ||
            !selectedCounty ||
            !selectedConstituency ||
            !selectedWard
          }
          className={`${
            !name ||
            !nName ||
            !lname ||
            !selectData ||
            !selectedCounty ||
            !selectedConstituency ||
            !selectedWard
              ? "bg-gray-700 p-4 rounded-full items-center"
              : "justify-center items-center border-2 p-4 bg-blue-950 rounded-full "
          }`}
        >
          <Text className="text-white">Submit</Text>
        </Pressable>
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
