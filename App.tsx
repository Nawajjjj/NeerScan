import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import DevicePairingScreen from "./src/screens/DevicePairingScreen";
import WaterQualityScreen from "./src/screens/WaterQualityScreen";
import Analysis from "./src/screens/Analysis";

export type SensorData = {
  pH: number | null;
  TDS: number | null;
  Turbidity: number | null;
};

export type RootStackParamList = {
  Home: undefined;
  DevicePairingScreen: undefined;
  WaterQualityScreen: { deviceId: string };
  Analysis: { sensorData: SensorData; time: string; location: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DevicePairingScreen" component={DevicePairingScreen} />
        <Stack.Screen name="WaterQualityScreen" component={WaterQualityScreen} />
        <Stack.Screen name="Analysis" component={Analysis} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
