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
import { bidsApi } from "../api";
import { COLORS } from "../config";
import type { RootStackParamList } from "../navigation/types";

export function HistoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["my-bids"],
    queryFn: () => bidsApi.mine(),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мои ставки</Text>
      <FlatList
        data={data?.bids ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("AuctionDetail", { id: item.auctionId })}
          >
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.auctionTitle}
            </Text>
            <View style={styles.row}>
              <Text style={styles.myBid}>
                Моя ставка: {item.amount.toLocaleString("ru-RU")} ₽
              </Text>
              {item.isWinner && item.auctionStatus === "ended" && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerText}>Победа</Text>
                </View>
              )}
            </View>
            <Text style={styles.meta}>
              Текущая: {item.currentPrice.toLocaleString("ru-RU")} ₽ ·{" "}
              {item.auctionStatus === "active" ? "Активен" : "Завершён"}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Вы ещё не участвовали в торгах</Text>
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
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  myBid: { fontSize: 15, fontWeight: "600", color: COLORS.primary },
  winnerBadge: { backgroundColor: COLORS.success, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  winnerText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  meta: { fontSize: 13, color: COLORS.textMuted, marginTop: 6 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 40 },
});
