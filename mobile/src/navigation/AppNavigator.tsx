import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, ActivityIndicator, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { SafeScreen } from "../components/SafeScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { CreateLotScreen } from "../screens/CreateLotScreen";
import { MyLotsScreen } from "../screens/MyLotsScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AuctionDetailScreen } from "../screens/AuctionDetailScreen";
import { COLORS } from "../config";
import type { RootStackParamList, MainTabParamList } from "./types";
import type { ComponentType } from "react";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function withSafeScreen<P extends object>(Screen: ComponentType<P>) {
  return function Wrapped(props: P) {
    return (
      <SafeScreen>
        <Screen {...props} />
      </SafeScreen>
    );
  };
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    Create: "➕",
    MyLots: "📦",
    History: "📋",
    Notifications: "🔔",
    Profile: "👤",
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
      {icons[label] ?? "•"}
    </Text>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={withSafeScreen(HomeScreen)} options={{ title: "Каталог" }} />
      <Tab.Screen name="Create" component={withSafeScreen(CreateLotScreen)} options={{ title: "Создать" }} />
      <Tab.Screen name="MyLots" component={withSafeScreen(MyLotsScreen)} options={{ title: "Мои лоты" }} />
      <Tab.Screen name="History" component={withSafeScreen(HistoryScreen)} options={{ title: "Ставки" }} />
      <Tab.Screen name="Notifications" component={withSafeScreen(NotificationsScreen)} options={{ title: "Уведомления" }} />
      <Tab.Screen name="Profile" component={withSafeScreen(ProfileScreen)} options={{ title: "Профиль" }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  useSocket();

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerStatusBarHeight: insets.top,
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AuctionDetail"
            component={AuctionDetailScreen}
            options={{ title: "Аукцион" }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={withSafeScreen(AuthScreen)}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
