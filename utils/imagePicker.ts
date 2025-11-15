import * as ImagePicker from "expo-image-picker";

export const pickImageFromGallery = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (!result.canceled) return result.assets[0].uri;

  return null;
};
