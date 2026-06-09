import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { notificationsApi } from "../api";
import { COLORS } from "../config";
import type { RootStackParamList } from "../navigation/types";
import type { Notification } from "../../../shared/api";

const typeIcons: Record<Notification["type"], string> = {
  outbid: "⚡",
  auction_start: "🔔",
  auction_end: "🏁",
  won: "🏆",
};

export function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = data?.notifications.filter((n) => !n.read).length ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Уведомления</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.unread]}
            onPress={() => {
              if (!item.read) markRead.mutate(item.id);
              navigation.navigate("AuctionDetail", { id: item.auctionId });
            }}
          >
            <Text style={styles.icon}>{typeIcons[item.type]}</Text>
            <View style={styles.content}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Нет уведомлений</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 8, gap: 10 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  unread: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  icon: { fontSize: 24 },
  content: { flex: 1 },
  message: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 40 },
});
