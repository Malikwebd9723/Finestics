import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Animated,
  ListRenderItem,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from 'context/ThemeProvider';
import { useNavigation, NavigationProp } from "@react-navigation/native";

// Define your navigation type (adjust according to your app’s navigation structure)
type RootStackParamList = {
  CategoryDetails: undefined;
};

interface Category {
  id: number;
  name: string;
  items: number;
  image: any;
}

const categoriesData: Category[] = [
  { id: 1, name: "Vegetables", items: 20, image: require("../../assets/vegetables.jpg") },
  { id: 2, name: "Fruits", items: 20, image: require("../../assets/fruits.jpg") },
  { id: 3, name: "Herbs & Spices", items: 20, image: require("../../assets/herbs.jpg") },
  { id: 4, name: "Fish & Seafood", items: 20, image: require("../../assets/fish.jpg") },
  { id: 5, name: "Garlic & Onion", items: 20, image: require("../../assets/garlic.jpg") },
  { id: 6, name: "Packaged Goods", items: 20, image: require("../../assets/packed.jpg") },
  { id: 7, name: "Eggs & Dairy", items: 20, image: require("../../assets/eggs.jpg") },
  { id: 8, name: "Bread & Bakery", items: 20, image: require("../../assets/bakery.jpg") },
  { id: 9, name: "Others", items: 20, image: require("../../assets/others.jpg") },
];

export default function Categories () {
  const { colors } = useThemeContext();
  const [search, setSearch] = useState<string>("");
  const [filteredData, setFilteredData] = useState<Category[]>(categoriesData);
  const [loading, setLoading] = useState<boolean>(true);
  const shimmerValue = new Animated.Value(0);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.trim() === "") {
      setFilteredData(categoriesData);
    } else {
      setFilteredData(
        categoriesData.filter((item) =>
          item.name.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  const renderItem: ListRenderItem<Category> = ({ item }) => (
    <Pressable
      className="w-[30%] mx-auto my-3 items-center justify-center rounded-2xl p-3"
      style={{ backgroundColor: colors.card }}
      onPress={() => navigation.navigate("CategoryDetails")}
    >
      <Image source={item.image} className="w-20 h-20 rounded-full mb-2" resizeMode="cover" />
      <Text className="font-semibold text-center" style={{ color: colors.text }}>
        {item.name}
      </Text>
      <Text className="text-sm text-gray-500">{item.items} items</Text>
    </Pressable>
  );

  const SkeletonItem: React.FC = () => {
    const opacity = shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    return (
      <Animated.View
        className="w-[30%] m-2 items-center justify-center rounded-2xl p-3"
        style={{ backgroundColor: colors.card, opacity }}
      >
        <View className="w-20 h-20 rounded-full mb-2" style={{ backgroundColor: colors.background }} />
        <View className="w-16 h-3 mb-1 rounded" style={{ backgroundColor: colors.background }} />
        <View className="w-10 h-3 rounded" style={{ backgroundColor: colors.background }} />
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 p-2" style={{ backgroundColor: colors.background }}>
      {/* Search Bar */}
      <View
        className="flex-row items-center mb-4 rounded-full px-4 py-2"
        style={{ backgroundColor: colors.card }}
      >
        <Ionicons name="search" size={20} color={colors.text} />
        <TextInput
          placeholder="Search"
          placeholderTextColor={colors.text}
          value={search}
          onChangeText={handleSearch}
          className="flex-1 ml-2 text-base"
          style={{ color: colors.text }}
        />

        <Pressable
          onPress={() => {
            Alert.alert("Add Category", "Functionality to add a new category.");
          }}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Category Grid or Skeleton */}
      {loading ? (
        <FlatList
          data={Array(12).fill({})}
          renderItem={() => <SkeletonItem />}
          keyExtractor={(_, i) => i.toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};
