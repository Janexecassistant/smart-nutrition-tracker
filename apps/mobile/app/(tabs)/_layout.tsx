import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#a3a3a3",
        tabBarStyle: {
          borderTopColor: "#e5e5e5",
        },
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#171717",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          // tabBarIcon will use a proper icon library in full implementation
        }}
      />
      <Tabs.Screen
        name="suggestions"
        options={{
          title: "Suggestions",
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
