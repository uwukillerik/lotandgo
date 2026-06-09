import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auctionsApi } from "../api";
import { AuctionCard } from "../components/AuctionCard";
import { COLORS } from "../config";
import { LOT_CATEGORIES } from "../../../shared/categories";
import type { RootStackParamList } from "../navigation/types";

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["auctions", search, category],
    queryFn: () =>
      auctionsApi.list({
        search: search || undefined,
        category: category !== "Все" ? category : undefined,
        status: "all",
      }),
  });

  const categories = ["Все", ...LOT_CATEGORIES];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Каталог</Text>
        <Text style={styles.headerSub}>Активные аукционы Lot&Go</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Поиск лотов..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor={COLORS.textMuted}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        {categories.map((cat) => (
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

      <FlatList
        data={data?.auctions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AuctionCard
            auction={item}
            onPress={() => navigation.navigate("AuctionDetail", { id: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>Аукционы не найдены</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  search: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  filters: { maxHeight: 50, marginVertical: 12 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
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
  chipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 40, fontSize: 16 },
});
