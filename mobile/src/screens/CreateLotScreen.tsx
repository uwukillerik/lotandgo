import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { lotsApi, auctionsApi } from "../api";
import { COLORS } from "../config";
import { LOT_CATEGORIES } from "../../../shared/categories";
import type { RootStackParamList } from "../navigation/types";

export function CreateLotScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(LOT_CATEGORIES[0]);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [startPrice, setStartPrice] = useState("");
  const [bidStep, setBidStep] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [step, setStep] = useState<1 | 2>(1);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(result.assets.slice(0, 5));
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);

      for (const img of images) {
        const filename = img.uri.split("/").pop() ?? "photo.jpg";
        formData.append("images", {
          uri: img.uri,
          name: filename,
          type: img.mimeType ?? "image/jpeg",
        } as unknown as Blob);
      }

      const { lot } = await lotsApi.create(formData);

      const now = new Date();
      const endsAt = new Date(now.getTime() + parseInt(durationHours, 10) * 3600000);

      await auctionsApi.create({
        lotId: lot.id,
        startPrice: parseInt(startPrice, 10),
        bidStep: parseInt(bidStep, 10),
        startsAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["my-lots"] });
      Alert.alert("Готово", "Лот выставлен на торги!", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("MainTabs", { screen: "Home" } as never),
        },
      ]);
      setTitle("");
      setDescription("");
      setImages([]);
      setStartPrice("");
      setBidStep("");
      setStep(1);
    },
    onError: (e: Error) => Alert.alert("Ошибка", e.message),
  });

  const handleSubmit = () => {
    if (step === 1) {
      if (!title || !description || images.length === 0) {
        Alert.alert("Заполните все поля и добавьте фото");
        return;
      }
      setStep(2);
      return;
    }

    const sp = parseInt(startPrice, 10);
    const bs = parseInt(bidStep, 10);
    const dh = parseInt(durationHours, 10);
    if (isNaN(sp) || isNaN(bs) || isNaN(dh) || sp <= 0 || bs <= 0 || dh <= 0) {
      Alert.alert("Проверьте параметры торгов");
      return;
    }
    createMutation.mutate();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {step === 1 ? "Новый лот" : "Параметры торгов"}
      </Text>

      {step === 1 ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Название лота"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={COLORS.textMuted}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Описание"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>Категория</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {LOT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.photoButton} onPress={pickImages}>
            <Text style={styles.photoButtonText}>
              📷 Добавить фото ({images.length}/5)
            </Text>
          </TouchableOpacity>

          <ScrollView horizontal style={styles.previews}>
            {images.map((img) => (
              <Image key={img.uri} source={{ uri: img.uri }} style={styles.preview} />
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Начальная цена (₽)"
            value={startPrice}
            onChangeText={setStartPrice}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
          <TextInput
            style={styles.input}
            placeholder="Шаг ставки (₽)"
            value={bidStep}
            onChangeText={setBidStep}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
          <TextInput
            style={styles.input}
            placeholder="Длительность (часов)"
            value={durationHours}
            onChangeText={setDurationHours}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
        </>
      )}

      <TouchableOpacity
        style={styles.submit}
        onPress={handleSubmit}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {step === 1 ? "Далее →" : "Выставить на торги"}
          </Text>
        )}
      </TouchableOpacity>

      {step === 2 && (
        <TouchableOpacity onPress={() => setStep(1)} style={styles.back}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 20 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: COLORS.text,
  },
  textarea: { height: 100, textAlignVertical: "top" },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  chips: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textMuted },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  photoButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  photoButtonText: { color: COLORS.primary, fontWeight: "700" },
  previews: { marginBottom: 16 },
  preview: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  submit: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  back: { alignItems: "center", marginTop: 16 },
  backText: { color: COLORS.primary, fontWeight: "600" },
});
