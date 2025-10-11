import React, { useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeLocation } from './safeLocations';
import MapFallback from './MapFallback';
import { NavigationState } from './navigationService';
import { FamilyMember } from './familyService';

interface EmbeddedMapProps {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  safeLocations?: SafeLocation[];
  familyMembers?: FamilyMember[];
  height?: number;
  onLocationPress?: (location: SafeLocation) => void;
  navigationState?: NavigationState;
  onStartNavigation?: (location: SafeLocation) => void;
}

export default function EmbeddedMap({ 
  userLocation, 
  safeLocations = [], 
  familyMembers = [],
  height = 400,
  onLocationPress,
  navigationState,
  onStartNavigation
}: EmbeddedMapProps) {
  const { width } = Dimensions.get('window');
  const [hasError, setHasError] = useState(false);
  const [webViewRef, setWebViewRef] = useState<WebView | null>(null);

  // Update map when navigation state changes
  useEffect(() => {
    if (webViewRef && navigationState) {
      const updateScript = `
        if (typeof updateNavigation === 'function') {
          updateNavigation(${JSON.stringify(navigationState)});
        } else if (typeof updateUserHeading === 'function' && ${navigationState.heading !== undefined}) {
          // If not navigating but we have heading data, just update the arrow rotation
          updateUserHeading(${navigationState.heading});
        }
      `;
      webViewRef.injectJavaScript(updateScript);
    }
  }, [navigationState, webViewRef]);

  // Generate marker colors for different types
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'red';
      case 'fire_station': return 'orange';
      case 'police': return 'blue';
      case 'shelter': return 'green';
      case 'emergency_center': return 'purple';
      case 'family_safe': return '#10B981'; // Green for safe family members
      case 'family_emergency': return '#EF4444'; // Red for family members in emergency
      default: return 'gray';
    }
  };

  // Calculate map center and zoom
  const getMapCenter = () => {
    if (userLocation) {
      return { lat: userLocation.latitude, lng: userLocation.longitude, zoom: 13 };
    }
    if (safeLocations.length > 0) {
      // Calculate center of all safe locations
      const avgLat = safeLocations.reduce((sum, loc) => sum + loc.latitude, 0) / safeLocations.length;
      const avgLng = safeLocations.reduce((sum, loc) => sum + loc.longitude, 0) / safeLocations.length;
      return { lat: avgLat, lng: avgLng, zoom: 12 };
    }
    // Default to Colombo, Sri Lanka
    return { lat: 6.9271, lng: 79.8612, zoom: 11 };
  };

  const mapCenter = getMapCenter();

  // Generate the complete HTML content with embedded JavaScript
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .leaflet-popup-content-wrapper { border-radius: 8px; }
        .leaflet-popup-content { margin: 12px; }
        .user-location-arrow {
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 20px solid #007AFF;
          transform-origin: center;
          transform: rotate(0deg);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        // Initialize the map
        var map = L.map('map', {
          zoomControl: true,
          attributionControl: true
        }).setView([${mapCenter.lat}, ${mapCenter.lng}], ${mapCenter.zoom});

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        // Global variables
        var userMarker = null;
        var navigationLine = null;
        var isNavigating = false;

        // Add user location marker if available
        ${userLocation ? `
        userMarker = L.marker([${userLocation.latitude}, ${userLocation.longitude}])
          .addTo(map)
          .bindPopup('<b>Your Location</b><br>You are here')
          .openPopup();
        
        // Create arrow icon for user location
        var createUserArrowIcon = function(heading) {
          var rotation = heading !== null ? heading : 0;
          return L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-location-arrow" style="transform: rotate(' + rotation + 'deg);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
        };
        
        userMarker.setIcon(createUserArrowIcon(null));
        ` : ''}

        // Add safe location markers
        ${safeLocations.map((location, index) => {
          const color = getMarkerColor(location.type);
          const locationName = location.name.replace(/"/g, '\\"');
          const locationAddress = location.address.replace(/"/g, '\\"');
          const locationType = location.type.replace('_', ' ').toUpperCase();
          const locationDescription = location.description ? location.description.replace(/"/g, '\\"') : '';
          
          return `
        var marker${index} = L.marker([${location.latitude}, ${location.longitude}])
          .addTo(map)
          .bindPopup(\`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #333;">${locationName}</h3>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">${locationType}</p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">${locationAddress}</p>
              ${locationDescription ? `<p style="margin: 0 0 8px 0; color: #888; font-size: 11px;">${locationDescription}</p>` : ''}
              <button onclick="startNavigation('${location.id}')" 
                style="background: #007AFF; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin-right: 8px;">
                🧭 Start Navigation
              </button>
              <button onclick="showDetails('${location.id}')" 
                style="background: #6B7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; margin-right: 8px;">
                📍 Details
              </button>
              ${location.phone ? `
              <button onclick="callLocation('${location.phone}')" 
                style="background: #34C759; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Call
              </button>` : ''}
            </div>
          \`);
        
        var icon${index} = L.divIcon({
          className: 'safe-location-marker',
          html: '<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        marker${index}.setIcon(icon${index});
          `;
        }).join('')}

        // Add family member markers
        ${familyMembers.filter(member => member.location).map((member, index) => {
          const color = getMarkerColor(member.status === 'safe' ? 'family_safe' : 'family_emergency');
          const memberName = member.name.replace(/"/g, '\\"');
          const memberRelationship = member.relationship.replace(/"/g, '\\"');
          const statusText = member.status === 'safe' ? 'Safe' : 'Emergency';
          const statusEmoji = member.status === 'safe' ? '✅' : '🆘';
          
          return `
        var familyMarker${index} = L.marker([${member.location!.latitude}, ${member.location!.longitude}])
          .addTo(map)
          .bindPopup(\`
            <div style="min-width: 180px;">
              <h3 style="margin: 0 0 8px 0; color: #333;">${statusEmoji} ${memberName}</h3>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 12px; text-transform: capitalize;">${memberRelationship}</p>
              <p style="margin: 0 0 8px 0; color: ${member.status === 'safe' ? '#10B981' : '#EF4444'}; font-size: 12px; font-weight: bold;">${statusText}</p>
              ${member.location!.address ? `<p style="margin: 0 0 8px 0; color: #888; font-size: 11px;">${member.location!.address}</p>` : ''}
              <button onclick="callFamilyMember('${member.phoneNumber}')"
                style="background: #34C759; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 8px;">
                📞 Call
              </button>
              <button onclick="sendSOS('${member.id}')"
                style="background: #FF3B30; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                🆘 SOS
              </button>
            </div>
          \`);
        
        var familyIcon${index} = L.divIcon({
          className: 'family-member-marker',
          html: '<div style="background: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); position: relative;"><div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: white; border-radius: 50%; border: 1px solid ${color};"></div></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        familyMarker${index}.setIcon(familyIcon${index});
          `;
        }).join('')}

        // Navigation functions
        function startNavigation(locationId) {
          window.ReactNativeWebView.postMessage('navigate:' + locationId);
        }

        function showDetails(locationId) {
          window.ReactNativeWebView.postMessage('show_details:' + locationId);
        }

        function callLocation(phone) {
          window.ReactNativeWebView.postMessage('call:' + phone);
        }

        function callFamilyMember(phoneNumber) {
          window.ReactNativeWebView.postMessage('call_family:' + phoneNumber);
        }

        function sendSOS(memberId) {
          window.ReactNativeWebView.postMessage('send_sos:' + memberId);
        }

        // Function to update navigation state from React Native
        window.updateNavigation = function(navState) {
          if (navState.isNavigating && navState.route) {
            displayNavigation(navState);
          } else {
            stopNavigation();
          }
        };

        // Function to update user heading when not navigating
        window.updateUserHeading = function(heading) {
          if (userMarker && !isNavigating) {
            // Update user marker icon with heading rotation
            if (typeof createUserArrowIcon !== 'undefined') {
              userMarker.setIcon(createUserArrowIcon(heading));
            }
          }
        };

        function displayNavigation(navState) {
          // Remove existing navigation line
          if (navigationLine) {
            map.removeLayer(navigationLine);
          }

          // Use actual route points from OSRM instead of generating simulated ones
          var routePoints = navState.route.points.map(point => [point.latitude, point.longitude]);

          // Create navigation line with Google Maps style
          navigationLine = L.polyline(routePoints, {
            color: '#007AFF',
            weight: 6,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(map);

          // Update user marker position and rotation if available
          if (navState.currentLocation && userMarker) {
            userMarker.setLatLng([navState.currentLocation.latitude, navState.currentLocation.longitude]);
            
            // Update user marker icon with heading rotation
            if (typeof createUserArrowIcon !== 'undefined') {
              var heading = navState.heading !== undefined && navState.heading !== null ? navState.heading : 0;
              userMarker.setIcon(createUserArrowIcon(heading));
            }
            
            // Update popup with navigation info
            var popupContent = 
              '<div style="min-width: 200px; text-align: center;">' +
                '<h3 style="margin: 0 0 8px 0; color: #007AFF;">🧭 Navigating</h3>' +
                '<p style="margin: 0 0 4px 0; font-weight: bold;">Distance: ' + navState.remainingDistance.toFixed(1) + ' km</p>' +
                '<p style="margin: 0 0 4px 0;">ETA: ' + Math.round(navState.estimatedTimeArrival) + ' min</p>' +
                '<p style="margin: 0 0 8px 0; font-style: italic;">' + navState.nextInstruction + '</p>' +
                '<button onclick="stopNavigationFromMap()" style="background: #FF3B30; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Stop Navigation</button>' +
              '</div>';
            userMarker.bindPopup(popupContent).openPopup();
          }

          // Fit map to show route
          if (routePoints.length > 0) {
            map.fitBounds(navigationLine.getBounds(), { padding: [20, 20] });
          }

          isNavigating = true;
        }

        function stopNavigation() {
          if (navigationLine) {
            map.removeLayer(navigationLine);
            navigationLine = null;
          }
          
          if (userMarker) {
            userMarker.bindPopup('<b>Your Location</b><br>You are here').closePopup();
            
            // Reset to arrow icon when not navigating
            if (${userLocation ? 'true' : 'false'}) {
              userMarker.setIcon(createUserArrowIcon(null));
            }
          }
          
          isNavigating = false;
        }

        function stopNavigationFromMap() {
          window.ReactNativeWebView.postMessage('stop_navigation');
        }

        // Fit map to show all markers if we have locations
        ${(safeLocations.length > 0 || familyMembers.filter(m => m.location).length > 0) && userLocation ? `
        var allMarkers = [userMarker];
        ${safeLocations.map((_, index) => `allMarkers.push(marker${index});`).join('')}
        ${familyMembers.filter(m => m.location).map((_, index) => `allMarkers.push(familyMarker${index});`).join('')}
        var group = new L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
        ` : ''}

        // Handle resize
        window.addEventListener('resize', function() {
          map.invalidateSize();
        });

        // Post message when map is ready
        map.whenReady(function() {
          window.ReactNativeWebView.postMessage('map:ready');
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    const message = event.nativeEvent.data;
    
    if (message.startsWith('navigate:')) {
      const locationId = message.replace('navigate:', '');
      const location = safeLocations.find(loc => loc.id === locationId);
      if (location && onStartNavigation) {
        onStartNavigation(location);
      }
    } else if (message === 'stop_navigation') {
      // Handle stop navigation - this would be handled by parent component
      console.log('Stop navigation requested');
    } else if (message.startsWith('call:')) {
      const phoneNumber = message.replace('call:', '');
      console.log('Call:', phoneNumber);
    } else if (message.startsWith('call_family:')) {
      const phoneNumber = message.replace('call_family:', '');
      console.log('Call family member:', phoneNumber);
      // You can implement actual calling functionality here
    } else if (message.startsWith('send_sos:')) {
      const memberId = message.replace('send_sos:', '');
      console.log('Send SOS to family member:', memberId);
      // You can implement SOS functionality here
    } else if (message.startsWith('show_details:')) {
      const locationId = message.replace('show_details:', '');
      const location = safeLocations.find(loc => loc.id === locationId);
      if (location && onLocationPress) {
        onLocationPress(location);
      }
    }
  };

  const handleError = () => {
    console.log('WebView error, falling back to simple map');
    setHasError(true);
  };

  // If there's an error or no internet, show fallback
  if (hasError) {
    return (
      <View style={{ height, width }}>
        <MapFallback
          userLocation={userLocation}
          safeLocations={safeLocations}
          familyMembers={familyMembers}
          onLocationPress={onLocationPress}
        />
      </View>
    );
  }

  return (
    <View style={{ height, width }}>
      <WebView
        ref={setWebViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        onError={handleError}
        onHttpError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        style={{ flex: 1 }}
      />
    </View>
  );
}