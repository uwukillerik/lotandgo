import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { lotsApi } from "../api";
import { Countdown } from "../components/Countdown";
import { COLORS } from "../config";
import type { RootStackParamList } from "../navigation/types";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  active: "На торгах",
  ended: "Завершён",
  sold: "Продан",
};

export function MyLotsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-lots"],
    queryFn: () => lotsApi.mine(),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мои лоты</Text>
      <FlatList
        data={data?.lots ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.status, item.status === "sold" && styles.statusSold]}>
                <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
              </View>
            </View>
            <Text style={styles.category}>{item.category}</Text>
            {item.auction ? (
              <>
                <Text style={styles.price}>
                  {item.auction.currentPrice.toLocaleString("ru-RU")} ₽
                </Text>
                <View style={styles.row}>
                  <Text style={styles.meta}>
                    Статус: {item.auction.status === "active" ? "Идут торги" : item.auction.status}
                  </Text>
                  {item.auction.status === "active" && (
                    <Countdown endsAt={item.auction.endsAt} />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.link}
                  onPress={() =>
                    navigation.navigate("AuctionDetail", { id: item.auction!.id })
                  }
                >
                  <Text style={styles.linkText}>Открыть аукцион →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.meta}>Не выставлен на торги</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>У вас пока нет лотов</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text, padding: 20, paddingBottom: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.text },
  status: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusSold: { backgroundColor: COLORS.success },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  category: { fontSize: 12, color: COLORS.accent, fontWeight: "600", marginTop: 6 },
  price: { fontSize: 22, fontWeight: "800", color: COLORS.primary, marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  meta: { fontSize: 13, color: COLORS.textMuted },
  link: { marginTop: 10 },
  linkText: { color: COLORS.primary, fontWeight: "600" },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 40 },
});
