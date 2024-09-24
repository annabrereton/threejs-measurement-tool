// Utility functions and helper methods.

import { mapDiameter, mapRadius } from './scene.js';

const latBottomLeft = 0;
const lonBottomLeft = 0;
const latTopRight = 1;
const lonTopRight = 1;

// Function to convert integer scale to decimal scale
function convertIntegerToScale(integer) {
    const mapping = {
        1: 0.2,
        2: 0.4,
        3: 0.5,
        4: 0.6,
        5: 0.7,
        6: 0.8,
        7: 0.9,
        8: 1.0
    };

    return mapping[integer] || 0.9; // Default scale if not found
}

// Convert latitude and longitude to map coordinates
function latLonToMapCoords(lat, lon) {
    const normalizedLat = (lat - latBottomLeft) / (latTopRight - latBottomLeft);
    const normalizedLon = (lon - lonBottomLeft) / (lonTopRight - lonBottomLeft);
    const x = normalizedLon * mapDiameter - mapRadius;
    const y = normalizedLat * mapDiameter - mapRadius;
    return { x, y };
}

// Convert map coordinates to latitude and longitude
function mapCoordsToLatLon(x, y) {
    const normalizedLon = (x + mapRadius) / mapDiameter;
    const normalizedLat = (y + mapRadius) / mapDiameter;

    const lon = normalizedLon * (lonTopRight - lonBottomLeft) + lonBottomLeft;
    const lat = normalizedLat * (latTopRight - latBottomLeft) + latBottomLeft;

    return { lat, lon };
}


export { convertIntegerToScale, mapCoordsToLatLon, latLonToMapCoords };
