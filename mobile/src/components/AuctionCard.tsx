import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import type { AuctionListItem } from "../../../shared/api";
import { imageUrl } from "../api/client";
import { Countdown } from "./Countdown";
import { COLORS } from "../config";

interface Props {
  auction: AuctionListItem;
  onPress: () => void;
}

const statusLabels = {
  scheduled: "Скоро",
  active: "Идут торги",
  ended: "Завершён",
};

export function AuctionCard({ auction, onPress }: Props) {
  const img = imageUrl(auction.imageUrl);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        <View style={[styles.badge, auction.status === "active" && styles.badgeActive]}>
          <Text style={styles.badgeText}>{statusLabels[auction.status]}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.category}>{auction.category}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {auction.title}
        </Text>
        <View style={styles.row}>
          <Text style={styles.price}>{auction.currentPrice.toLocaleString("ru-RU")} ₽</Text>
          <Countdown endsAt={auction.endsAt} />
        </View>
        <Text style={styles.meta}>
          {auction.bidsCount} ставок · шаг {auction.bidStep.toLocaleString("ru-RU")} ₽
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 180 },
  placeholder: {
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 48 },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: { backgroundColor: COLORS.accent },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  body: { padding: 14 },
  category: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  price: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  meta: { fontSize: 12, color: COLORS.textMuted },
});
