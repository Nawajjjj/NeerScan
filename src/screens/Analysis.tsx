import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid } from 'react-native';

// Define type for the data
interface WaterData {
    pH: number;
    TDS: number;
    turbidity: number;
    isDrinkable: boolean;
    location: string;
    timestamp: string;
}

const Analysis = () => {
    const [currentData, setCurrentData] = useState<WaterData>({
        pH: 7.2,
        TDS: 250,
        turbidity: 5,
        isDrinkable: false,
        location: "Fetching location...",
        timestamp: new Date().toLocaleString(),
    });

    const [previousData, setPreviousData] = useState<WaterData[]>([]);
    const [loading, setLoading] = useState(false);  // Loading state for data fetching

    // Fetch previous water quality data from AsyncStorage
    useEffect(() => {
        const loadPreviousData = async () => {
            try {
                const data = await AsyncStorage.getItem('waterData');
                if (data) {
                    setPreviousData(JSON.parse(data));
                }
            } catch (error) {
                console.error("Error loading previous data: ", error);
            }
        };
        loadPreviousData();
    }, []);

    // Request location permission (Android)
    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    fetchLocation();
                } else {
                    setCurrentData(prevState => ({
                        ...prevState,
                        location: "Location permission denied",
                    }));
                }
            } catch (err) {
                console.warn(err);
            }
        } else {
            fetchLocation(); // For iOS, assume permission is granted
        }
    };

    // Fetch real-time location
    const fetchLocation = () => {
        setLoading(true);  // Start loading when fetching location
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentData(prevState => ({
                    ...prevState,
                    location: `Lat: ${latitude}, Lon: ${longitude}`,
                    timestamp: new Date().toLocaleString(),
                }));
                setLoading(false);  // Stop loading when done
            },
            (error) => {
                console.log(error.message);
                setCurrentData(prevState => ({
                    ...prevState,
                    location: 'Unable to fetch location',
                }));
                setLoading(false);  // Stop loading even if there's an error
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    // Call requestLocationPermission on mount to check permissions
    useEffect(() => {
        requestLocationPermission();
    }, []);

    // Check if the water is drinkable
    const checkDrinkability = (pH: number, TDS: number, turbidity: number): boolean => {
        return pH >= 6.5 && pH <= 8.5 && TDS <= 500 && turbidity <= 5;
    };

    // Update drinkability status based on water quality values
    useEffect(() => {
        const isDrinkable = checkDrinkability(currentData.pH, currentData.TDS, currentData.turbidity);
        setCurrentData(prevState => ({ ...prevState, isDrinkable }));
    }, [currentData.pH, currentData.TDS, currentData.turbidity]);

    // Save current data to AsyncStorage
    useEffect(() => {
        const saveData = async () => {
            try {
                const storedData = await AsyncStorage.getItem('waterData');
                const parsedData = storedData ? JSON.parse(storedData) : [];
                parsedData.push(currentData);
                await AsyncStorage.setItem('waterData', JSON.stringify(parsedData));
                setPreviousData(parsedData);  // Update previous data display after saving
            } catch (error) {
                console.error("Error saving data: ", error);
            }
        };
        saveData();
    }, [currentData]);
    // Simulate data refresh (real data fetch would replace this)
    const simulateDataRefresh = () => {
        setLoading(true);
        // Simulating new sensor data
        setTimeout(() => {
            const newData: WaterData = {
                pH: (Math.random() * (8.5 - 6.5) + 6.5).toFixed(2),
                TDS: Math.floor(Math.random() * 600),
                turbidity: Math.floor(Math.random() * 10),
                isDrinkable: checkDrinkability(Number((Math.random() * (8.5 - 6.5) + 6.5).toFixed(2)), Math.floor(Math.random() * 600), Math.floor(Math.random() * 10)),
                location: currentData.location,
                timestamp: new Date().toLocaleString(),
            };
            setCurrentData(newData);
            setLoading(false);
        }, 2000);  // Simulate delay for new data
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Water Quality Analysis</Text>

            {/* Current Data Display */}
            <View style={styles.dataContainer}>
                <Text style={styles.data}>pH Level: {currentData.pH}</Text>
                <Text style={styles.data}>TDS Level: {currentData.TDS} ppm</Text>
                <Text style={styles.data}>Turbidity: {currentData.turbidity} NTU</Text>
                <Text style={styles.data}>
                    Water Drinkable: {currentData.isDrinkable ? "Yes" : "No"}
                </Text>
                <Text style={styles.data}>Location: {currentData.location}</Text>
                <Text style={styles.data}>Time: {currentData.timestamp}</Text>
            </View>

            {/* Loading Spinner */}
            {loading && <ActivityIndicator size="large" color="#0000ff" />}

            {/* Previous Data Display */}
            <Text style={styles.heading}>Previous Data</Text>
            {previousData.length === 0 ? (
                <Text style={styles.noDataText}>No previous data available.</Text>
            ) : (
                previousData.map((item, index) => (
                    <View key={index} style={styles.dataContainer}>
                        <Text style={styles.data}>pH: {item.pH}</Text>
                        <Text style={styles.data}>TDS: {item.TDS} ppm</Text>
                        <Text style={styles.data}>Turbidity: {item.turbidity} NTU</Text>
                        <Text style={styles.data}>
                            Water Drinkable: {item.isDrinkable ? "Yes" : "No"}
                        </Text>
                        <Text style={styles.data}>Location: {item.location}</Text>
                        <Text style={styles.data}>Time: {item.timestamp}</Text>
                    </View>
                ))
            )}

            {/* Refresh Button */}
            <Button
                title="Refresh Data"
                onPress={simulateDataRefresh}
                disabled={loading}  // Disable button while loading
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f7f7f7',
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    dataContainer: {
        marginBottom: 15,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    data: {
        fontSize: 16,
        marginBottom: 5,
    },
    noDataText: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'center',
    },
});

export default Analysis;
