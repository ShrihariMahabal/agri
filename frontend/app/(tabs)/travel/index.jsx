import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const Travel = () => {
  const [region, setRegion] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [isSelecting, setIsSelecting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const mapRef = useRef(null);

  // Get user's location on component mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadingLocation(true);
      
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoadingLocation(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          maximumAge: 10000
        });
        
        const initialRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        
        setRegion(initialRegion);
        // Ensure map centers on user's location when it loads
        setTimeout(() => {
          mapRef.current?.animateToRegion(initialRegion, 1000);
        }, 500);
      } catch (error) {
        setErrorMsg('Could not fetch location. Please check your GPS settings.');
        console.error("Location error:", error);
        
        // Set a default region if location access fails
        setRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        });
      } finally {
        setLoadingLocation(false);
        setLoading(false);
      }
    })();
  }, []);

  // Handle map press to add polygon points
  const handleMapPress = (event) => {
    if (isSelecting) {
      const { coordinate } = event.nativeEvent;
      setPolygonPoints([...polygonPoints, coordinate]);
    }
  };

  // Reset polygon selection
  const resetSelection = () => {
    setPolygonPoints([]);
    setIsSelecting(true);
  };

  // Undo last point
  const undoLastPoint = () => {
    if (polygonPoints.length > 0) {
      setPolygonPoints(polygonPoints.slice(0, -1));
    }
  };

  // Complete polygon and navigate to dashboard
  const completePolygon = () => {
    if (polygonPoints.length >= 3) {
      // Save polygon points to global state or async storage
      // Here we'll use router.push with params
      router.push({
        pathname: '/(tabs)/travel/routescreen',
        params: {
          polygonData: JSON.stringify(polygonPoints)
        }
      });
    } else {
      alert('Please select at least 3 points to form a valid area');
    }
  };

  // Recenter map on user's location
  const centerOnLocation = async () => {
    if (region) {
      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
        });
        
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        
        mapRef.current?.animateToRegion(newRegion, 1000);
      } catch (error) {
        alert('Could not get current location');
        console.error("Location error:", error);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1924" />
        <ActivityIndicator size="large" color="#00ffcc" />
        <Text style={[styles.loadingText, { fontFamily: 'Poppins_500Medium' }]}>
          {loadingLocation ? 'Getting your location...' : 'Loading map...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMsg && !region) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1924" />
        <Ionicons name="warning-outline" size={48} color="#00ffcc" />
        <Text style={[styles.errorText, { fontFamily: 'Poppins_500Medium' }]}>{errorMsg}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setErrorMsg(null);
            setLoading(true);
            setLoadingLocation(true);
          }}
        >
          <Text style={[styles.retryButtonText, { fontFamily: 'Poppins_600SemiBold' }]}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1924" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#0f1924', '#182635']}
          style={styles.headerGradient}
        >
          <Text style={[styles.headerTitle, { fontFamily: 'Poppins_600SemiBold' }]}>Farm Area Selection</Text>
          <Text style={[styles.headerSubtitle, { fontFamily: 'Poppins_400Regular' }]}>
            Tap on the map to mark the boundaries of your farm
          </Text>
        </LinearGradient>
      </View>
      
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={handleMapPress}
          mapType="satellite"
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={false}
          loadingEnabled={true}
          toolbarEnabled={false}
        >
          {/* Polygon outline */}
          {polygonPoints.length > 0 && (
            <Polygon
              coordinates={polygonPoints}
              strokeColor="#00ffcc"
              fillColor="rgba(0, 255, 204, 0.2)"
              strokeWidth={2}
            />
          )}
          
          {/* Polygon points */}
          {polygonPoints.map((point, index) => (
            <Marker
              key={index}
              coordinate={point}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerOuter}>
                  <View style={styles.markerInner}>
                    <Text style={styles.markerText}>{index + 1}</Text>
                  </View>
                </View>
              </View>
            </Marker>
          ))}
          
          {/* Connection lines between points */}
          {polygonPoints.length > 1 && (
            polygonPoints.map((point, index) => {
              if (index === polygonPoints.length - 1) return null;
              
              return (
                <Polygon
                  key={`line-${index}`}
                  coordinates={[point, polygonPoints[index + 1]]}
                  strokeColor="#00ffcc"
                  strokeWidth={2}
                />
              );
            })
          )}
        </MapView>
        
        {/* Location button */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={centerOnLocation}
        >
          <Ionicons name="locate" size={22} color="#00ffcc" />
        </TouchableOpacity>
        
        {/* Info panel */}
        <View style={styles.infoPanel}>
          <Ionicons name="information-circle-outline" size={16} color="#00ffcc" style={styles.infoPanelIcon} />
          <Text style={[styles.infoPanelText, { fontFamily: 'Poppins_500Medium' }]}>
            Points: {polygonPoints.length} {polygonPoints.length >= 3 ? '✓' : ''}
          </Text>
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.secondaryButton,
            polygonPoints.length === 0 ? styles.buttonDisabled : null
          ]}
          onPress={undoLastPoint}
          disabled={polygonPoints.length === 0}
        >
          <Ionicons 
            name="arrow-undo" 
            size={18} 
            color={polygonPoints.length === 0 ? '#8b9eb5' : '#00ffcc'} 
          />
          <Text style={[
            styles.buttonText, 
            styles.secondaryButtonText,
            polygonPoints.length === 0 ? styles.buttonTextDisabled : null,
            { fontFamily: 'Poppins_500Medium' }
          ]}>
            Undo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button, 
            styles.warningButton,
            polygonPoints.length === 0 ? styles.buttonDisabled : null
          ]}
          onPress={resetSelection}
          disabled={polygonPoints.length === 0}
        >
          <Ionicons 
            name="refresh" 
            size={18} 
            color={polygonPoints.length === 0 ? '#8b9eb5' : '#ff6b6b'} 
          />
          <Text style={[
            styles.buttonText, 
            styles.warningButtonText,
            polygonPoints.length === 0 ? styles.buttonTextDisabled : null,
            { fontFamily: 'Poppins_500Medium' }
          ]}>
            Reset
          </Text>
        </TouchableOpacity>
        
        {isSelecting && polygonPoints.length >= 3 && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={completePolygon}
          >
            <Ionicons name="checkmark-circle" size={18} color="#0f1924" />
            <Text style={[styles.buttonText, { fontFamily: 'Poppins_600SemiBold' }]}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Help text */}
      <View style={styles.helpContainer}>
        <Ionicons name="help-circle-outline" size={14} color="#8b9eb5" style={styles.helpIcon} />
        <Text style={[styles.helpText, { fontFamily: 'Poppins_400Regular' }]}>
          Mark at least 3 points to define your farm boundaries
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1924',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8b9eb5',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#D84315',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#546E7A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerGradient: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 6,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  instructionOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -150,
    marginTop: -60,
    width: 300,
    backgroundColor: 'rgba(55, 71, 79, 0.85)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  instructionText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  locationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  infoPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoPanelIcon: {
    marginRight: 4,
  },
  infoPanelText: {
    fontWeight: '600',
    color: '#455A64',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuter: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerInner: {
    backgroundColor: '#455A64',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#182635',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
    marginTop: -4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#00ffcc',
    paddingHorizontal: 24,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00ffcc',
    elevation: 0,
    shadowOpacity: 0,
  },
  warningButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(139, 158, 181, 0.1)',
    borderColor: '#8b9eb5',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#0f1924',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#00ffcc',
  },
  warningButtonText: {
    color: '#ff6b6b',
  },
  buttonTextDisabled: {
    color: '#8b9eb5',
  },
  helpContainer: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#182635',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  helpText: {
    color: '#8b9eb5',
    fontSize: 13,
  },
});

export default Travel;