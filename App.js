// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";

import { GroceryProvider } from "./src/store/groceryStore";
import DetectScreen     from "./src/screens/DetectScreen";
import PantryScreen     from "./src/screens/PantryScreen";
import ShoppingListScreen from "./src/screens/ShoppingListScreen";
import ExpiryScreen     from "./src/screens/ExpiryScreen";
import { colors, font } from "./src/utils/theme";

const Tab = createBottomTabNavigator();

const TABS = [
  { name: "Detect",   component: DetectScreen,       icon: "📷", label: "Detect" },
  { name: "Pantry",   component: PantryScreen,        icon: "🏠", label: "Pantry" },
  { name: "Shopping", component: ShoppingListScreen,  icon: "🛒", label: "List" },
  { name: "Expiry",   component: ExpiryScreen,        icon: "📅", label: "Expiry" },
];

export default function App() {
  return (
    <GroceryProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle:      { backgroundColor: colors.bg, borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 },
            headerTitleStyle: { color: colors.text, fontWeight: font.weight.black },
            tabBarStyle:      { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 8, height: 60 },
            tabBarActiveTintColor:   "#818cf8",
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: { fontSize: font.size.xs, fontWeight: font.weight.medium },
            tabBarIcon: ({ focused }) => {
              const tab = TABS.find(t => t.name === route.name);
              return <Text style={{ fontSize: focused ? 24 : 20 }}>{tab?.icon}</Text>;
            },
          })}
        >
          {TABS.map((tab) => (
            <Tab.Screen
              key={tab.name}
              name={tab.name}
              component={tab.component}
              options={{ title: tab.label, headerShown: true }}
            />
          ))}
        </Tab.Navigator>
      </NavigationContainer>
    </GroceryProvider>
  );
}
