import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { useSocket } from "../hooks/useSocket";
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

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Каталог" }} />
      <Tab.Screen name="Create" component={CreateLotScreen} options={{ title: "Создать" }} />
      <Tab.Screen name="MyLots" component={MyLotsScreen} options={{ title: "Мои лоты" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "Ставки" }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Уведомления" }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Профиль" }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, isLoading } = useAuth();
  useSocket();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: "700" },
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
          component={AuthScreen}
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
