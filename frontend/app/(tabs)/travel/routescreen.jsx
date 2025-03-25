import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Polygon as SvgPolygon, Circle, Text as SvgText } from 'react-native-svg';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Farm health analysis constants
const HEALTH_STATES = {
  HEALTHY: { color: '#2ecc71', label: 'Healthy', icon: 'leaf' },
  INSECTS: { color: '#e74c3c', label: 'Insect Infestation', icon: 'bug' },
  WATER_NEEDED: { color: '#3498db', label: 'Water Needed', icon: 'water' },
  NUTRIENT_DEFICIENT: { color: '#f39c12', label: 'Nutrient Deficient', icon: 'nutrition' },
  WEED_CONTROL: { color: '#9b59b6', label: 'Weed Control Needed', icon: 'sprout' },
  DISEASE: { color: '#c0392b', label: 'Disease Detected', icon: 'biohazard' },
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RouteScreen = () => {
  const params = useLocalSearchParams();
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(null);
  const [svgViewBox, setSvgViewBox] = useState('0 0 1000 1000');
  const [svgPoints, setSvgPoints] = useState([]);
  const [voronoiCells, setVoronoiCells] = useState({});
  const svgRef = useRef(null);
  const initializationRef = useRef(false);

  // Convert geo coordinates to SVG coordinates
  const convertToSvgCoords = useCallback((points) => {
    // Calculate bounding box
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding
    const padding = 0.1; // 10% padding
    const latRange = (maxLat - minLat) * (1 + padding);
    const lngRange = (maxLng - minLng) * (1 + padding);

    const padMinLat = minLat - (latRange * padding / 2);
    const padMinLng = minLng - (lngRange * padding / 2);

    // Calculate aspect ratio to maintain proportions
    const aspectRatio = lngRange / latRange;
    const svgWidth = 1000;
    const svgHeight = svgWidth / aspectRatio;

    // Update the SVG viewBox
    setSvgViewBox(`0 0 ${svgWidth} ${svgHeight}`);

    // Convert coordinates
    return points.map(point => {
      const x = ((point.longitude - padMinLng) / lngRange) * svgWidth;
      // Flip Y coordinates because SVG Y increases downward
      const y = svgHeight - ((point.latitude - padMinLat) / latRange) * svgHeight;
      return { x, y };
    });
  }, []);

  // Calculate centroid of a polygon
  const calculateCentroid = useCallback((points) => {
    let sumX = 0;
    let sumY = 0;
    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  }, []);

  // Check if a point is inside a polygon (ray casting algorithm)
  const isPointInPolygon = useCallback((point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }
    return inside;
  }, []);

  // Helper: Line intersection calculation
  const lineIntersection = useCallback((x1, y1, x2, y2, x3, y3, x4, y4) => {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }, []);

  // Helper: 2D distance
  const distance2D = useCallback((x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }, []);

  useEffect(() => {
    // Prevent duplicate initialization
    if (initializationRef.current) return;

    let points;
    if (params.polygonData) {
      try {
        points = JSON.parse(params.polygonData);
      } catch (error) {
        console.error("Error parsing polygon data:", error);
        setLoading(false);
        return;
      }
    } else {
      // For development/testing - use sample data if no params provided
      points = [
        { "latitude": 19.18568815598173, "longitude": 72.96239107847214 },
        { "latitude": 19.185819250844453, "longitude": 72.96389110386372 },
        { "latitude": 19.183209050149493, "longitude": 72.96419218182564 },
        { "latitude": 19.182968389018917, "longitude": 72.96224322170019 }
      ];
    }

    setPolygonPoints(points);
    initializationRef.current = true;

    // Convert to SVG coordinates
    const convertedPoints = convertToSvgCoords(points);
    setSvgPoints(convertedPoints);

    // Calculate polygon centroid
    const centroid = calculateCentroid(convertedPoints);

    // Number of sectors to generate (IOT devices)
    const numSectors = 8;

    // Calculate sector points evenly distributed within the polygon
    const sectorPoints = [];

    // Use an offset centroid as the first point
    sectorPoints.push({
      x: centroid.x * 0.8 + convertedPoints[0].x * 0.2,
      y: centroid.y * 0.8 + convertedPoints[0].y * 0.2
    });

    // Generate additional points along rays from centroid
    const angleStep = (2 * Math.PI) / (numSectors - 1);
    for (let i = 1; i < numSectors; i++) {
      const angle = i * angleStep;
      const distance = Math.random() * 0.4 + 0.3; // 30-70% distance from centroid to edge

      // Start with a point along the ray
      let point = {
        x: centroid.x + Math.cos(angle) * 1000, // large enough to be outside
        y: centroid.y + Math.sin(angle) * 1000
      };

      // Intersect with polygon edges to find boundary
      let edgePoint = null;
      let minDist = Infinity;

      // Check intersection with each edge
      for (let j = 0; j < convertedPoints.length; j++) {
        const nextIdx = (j + 1) % convertedPoints.length;
        const edgeStart = convertedPoints[j];
        const edgeEnd = convertedPoints[nextIdx];

        // Simple line-line intersection
        const intersection = lineIntersection(
          centroid.x, centroid.y, point.x, point.y,
          edgeStart.x, edgeStart.y, edgeEnd.x, edgeEnd.y
        );

        if (intersection) {
          const dist = distance2D(centroid.x, centroid.y, intersection.x, intersection.y);
          if (dist < minDist) {
            minDist = dist;
            edgePoint = intersection;
          }
        }
      }

      if (edgePoint) {
        // Place point between centroid and edge
        sectorPoints.push({
          x: centroid.x + (edgePoint.x - centroid.x) * distance,
          y: centroid.y + (edgePoint.y - centroid.y) * distance
        });
      }
    }

    // Generate random "health" status for each sector
    const healthStates = Object.keys(HEALTH_STATES);

    // Create the sectors with random health states
    const newSectors = sectorPoints.map((point, index) => {
      // Randomly assign health status, with higher probability for healthy
      const randomStatus = Math.random();
      let healthStatus;

      if (randomStatus < 0.3) {
        healthStatus = 'HEALTHY';
      } else if (randomStatus < 0.45) {
        healthStatus = 'WATER_NEEDED';
      } else if (randomStatus < 0.6) {
        healthStatus = 'NUTRIENT_DEFICIENT';
      } else if (randomStatus < 0.75) {
        healthStatus = 'WEED_CONTROL';
      } else if (randomStatus < 0.9) {
        healthStatus = 'INSECTS';
      } else {
        healthStatus = 'DISEASE';
      }

      return {
        id: `sector-${index}`,
        centroid: point,
        health: healthStatus,
        data: {
          moisture: Math.floor(Math.random() * 100),
          temperature: Math.floor(Math.random() * 15) + 20,
          nutrientLevel: Math.floor(Math.random() * 100),
          lastUpdated: new Date().toISOString()
        }
      };
    });

    setSectors(newSectors);

    // Create a grid of points across the SVG area to form Voronoi cells
    const cellSize = 10; // Resolution of the grid
    const viewBoxParts = svgViewBox.split(' ').map(Number);
    const svgWidth = viewBoxParts[2];
    const svgHeight = viewBoxParts[3];

    // Map each point to nearest sector center
    const cells = {};
    newSectors.forEach(sector => {
      cells[sector.id] = {
        sector: sector,
        points: []
      };
    });

    // For each point in grid, find closest sector center
    for (let x = 0; x < svgWidth; x += cellSize) {
      for (let y = 0; y < svgHeight; y += cellSize) {
        const point = { x, y };

        // Skip if outside main polygon
        if (!isPointInPolygon(point, convertedPoints)) continue;

        // Find closest sector
        let closestSector = null;
        let minDist = Infinity;

        newSectors.forEach(sector => {
          const dist = distance2D(point.x, point.y, sector.centroid.x, sector.centroid.y);
          if (dist < minDist) {
            minDist = dist;
            closestSector = sector;
          }
        });

        if (closestSector) {
          cells[closestSector.id].points.push(point);
        }
      }
    }

    setVoronoiCells(cells);
    setLoading(false);
  }, [convertToSvgCoords, calculateCentroid, lineIntersection, distance2D, isPointInPolygon, params.polygonData, svgViewBox]);

  // Handle sector selection
  const handleSectorPress = useCallback((sector) => {
    setSelectedSector(sector);
  }, []);

  // Generate SVG elements for the farm visualization
  const renderFarmVisualization = useCallback(() => {
    if (!svgPoints.length || !sectors.length || Object.keys(voronoiCells).length === 0) {
      return null;
    }

    const polygonPointsString = svgPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <>
        {/* Render main farm boundary */}
        <SvgPolygon
          points={polygonPointsString}
          fill="transparent"
          stroke="white"
          strokeWidth="5"
        />

        {/* Render cells (mini rectangles for each grid point, grouped by sector) */}
        {Object.values(voronoiCells).map((cell) => (
          <React.Fragment key={cell.sector.id}>
            {cell.points.map((point, i) => (
              <SvgPolygon
                key={`${cell.sector.id}-point-${i}`}
                points={`${point.x},${point.y} ${point.x + 10},${point.y} ${point.x + 10},${point.y + 10} ${point.x},${point.y + 10}`}
                fill={HEALTH_STATES[cell.sector.health].color}
                fillOpacity="0.8"
                stroke="none"
              />
            ))}
          </React.Fragment>
        ))}

        {/* Render sector centers with numbers */}
        {sectors.map((sector, index) => (
          <Circle
            key={sector.id}
            cx={sector.centroid.x}
            cy={sector.centroid.y}
            r="15"
            fill="white"
            stroke="black"
            strokeWidth="2"
          />
        ))}

        {/* Render sector numbers */}
        {sectors.map((sector, index) => (
          <SvgText
            key={`${sector.id}-text`}
            x={sector.centroid.x}
            y={sector.centroid.y + 5}
            fontSize="18"
            fontWeight="bold"
            fill="black"
            textAnchor="middle"
          >
            {index + 1}
          </SvgText>
        ))}
      </>
    );
  }, [sectors, svgPoints, voronoiCells]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#607D8B" />
          <Text style={styles.loadingText}>Processing farm sectors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#455A64', '#607D8B']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Farm Sector Analysis</Text>
            {/* <Text style={styles.headerSubtitle}>
              {sectors.length} IoT devices monitoring your farm
            </Text> */}
          </LinearGradient>
        </View>

        {/* SVG Heatmap */}
        <View style={styles.mapContainer}>
          <Svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={svgViewBox}
            style={styles.svg}
          >
            {renderFarmVisualization()}
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Treatment Indicators</Text>
          <View style={styles.legendItems}>
            {Object.entries(HEALTH_STATES).map(([key, value]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: value.color }]} />
                <Text style={styles.legendText}>{value.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sector Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>
            Farm Health Overview
          </Text>

          {/* Sector Stats */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
            {sectors.map((sector, index) => (
              <TouchableOpacity
                key={sector.id}
                style={[
                  styles.statCard,
                  selectedSector?.id === sector.id && styles.selectedStatCard,
                  { borderLeftColor: HEALTH_STATES[sector.health].color }
                ]}
                onPress={() => handleSectorPress(sector)}
              >
                <View style={styles.statHeader}>
                  <View style={styles.statNumber}>
                    <Text style={styles.statNumberText}>{index + 1}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={HEALTH_STATES[sector.health].icon}
                    size={24}
                    color={HEALTH_STATES[sector.health].color}
                  />
                </View>
                <Text style={styles.statTitle}>{HEALTH_STATES[sector.health].label}</Text>
                <View style={styles.statDetails}>
                  <Text style={styles.statDetailText}>
                    Moisture: {sector.data.moisture}%
                  </Text>
                  <Text style={styles.statDetailText}>
                    Temp: {sector.data.temperature}°C
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: 25,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#607D8B',
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: '#1a1a2e', // Dark background for better visualization
    overflow: 'hidden',
    borderRadius: 20,
    margin: 12,
  },
  svg: {
    borderRadius: 20,
  },
  legendContainer: {
    margin: 12,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  detailsContainer: {
    padding: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
  },
  selectedStatCard: {
    backgroundColor: '#f0f9ff',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumberText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  statTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
  },
  statDetails: {
    marginTop: 4,
  },
  statDetailText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
});

export default RouteScreen;