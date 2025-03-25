import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function Layout() {
  // Define our theme colors in one place for easy updating
  const theme = {
    background: "#0f1924",
    surface: "#182635",
    primary: "#00ffcc",
    primaryTransparent: "rgba(0, 255, 204, 0.1)",
    inactive: "#8b9eb5",
    shadow: "#000",
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            height: 70,
            backgroundColor: theme.background,
            borderTopWidth: 0,
            paddingVertical: 10,
            paddingHorizontal: 12,
            shadowColor: theme.shadow,
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 4,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginBottom: 8,
          },
          tabBarInactiveTintColor: theme.inactive,
          tabBarActiveTintColor: theme.primary,
          tabBarItemStyle: {
            marginHorizontal: 10,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
          tabBarActiveBackgroundColor: "transparent",
          tabBarInactiveBackgroundColor: "transparent",
        }}
      >
        {/* Home Tab */}
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ color }) => (
              <View
                style={{
                  backgroundColor:
                    color === theme.primary
                      ? theme.primaryTransparent
                      : "transparent",
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                <Ionicons name="home" color={color} size={22} />
              </View>
            ),
            tabBarLabel: "Home",
          }}
        />

        {/* Projects Tab (formerly Travel) */}
        <Tabs.Screen
          name="travel"
          options={{
            tabBarIcon: ({ color }) => (
              <View
                style={{
                  backgroundColor:
                    color === "#000"
                      ? "rgba(0, 0, 0, 0.1)"
                      : "transparent",
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                <Ionicons name="airplane" color={color} size={22} />
              </View>
            ),
            tabBarLabel: "Travel",
            headerShown: false,
          }}
        />

        {/* Investments Tab (formerly Tickets) */}
        <Tabs.Screen
          name="community"
          options={{
            tabBarIcon: ({ color }) => (
              <View
                style={{
                  backgroundColor:
                    color === "#000"
                      ? "rgba(0, 0, 0, 0.1)"
                      : "transparent",
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                <Ionicons name="trending-up" color={color} size={22} />
              </View>
            ),
            tabBarLabel: "Community",
            headerShown: false,
          }}
        />

        {/* Account Tab */}
        <Tabs.Screen
          name="products"
          options={{
            tabBarIcon: ({ color }) => (
              <View
                style={{
                  backgroundColor:
                    color === "#000"
                      ? "rgba(0, 0, 0, 0.1)"
                      : "transparent",
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                <Ionicons name="cart" color={color} size={22} />
              </View>
            ),
            tabBarLabel: "Products",
            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="rewards"
          options={{
            tabBarIcon: ({ color }) => (
              <View
                style={{
                  backgroundColor:
                    color === "#000"
                      ? "rgba(0, 0, 0, 0.1)"
                      : "transparent",
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                <Ionicons name="trophy" color={color} size={22} />
              </View>
            ),
            tabBarLabel: "Rewards",
          }}
        />
      </Tabs>
      <StatusBar backgroundColor={theme.background} style="light" />
    </>
  );
}
