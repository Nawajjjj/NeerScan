import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Button,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { BleManager, Device, Subscription } from "react-native-ble-plx";
import { Buffer } from "buffer";
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Home: undefined;
  WaterQualityScreen: { deviceId: string };
  DevicePairingScreen: undefined;
  Analysis: {
    sensorData: SensorData;
    time: string;
    location: string;
  };
};

type SensorData = {
  pH: number | null;
  TDS: number | null;
  Turbidity: number | null;
};

type Props = NativeStackScreenProps<RootStackParamList, "WaterQualityScreen">;

const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0".toLowerCase();
const CHARACTERISTIC_UUID = "87654321-4321-6789-4321-fedcba987654".toLowerCase();

const WaterQualityScreen: React.FC<Props> = ({ route }) => {
  const { deviceId } = route.params;
  const navigation = useNavigation<any>();
  const [sensorData, setSensorData] = useState<SensorData>({
    pH: null,
    TDS: null,
    Turbidity: null,
  });
  const [loading, setLoading] = useState(true);
  const [delayComplete, setDelayComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manager] = useState(new BleManager());
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [location, setLocation] = useState<string>("Fetching location...");

  useEffect(() => {
    let isMounted = true;

    const delayTimeout = setTimeout(() => {
      if (isMounted) setDelayComplete(true);
    }, 5000);

    const requestLocationPermission = async () => {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "NeerScan needs location access to attach to the reading.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };

    const fetchLocation = async () => {
      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        setLocation("Location permission denied");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted) {
            const { latitude, longitude } = position.coords;
            setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error("Location Error:", error.message);
          setLocation("Location not available");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
      );
    };

    const connectAndReadData = async () => {
      try {
        console.log("🔹 Connecting to device:", deviceId);
        const device = await manager.connectToDevice(deviceId);
        setConnectedDevice(device);
        console.log("✅ Connected to device");

        await device.discoverAllServicesAndCharacteristics();
        console.log("🔍 Discovered all services and characteristics");

        const bleSubscription = device.monitorCharacteristicForService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          (error, characteristic) => {
            if (error) {
              console.error("❌ Monitor Error:", error.message);
              setError("Error reading BLE data.");
              return;
            }

            if (characteristic?.value) {
              const decoded = Buffer.from(characteristic.value, "base64").toString("utf-8").trim();
              console.log("📩 Received Data:", decoded);

              try {
                const parsed = JSON.parse(decoded);
                setSensorData((prev) => ({
                  pH: parsed.pH ?? prev.pH,
                  TDS: parsed.TDS ?? prev.TDS,
                  Turbidity: parsed.Turbidity ?? prev.Turbidity,
                }));
                setLoading(false);
                AsyncStorage.setItem("sensorData", JSON.stringify(parsed));
              } catch (e) {
                console.error("JSON parse error:", e);
                setError("Invalid data format");
              }
            }
          }
        );

        setSubscription(bleSubscription);
      } catch (err: any) {
        console.error("Connection Error:", err);
        Alert.alert("Connection Failed", "Could not connect to device.");
        setError("Failed to connect to device.");
      }
    };

    fetchLocation();
    connectAndReadData();

    return () => {
      console.log("🧹 Cleaning up BLE connection...");
      subscription?.remove();
      if (connectedDevice) {
        connectedDevice.cancelConnection();
      }
      manager.destroy();
      clearTimeout(delayTimeout);
      isMounted = false;
    };
  }, [deviceId]);

  const isDataAvailable =
    sensorData.pH !== null || sensorData.TDS !== null || sensorData.Turbidity !== null;

  const getRestorationSuggestions = () => {
    const { pH, TDS, Turbidity } = sensorData;
    let suggestions: string[] = [];
    let purifier = "Standard Activated Carbon Filter";
    let isSafe = true;

    if (pH !== null) {
      if (pH < 6.5) {
        suggestions.push("⚠️ pH too low! Add limestone or baking soda.");
        isSafe = false;
      } else if (pH > 8.5) {
        suggestions.push("⚠️ pH too high! Use aluminum sulfate.");
        isSafe = false;
      } else {
        suggestions.push("✅ pH level is safe.");
      }
    }

    if (TDS !== null) {
      if (TDS > 500) {
        suggestions.push("⚠️ High TDS! Use RO filter.");
        purifier = "Reverse Osmosis (RO)";
        isSafe = false;
      } else if (TDS  <150) {
        suggestions.push("⚠️ TDS too low! Add minerals.");
        isSafe = false;
      } else {
        suggestions.push("✅ TDS is in the safe range.");
      }
    }

    if (Turbidity !== null) {
      if (Turbidity > 5) {
        suggestions.push("⚠️ High turbidity! Use UV/UF purifier.");
        purifier = "UV + UF Filter";
        isSafe = false;
      } else {
        suggestions.push("✅ Turbidity level is safe.");
      }
    }

    return { suggestions, purifier, isSafe };
  };

  const { suggestions, purifier, isSafe } = getRestorationSuggestions();

  const handleAnalysis = () => {
    const time = new Date().toLocaleString();
    navigation.navigate("Analysis", { sensorData, time, location });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>💧 Water Quality Analysis</Text>

      {loading || !isDataAvailable || !delayComplete ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Fetching Water Quality Data...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Sensor Readings</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>pH (6.5–8.5):</Text>
              <Text style={styles.dataValue}>{sensorData.pH?.toFixed(2)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>TDS (50-150 ppm):</Text>
              <Text style={styles.dataValue}>{sensorData.TDS?.toFixed(2)} ppm</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Turbidity (≤ 5 NTU):</Text>
              <Text style={styles.dataValue}>{sensorData.Turbidity?.toFixed(2)} NTU</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Suggestions</Text>
            {suggestions.map((s, idx) => (
              <Text key={idx} style={styles.suggestion}>• {s}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔹 Recommended Purifier</Text>
            <Text style={styles.purifier}>{purifier}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚰 Safety Check</Text>
            <Text style={[styles.safetyText, { color: isSafe ? "green" : "red" }]}>{isSafe ? "✅ Water is SAFE for drinking." : "❌ Water is NOT safe for drinking!"}</Text>
          </View>

          <View style={{ marginTop: 20 }}>
            <Button title="📈 View Detailed Analysis" onPress={handleAnalysis} color="#007AFF" />
          </View>
        </>
      )}

      {error && <Text style={styles.errorText}>⚠️ {error}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f0f8ff" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#007AFF" },
  section: { backgroundColor: "#e3f2fd", padding: 15, borderRadius: 12, marginBottom: 15, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#01579b" },
  dataRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  dataLabel: { fontSize: 16, fontWeight: "600" },
  dataValue: { fontSize: 16, fontWeight: "bold", color: "#00796b" },
  suggestion: { fontSize: 14, marginVertical: 3 },
  purifier: { fontSize: 16, fontWeight: "bold", color: "#00796b" },
  safetyText: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  errorText: { color: "red", fontSize: 16, textAlign: "center", marginTop: 10 },
  loadingContainer: { alignItems: "center", justifyContent: "center", flex: 1, paddingTop: 60 },
  loadingText: { marginTop: 10, fontSize: 18, color: "#007AFF" },
});

export default WaterQualityScreen;
