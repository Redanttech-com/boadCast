import { db } from "@/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Pressable,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import ProductList from "./ProductList";
import SearchProduct from "./SearchProduct";
import SearchCategory from "./searchCategory";
import { useColorScheme } from "@/hooks/useColorScheme.web";

function ProductFeed() {
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [querySearch, setQuerySearch] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const colorScheme = useColorScheme();

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "market"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load products.");
    }
  };

  useEffect(() => {
    let unsubscribe;
    const getPosts = async () => {
      unsubscribe = await fetchPosts();
    };

    getPosts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Search products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productQuery = query(
          collection(db, "market"),
          where("productname", ">=", querySearch),
          where("productname", "<=", querySearch + "\uf8ff")
        );

        const categoryQuery = query(
          collection(db, "market"),
          where("category", "==", selectedCategory || querySearch)
        );

        const unsubscribeProducts = onSnapshot(productQuery, (snapshot) => {
          setProducts(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        });

        const unsubscribeCategories = onSnapshot(categoryQuery, (snapshot) => {
          setCategories(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        });

        return () => {
          unsubscribeProducts();
          unsubscribeCategories();
        };
      } catch (error) {
        console.error("Error searching Firestore:", error);
      }
    };

    fetchData();
  }, [querySearch, selectedCategory]);

  const clearSearch = () => {
    setQuerySearch("");
    setSelectedCategory("");
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setQuerySearch(category); // Update search input with selected category
  };

  return (
    <View className=" bg-gray-100 dark:bg-gray-800 flex-1">
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: "white", marginTop: 10 }}>Loading...</Text>
        </View>
      ) : (
        <>
          <>
            {/* Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <View className="flex-row items-center justify-between px-4 border rounded-full border-gray-300">
                <Feather name="search" size={24} color={"gray"} />
                <TextInput
                  placeholder="Search Product..."
                  placeholderTextColor={
                    colorScheme === "dark" ? "#FFFFFF" : "#808080"
                  } // Light gray for light mode, white for dark mode
                  value={querySearch}
                  onChangeText={setQuerySearch}
                  className="flex-1 rounded-full p-3 dark:text-white"
                />
                <Pressable onPress={clearSearch}>
                  <Feather
                    name="x"
                    size={24}
                    color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                    className={`${querySearch ? "inline" : "hidden"}`}
                  />
                </Pressable>
              </View>
            </View>

            {/* Category Filter */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                width: "100%",
                height: 100,
              }}
            >
              {[
                "Vehicles",
                "Electronics",
                "Fashion",
                "Phones",
                "Machinery",
                "Buildings",
                "Agricultural",
                "Sports",
              ].map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => handleCategorySelect(category)}
                  style={{
                    backgroundColor:
                      selectedCategory === category ? "#4caf50" : "#333",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    margin: 5,  
                    borderRadius: 5,
                    minHeight: 40,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 50,
                  }}
                >
                  <Text style={{ color: "white" }}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Products List */}
          </>
          <FlatList
            data={
              querySearch
                ? products.length > 0
                  ? products
                  : categories.length > 0
                  ? categories
                  : []
                : posts
            }
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              if (item.productname) {
                return <SearchProduct id={item.id} item={item} />;
              } else if (item.category) {
                return <SearchCategory id={item.id} item={item} />;
              } else {
                return <ProductList id={item.id} item={item} />;
              }
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 10, paddingVertical: 50 }}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 50,
                }}
              >
                <Text className="dark:text-white">No posts available</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

export default ProductFeed;
