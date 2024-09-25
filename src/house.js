import * as THREE from 'three';
import { mapHeight } from './scene.js';
import { objectsToIntersect } from './tools.js';

// Function to create and render a single house
export function createAndRenderHouse(scene, {
    wallColour = 0xffffff,
    roofColour = 0x202020,
    doorColour = 0xff0000,
    windowColour = 0x537d90,
    doorStyle = 'fancy',
    windowStyle = 'rectangular',
    position = { x: 0, y: 0, z: 0 },
    scale = 8
} = {}) {
    // Define materials
    const materials = {
        wall: new THREE.MeshStandardMaterial({ color: wallColour, side: THREE.DoubleSide }),
        roof: new THREE.MeshStandardMaterial({ color: roofColour, side: THREE.DoubleSide }),
        door: new THREE.MeshStandardMaterial({ color: doorColour }),
        window: new THREE.MeshStandardMaterial({ color: windowColour })
    };

    // Create house components
    const components = createHouseComponents(materials, doorStyle, windowStyle);

    // Create a house group
    const house = new THREE.Group();
    const heightOffset = (mapHeight / 2) + scale;
    house.name = "house";
    house.userData.type = "house";
    house.position.set(position.x, heightOffset, position.z);
    house.scale.set(scale, scale, scale); // Set scale

    // Add components to the house group
    house.add(components.base);
    house.add(components.gable1);
    house.add(components.gable2);
    house.add(components.roof1);
    house.add(components.roof2);
    house.add(components.door);
    components.windows.forEach(window => house.add(window));

    // Add the house to the scene
    scene.add(house);
    objectsToIntersect.push(house);
    console.log("house", house);
}

// Function to create house components
function createHouseComponents(materials, doorStyle, windowStyle) {
    const components = {};

    // House Base (Walls)
    components.base = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 4), materials.wall);
    components.base.castShadow = true;
    components.base.receiveShadow = true;
    components.base.name = 'walls';
    components.base.userData.type = 'walls';

    // Gables
    components.gable1 = createHouseTriangle(materials, { x: -0.5, y: 1, z: 2 });
    components.gable2 = createHouseTriangle(materials, { x: -0.5, y: 1, z: -2 });

    // Roof
    components.roof1 = createRoof(materials, { x: -1, y: 1.51, z: 0 }, Math.PI * 0.5, Math.PI * 0.25);
    components.roof2 = createRoof(materials, { x: 1, y: 1.51, z: 0 }, Math.PI * 0.5, Math.PI * -0.25);

    // Door
    components.door = createDoor(materials, doorStyle);

    // Windows
    components.windows = createWindows(materials, windowStyle);

    return components;
}

// Helper functions for creating components
function createHouseTriangle(materials, position) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([-1, 0, 0, 0.5, 1.5, 0, 2, 0, 0]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    const gable = new THREE.Mesh(geometry, materials.wall);
    gable.castShadow = true;
    gable.receiveShadow = true;
    gable.position.set(position.x, position.y, position.z);
    gable.userData.type = 'gable';
    gable.name = 'gable';

    return gable;
}

function createRoof(materials, position, rotationX, rotationY) {
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(2.84, 4.5), materials.roof);
    roof.position.set(position.x, position.y, position.z);
    roof.rotation.set(rotationX, rotationY, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.name = 'roof';
    roof.userData.type = 'roof';

    return roof;
}

function createDoor(materials, doorStyle) {
    let door;
    if (doorStyle === 'fancy') {
        door = new THREE.Group();
        const doorBase = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.2), materials.door);
        doorBase.position.set(0, -0.2, 0);
        const doorCurve = new THREE.Mesh(new THREE.CircleGeometry(0.5), materials.door);
        doorCurve.position.set(0, 0.4, 0);
        door.add(doorBase);
        door.add(doorCurve);
    } else {
        door = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.6), materials.door);
    }
    door.position.set(0.5, -0.2, 2.1);
    door.name = "door";
    door.userData.type = 'door';
    return door;
}

function createWindows(materials, windowStyle) {
    const windows = [];
    if (windowStyle === 'rectangular') {
        windows.push(createRectangularWindow(materials, { x: -0.75, y: 0.1, z: 2.1 }));
        windows.push(createRectangularWindow(materials, { x: -1.6, y: 0.1, z: -1.1 }, Math.PI * 1.5));
        windows.push(createRectangularWindow(materials, { x: -1.6, y: 0.1, z: 1.1 }, Math.PI * 1.5));
    } else {
        const circleWindow = new THREE.Mesh(new THREE.CircleGeometry(0.5), materials.window);
        circleWindow.position.set(-0.75, 0.5, 2.1);
        circleWindow.name = 'circleWindow';
        circleWindow.userData.type = 'circleWindow';
        windows.push(circleWindow);
    }
    return windows;
}

function createRectangularWindow(materials, position, rotationY = 0) {
    const window = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materials.window);
    window.position.set(position.x, position.y, position.z);
    window.rotation.set(0, rotationY, 0);
    window.castShadow = true;
    window.receiveShadow = true;
    window.name = 'window';
    window.userData.type = 'window';
    return window;
}
