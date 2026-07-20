import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import DashboardScreen from "../screens/DashboardScreen";
import GoalsScreen from "../screens/GoalsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useTheme } from "../theme/useTheme";
import type { AppStackParamList, MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji, focused, color }: { emoji: string; focused: boolean; color: string }) {
  return <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

function FabButton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: colors.brand,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -20,
        shadowColor: colors.brand,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", marginTop: -2 }}>+</Text>
    </View>
  );
}

function EmptyScreen() {
  return null;
}

export default function MainTabs() {
  const { colors } = useTheme();
  const rootNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 78, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "Inicio", tabBarIcon: ({ focused, color }) => <TabIcon emoji="🏠" focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="AddTab"
        component={EmptyScreen}
        options={{ tabBarLabel: "", tabBarIcon: () => <FabButton /> }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            rootNavigation.navigate("AddTransaction");
          },
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ tabBarLabel: "Metas", tabBarIcon: ({ focused, color }) => <TabIcon emoji="🎯" focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Perfil", tabBarIcon: ({ focused, color }) => <TabIcon emoji="👤" focused={focused} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
