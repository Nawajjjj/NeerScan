import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Image, View, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

type RootStackParamList = {
  Home: undefined;
  WaterQualityScreen: undefined;
  DevicePairingScreen: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with Gradient */}
        <LinearGradient colors={['#0D47A1', '#1976D2']} style={styles.header}>
          <Image source={require('../../assets/water-drop.png')} style={styles.logo} />
          <Text style={styles.title}>NeerScan</Text>
          <Text style={styles.subtitle}>Real-time Water Quality Monitoring</Text>
        </LinearGradient>

        {/* Features Section with Glassmorphism */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>🔹 Key Features</Text>
          {[
            'Real-time water quality monitoring',
            'Safety status of drinking water',
            'Recommendations for water purification',
            'IoT-based sensor connectivity',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.bullet}>✔</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DevicePairingScreen')}>
          <LinearGradient colors={['#1976D2', '#64B5F6']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>🔗 Connect to Bluetooth</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    marginTop: 5,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginVertical: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    backdropFilter: 'blur(10px)',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 10,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  bullet: {
    fontSize: 18,
    color: '#0D47A1',
    marginRight: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  button: {
    width: '90%',
    borderRadius: 12,
    marginTop: 20,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
