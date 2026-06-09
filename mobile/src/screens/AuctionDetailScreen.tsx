import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Linking,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RouteProp, useRoute } from "@react-navigation/native";
import { auctionsApi } from "../api";
import { imageUrl } from "../api/client";
import { Countdown } from "../components/Countdown";
import { joinAuction, leaveAuction, getSocket } from "../hooks/useSocket";
import { COLORS } from "../config";
import type { RootStackParamList } from "../navigation/types";
import type { Bid } from "../../../shared/api";

export function AuctionDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "AuctionDetail">>();
  const { id } = route.params;
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");
  const [contact, setContact] = useState<{
    name: string;
    email: string;
    phone: string | null;
  } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auction", id],
    queryFn: () => auctionsApi.get(id),
  });

  const auction = data?.auction;

  useEffect(() => {
    joinAuction(id);
    const socket = getSocket();

    const onBid = () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    };

    const onEnded = () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    socket?.on("bid:new", onBid);
    socket?.on("auction:ended", onEnded);

    return () => {
      socket?.off("bid:new", onBid);
      socket?.off("auction:ended", onEnded);
      leaveAuction(id);
    };
  }, [id, refetch, queryClient]);

  const bidMutation = useMutation({
    mutationFn: (amount: number) => auctionsApi.bid(id, amount),
    onSuccess: () => {
      setBidAmount("");
      refetch();
      Alert.alert("Успех", "Ставка принята!");
    },
    onError: (e: Error) => Alert.alert("Ошибка", e.message),
  });

  const contactMutation = useMutation({
    mutationFn: () => auctionsApi.sellerContact(id),
    onSuccess: (res) => setContact(res.contact),
    onError: (e: Error) => Alert.alert("Ошибка", e.message),
  });

  if (isLoading || !auction) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const minBid =
    auction.bids.length === 0
      ? auction.startPrice
      : auction.currentPrice + auction.bidStep;

  const images = auction.images.length
    ? auction.images
    : auction.imageUrl
      ? [{ id: "0", url: auction.imageUrl, sortOrder: 0 }]
      : [];

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {images.map((img) => {
          const uri = imageUrl(img.url);
          return uri ? (
            <Image key={img.id} source={{ uri }} style={styles.heroImage} />
          ) : null;
        })}
      </ScrollView>

      <View style={styles.body}>
        <Text style={styles.category}>{auction.category}</Text>
        <Text style={styles.title}>{auction.title}</Text>
        <Text style={styles.description}>{auction.description}</Text>

        <View style={styles.priceBox}>
          <View>
            <Text style={styles.priceLabel}>Текущая цена</Text>
            <Text style={styles.price}>
              {auction.currentPrice.toLocaleString("ru-RU")} ₽
            </Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.priceLabel}>До конца</Text>
            <Countdown endsAt={auction.endsAt} />
          </View>
        </View>

        <Text style={styles.meta}>
          Старт: {auction.startPrice.toLocaleString("ru-RU")} ₽ · Шаг:{" "}
          {auction.bidStep.toLocaleString("ru-RU")} ₽ · {auction.bidsCount} ставок
        </Text>
        <Text style={styles.seller}>Продавец: {auction.sellerName}</Text>

        {auction.status === "active" && !auction.isSeller && (
          <View style={styles.bidSection}>
            <Text style={styles.bidLabel}>Мин. ставка: {minBid.toLocaleString("ru-RU")} ₽</Text>
            <TextInput
              style={styles.bidInput}
              placeholder={`От ${minBid}`}
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={styles.bidButton}
              onPress={() => {
                const amount = parseInt(bidAmount, 10);
                if (isNaN(amount) || amount < minBid) {
                  Alert.alert("Ошибка", `Минимальная ставка: ${minBid} ₽`);
                  return;
                }
                bidMutation.mutate(amount);
              }}
              disabled={bidMutation.isPending}
            >
              {bidMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bidButtonText}>Сделать ставку</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {auction.status === "ended" && auction.isWinner && (
          <View style={styles.winnerBox}>
            <Text style={styles.winnerTitle}>🎉 Вы победили!</Text>
            {!contact ? (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => contactMutation.mutate()}
                disabled={contactMutation.isPending}
              >
                <Text style={styles.contactButtonText}>Контакты продавца</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.contactInfo}>
                <Text style={styles.contactText}>{contact.name}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${contact.email}`)}>
                  <Text style={styles.contactLink}>{contact.email}</Text>
                </TouchableOpacity>
                {contact.phone ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${contact.phone}`)}>
                    <Text style={styles.contactLink}>{contact.phone}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        )}

        <Text style={styles.historyTitle}>История ставок</Text>
        <FlatList
          data={auction.bids}
          keyExtractor={(item: Bid) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.bidRow}>
              <Text style={styles.bidUser}>{item.userName}</Text>
              <Text style={styles.bidAmount}>{item.amount.toLocaleString("ru-RU")} ₽</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.noBids}>Ставок пока нет</Text>
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroImage: { width: 400, height: 280 },
  body: { padding: 20 },
  category: { fontSize: 12, color: COLORS.accent, fontWeight: "700", textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginTop: 4 },
  description: { fontSize: 15, color: COLORS.textMuted, marginTop: 12, lineHeight: 22 },
  priceBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceLabel: { fontSize: 12, color: COLORS.textMuted },
  price: { fontSize: 28, fontWeight: "800", color: COLORS.primary, marginTop: 2 },
  timerBox: { alignItems: "flex-end" },
  meta: { fontSize: 13, color: COLORS.textMuted, marginTop: 12 },
  seller: { fontSize: 13, color: COLORS.text, marginTop: 4, fontWeight: "600" },
  bidSection: { marginTop: 20 },
  bidLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  bidInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  bidButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  bidButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  winnerBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  winnerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.success, marginBottom: 12 },
  contactButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  contactButtonText: { color: "#fff", fontWeight: "700" },
  contactInfo: { gap: 6 },
  contactText: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  contactLink: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  historyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginTop: 24, marginBottom: 12 },
  bidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bidUser: { fontSize: 14, color: COLORS.text },
  bidAmount: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  noBids: { color: COLORS.textMuted, textAlign: "center", padding: 20 },
});
