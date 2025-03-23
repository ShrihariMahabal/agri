import React, { useState } from "react";
import { View, Text, ScrollView, TouchableHighlight } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import CarbonSave from "../carbonsave";

const RouteCard = ({ id, route }) => {
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const modeIcons = {
    WALK: <FontAwesome5 name="walking" size={22} color="#065f46" />,
    BUS: <FontAwesome5 name="bus" size={22} color="#065f46" />,
    RAIL: <FontAwesome5 name="train" size={22} color="#065f46" />,
    SUBWAY: <FontAwesome5 name="subway" size={22} color="#065f46" />,
  };

  // Calculate total duration and reach-by time
  const totalTimeInSeconds = route.duration;
  const totalTimeInMinutes = Math.round(totalTimeInSeconds / 60);
  const reachByTime = new Date(
    Date.now() + totalTimeInSeconds * 1000
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate time for each mode
  const legTimes = route.legs.map((leg) => {
    const startTime = new Date(leg.startTime);
    const endTime = new Date(leg.endTime);
    return {
      mode: leg.mode,
      timeInMinutes: Math.round((endTime - startTime) / 60000), // Convert ms to minutes
    };
  });

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    // Check if scrolling reached the beginning or end
    setShowLeftFade(contentOffset.x > 0);
    setShowRightFade(
      contentOffset.x < contentSize.width - layoutMeasurement.width
    );
  };

  return (
    <View className="p-5 mb-5 bg-white rounded-lg shadow-md border border-gray-200">
      {/* Modes of Transport */}
      <View className="relative">
        {/* Left Fade */}
        {showLeftFade && (
          <LinearGradient
            colors={["rgba(255,255,255,1)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 32,
              zIndex: 1,
            }}
          />
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {legTimes.map((leg, index) => (
            <View key={index} className="flex-row items-center">
              <View className="flex items-center">
                {modeIcons[leg.mode]}
                <Text className="text-sm text-gray-700 mt-2 font-medium">
                  {leg.timeInMinutes} min
                </Text>
              </View>
              {/* Arrow Icon (not after the last mode) */}
              {index < legTimes.length - 1 && (
                <FontAwesome5
                  name="arrow-right"
                  size={14}
                  color="#065f46"
                  className="mx-4"
                />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Right Fade */}
        {showRightFade && (
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 12,
              zIndex: 1,
            }}
          />
        )}
      </View>

      {/* Separator */}
      <View className="h-[1px] bg-gray-200 my-3" />

      {/* Total Time and Reach By */}
      <View className="flex-row justify-between items-center my-1">
        <View>
          <Text className="text-sm text-gray-600">
            Total Duration:{" "}
            <Text className="font-semibold text-md text-emerald-800">
              {totalTimeInMinutes} min
            </Text>
          </Text>
        </View>
        <CarbonSave value={route.carbonEmission} />
      </View>

      {/* Separator */}
      <View className="h-[1px] bg-gray-200 my-3" />

      {/* Fare and Small Button */}
      <View className="flex-row justify-between items-center mt-1">
        <Text className="text-md text-gray-800 font-semibold">
          Fare: <Text className="text-lg font-bold text-emerald-800">₹80</Text>
        </Text>
        {/* Styled TouchableHighlight Button */}
        <TouchableHighlight
          onPress={() =>
            router.push({
              pathname: "/(tabs)/travel/mapscreen",
              params: {
                id: id,
                route: JSON.stringify(route),
              },
            })
          }
          underlayColor="#047857"
          style={{
            backgroundColor: "#047857", // Slightly lighter green for better contrast
            borderRadius: 6, // Slightly rounded corners for a modern look
            paddingVertical: 8, // More padding for a comfortable clickable area
            paddingHorizontal: 16, // Balanced horizontal padding
            shadowColor: "#000", // Subtle shadow for a raised button effect
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3, // Shadow on Android
          }}
        >
          <View className="flex-row items-center justify-between space-x-4 w-[4rem]">
            <Text className="text-md font-medium text-white">Travel</Text>
            <FontAwesome5 name="arrow-right" size={14} color="#ffffff" />
          </View>
        </TouchableHighlight>
      </View>
    </View>
  );
};

export default RouteCard;
