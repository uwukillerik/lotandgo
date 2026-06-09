import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";
import { COLORS } from "../config";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <View style={styles.container}>
      {mode === "login" ? (
        <>
          <LoginScreen />
          <TouchableOpacity
            style={styles.switch}
            onPress={() => setMode("register")}
          >
            <Text style={styles.switchText}>Нет аккаунта? Зарегистрироваться</Text>
          </TouchableOpacity>
        </>
      ) : (
        <RegisterScreen onSwitchToLogin={() => setMode("login")} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  switch: { padding: 20, alignItems: "center" },
  switchText: { color: COLORS.primary, fontWeight: "600", fontSize: 15 },
});
