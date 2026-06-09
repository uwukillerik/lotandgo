import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { COLORS } from "../config";

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Выход", "Выйти из аккаунта?", [
      { text: "Отмена", style: "cancel" },
      { text: "Выйти", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.name?.charAt(0).toUpperCase() ?? "?"}
        </Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Lot&Go</Text>
        <Text style={styles.infoText}>
          Платформа аукционов частной собственности. Антиквариат, коллекции,
          украшения и многое другое — без недвижимости и автомобилей.
        </Text>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    padding: 24,
    paddingTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  name: { fontSize: 24, fontWeight: "800", color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  phone: { fontSize: 14, color: COLORS.text, marginTop: 4 },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: { fontSize: 18, fontWeight: "800", color: COLORS.primary, marginBottom: 8 },
  infoText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
  logout: {
    marginTop: 32,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
