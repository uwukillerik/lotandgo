import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../auth/AuthContext";
import { COLORS } from "../config";

interface Props {
  onSwitchToLogin: () => void;
}

export function RegisterScreen({ onSwitchToLogin }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        confirmPassword,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>Создайте аккаунт Lot&Go</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {(
          [
            { label: "Имя", value: name, set: setName },
            { label: "Email", value: email, set: setEmail, email: true },
            { label: "Телефон (необязательно)", value: phone, set: setPhone, phone: true },
            { label: "Пароль", value: password, set: setPassword, secure: true },
            { label: "Подтвердите пароль", value: confirmPassword, set: setConfirmPassword, secure: true },
          ] as const
        ).map((field) => (
          <TextInput
            key={field.label}
            style={styles.input}
            placeholder={field.label}
            value={field.value}
            onChangeText={field.set}
            autoCapitalize={"email" in field && field.email ? "none" : "words"}
            keyboardType={
              "phone" in field && field.phone
                ? "phone-pad"
                : "email" in field && field.email
                  ? "email-address"
                  : "default"
            }
            secureTextEntry={"secure" in field && field.secure}
            placeholderTextColor={COLORS.textMuted}
          />
        ))}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Зарегистрироваться</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onSwitchToLogin} style={styles.link}>
          <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24, marginTop: 4 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { color: COLORS.error, marginBottom: 12, fontSize: 14 },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: COLORS.primary, fontWeight: "600" },
});
