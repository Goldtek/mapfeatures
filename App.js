import React, { useEffect, useState } from 'react';
import { View, Text, PermissionsAndroid, Platform, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

const geofences = [
  { id: '1', latitude: 6.605874, longitude: 3.349149, radius: 100 },
  { id: '2', latitude: 6.623205, longitude: -122.084, radius: 100 },
  { id: '3', latitude: 6.806, longitude: 3.807, radius: 100 },
];

const App = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 0, longitude: 0 });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const granted = await Geolocation.requestAuthorization('always');
      setPermissionGranted(granted === 'granted');
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message: 'This app needs to access your location for geofencing',
          }
        );
        setPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    if (permissionGranted) {
      const locationWatchId = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });

          geofences.forEach((geofence) => {
            if (isInGeofence({ latitude, longitude }, geofence)) {
              Alert.alert('Geofence Entered', `You entered geofence with id: ${geofence.id}`);
            }
          });
        },
        (error) => {
          console.log(error.code, error.message);
        },
        { enableHighAccuracy: false, distanceFilter: 100, interval: 10000, fastestInterval: 5000 } 
      );

      return () => {
        Geolocation.clearWatch(locationWatchId);
      };
    }
  }, [permissionGranted]);

  const isInGeofence = (userLocation, geofence) => {
    // ... distance calculation logic
    return getDistanceFromLatLonInKm(
      userLocation.latitude,
      userLocation.longitude,
      geofence.latitude,
      geofence.longitude
    );
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const deg2rad = (deg) => deg * (Math.PI / 180);
    const R = 6371; // Earth radius in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

  return distance;
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >

        {/* Marker for the current position */}
        <Marker coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }} />

        {geofences.map((geofence) => (
          <React.Fragment key={geofence.id}>
            <Marker coordinate={{ latitude: geofence.latitude, longitude: geofence.longitude }} />
            <Circle
              center={{ latitude: geofence.latitude, longitude: geofence.longitude }}
              radius={geofence.radius}
              strokeColor="rgba(0, 0, 255, 0.5)"
              fillColor="rgba(0, 0, 255, 0.2)"
            />
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
};

export default App;
