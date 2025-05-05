import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BleManager, Device } from "react-native-ble-plx";

type RootStackParamList = {
  Home: undefined;
  DevicePairingScreen: undefined;
  WaterQualityScreen: { deviceId: string };
  Analysis: { sensorData: any; time: string; location: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "DevicePairingScreen">;

const DevicePairingScreen: React.FC<Props> = ({ navigation }) => {
  const [manager] = useState(() => new BleManager());
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
      manager.destroy();
    };
  }, [manager]);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const allGranted = Object.values(granted).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );

        return allGranted;
      } catch (err) {
        console.warn("Permission error:", err);
        return false;
      }
    }
    return true;
  };

  const startScan = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert("Permission Denied", "Bluetooth and Location access are required.");
      return;
    }

    setDevices([]);
    setScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setScanning(false);
        Alert.alert("Scan Error", error.message);
        return;
      }

      if (device && device.name?.includes("NeerScan")) {
        setDevices((prev) => {
          const exists = prev.some((d) => d.id === device.id);
          if (!exists) return [...prev, device];
          return prev;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 10000); // 10 seconds scan
  };

  const connectToDevice = async (device: Device) => {
    try {
      setConnectingDeviceId(device.id);
      manager.stopDeviceScan();

      const connectedDevice = await manager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();

      setConnectingDeviceId(null);
      navigation.navigate("WaterQualityScreen", { deviceId: device.id });
    } catch (err) {
      console.error("Connection error:", err);
      Alert.alert("Connection Failed", "Unable to connect to the device.");
      setConnectingDeviceId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available NeerScan Devices</Text>

      {scanning ? (
        <ActivityIndicator size="large" color="#0D47A1" />
      ) : (
        <TouchableOpacity style={styles.scanButton} onPress={startScan}>
          <Text style={styles.scanButtonText}>Scan for Devices</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() =>
          !scanning && (
            <Text style={styles.emptyMessage}>No devices found. Try scanning again.</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.deviceItem,
              connectingDeviceId === item.id && styles.selectedDevice,
            ]}
            onPress={() => connectToDevice(item)}
            disabled={!!connectingDeviceId}
          >
            <View>
              <Text style={styles.deviceName}>{item.name || "Unnamed Device"}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </View>
            {connectingDeviceId === item.id && (
              <ActivityIndicator size="small" color="#0D47A1" />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default DevicePairingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#E3F2FD" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0D47A1",
    textAlign: "center",
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: "#0D47A1",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  scanButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  deviceItem: {
    backgroundColor: "#BBDEFB",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedDevice: {
    backgroundColor: "#64B5F6",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D47A1",
  },
  deviceId: {
    fontSize: 14,
    color: "#333",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    marginTop: 20,
  },
});
