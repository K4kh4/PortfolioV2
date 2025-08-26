import * as THREE from 'three';

// =============================================================================
// RAYCASTING SYSTEM FOR 3D OBJECT INTERACTIONS
// =============================================================================

// Raycasting object collections
export const raycastObjects = [];                       // Original raycaster objects from 3D model
export const hitboxObjects = [];                        // Static hitboxes for reliable clicking  
export const hitboxToObjectMap = new Map();            // Maps hitbox to original animated object
export let currentIntersect = [];                       // Current raycast intersections
export let currentHoverObject;                          // Currently hovered object

// Three.js raycaster setup
export const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();

/**
 * Function to create static hitbox for an object
 * @param {THREE.Object3D} originalObject - The original 3D object to create hitbox for
 * @param {THREE.Scene} scene - The scene to add hitbox to
 * @returns {THREE.Mesh} - The created hitbox mesh
 */
export function createStaticHitbox(originalObject, scene) {
  // Get the bounding box of the original object
  const box = new THREE.Box3().setFromObject(originalObject);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  // Create a simple box geometry that matches the original object's bounds
  const hitboxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  
  // Create an invisible material for the hitbox
  const hitboxMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    visible: false // Completely invisible but still raycastable
  });
  
  // Create the hitbox mesh
  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  
  // Position the hitbox at the object's center
  hitbox.position.copy(center);
  
  // Copy the original object's name but add "Hitbox" identifier
  hitbox.name = originalObject.name + "_Hitbox";
  
  // Store reference to original object
  hitbox.userData.originalObject = originalObject;
  
  // If this is a Raycaster object, try to find corresponding Hover object

  if (originalObject.name.includes("Raycaster")) {
    const baseName = originalObject.name;//.replace("_Raycaster_Pointer", "").replace("_Raycaster", "");
    scene.traverse((child) => {
      if (child.name.includes(baseName) && child.name.includes("Hover")) {
        hitbox.userData.hoverObject = child;
        console.log(`Found hover object for ${originalObject.name}: ${child.name}`);
      }
    });
  }
  
  // Add to hitbox arrays
  hitboxObjects.push(hitbox);
  hitboxToObjectMap.set(hitbox, originalObject);
  
  // Add to scene
  scene.add(hitbox);
  
  console.log(`Created static hitbox for: ${originalObject.name}`);
  return hitbox;
}

/**
 * Function to create hitboxes for all hoverable/interactive objects
 * @param {THREE.Scene} scene - The scene to traverse and add hitboxes to
 */
export function createAllHitboxes(scene) {
  // Find all objects that need hitboxes (only Raycaster objects, which will find their Hover pairs)
  scene.traverse((child) => {
    if (child.isMesh && child.name.includes("Raycaster")) {
      createStaticHitbox(child, scene);
    }
  });
  
  console.log(`Created ${hitboxObjects.length} static hitboxes`);
}

/**
 * Update mouse/pointer position for raycasting
 * @param {MouseEvent} event - The mouse move event
 */
export function updatePointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * Perform raycasting and return intersections
 * @param {THREE.Camera} camera - The camera to raycast from
 * @returns {Array} - Array of intersections
 */
export function performRaycast(camera) {
  raycaster.setFromCamera(pointer, camera);
  currentIntersect = raycaster.intersectObjects(hitboxObjects);
  return currentIntersect;
}

/**
 * Handle hover effects for intersected objects
 * @param {Array} intersections - Array of raycaster intersections
 * @param {Function} onHoverCallback - Callback function for hover effects
 * @returns {Object} - Object containing hoverTarget and originalObject
 */
export function handleHoverEffects(intersections, onHoverCallback) {
  if (intersections.length > 0) {
    // Get the hitbox that was intersected
    const hitboxObject = intersections[0].object;
    
    // Get the original object from the hitbox
    const originalObject = hitboxObject.userData.originalObject;
    
   
    
    // Check if this object should have hover effects
    const hoverTarget = hitboxObject.userData.hoverObject || originalObject;
    if(hoverTarget.name.includes("Hover3")) return { hoverTarget, originalObject, hitboxObject };
    if (hoverTarget && hoverTarget.name.includes("Hover")) {
     
      if (hoverTarget !== currentHoverObject) {
        if (currentHoverObject) {
          onHoverCallback(currentHoverObject, false);
        }
        onHoverCallback(hoverTarget, true);
        currentHoverObject = hoverTarget;
        
      }
    }

    return { hoverTarget, originalObject, hitboxObject };
  } else {
    // No intersections - reset hover
    if (currentHoverObject != null) {
      onHoverCallback(currentHoverObject, false);
      currentHoverObject = null;
    }
    return { hoverTarget: null, originalObject: null, hitboxObject: null };
  }
}

/**
 * Handle cursor changes based on intersected objects
 * @param {Object} intersectionData - Object containing hoverTarget and originalObject
 */
export function handleCursorChanges(intersectionData) {
  const { hoverTarget, originalObject, hitboxObject } = intersectionData;
  
  if (intersectionData.hoverTarget === null) {
    document.body.style.cursor = "default";
    return;
  }
  
  // Check if cursor should be pointer (for any interactive object)
  if (originalObject && originalObject.name.includes("Pointer") && originalObject.scale.x > 0.00001) {
    document.body.style.cursor = "pointer";
  } else {
    // Only reset hover if we're not over a hoverable object
    if (currentHoverObject != null && (!hoverTarget || !hoverTarget.name.includes("Hover"))) {
      // Note: hover reset is handled in handleHoverEffects
    }
    document.body.style.cursor = "default";
  }
}

/**
 * Handle click events on intersected objects
 * @param {Array} intersections - Array of raycaster intersections
 * @param {Array} interactiveObjects - Array of interactive objects to check against
 * @param {Function} handleObjectClickCallback - Callback function for object clicks
 */
export function handleClickEvents(intersections, interactiveObjects, handleObjectClickCallback) {
  console.log('🎯 === RAYCAST CLICK ANALYSIS ===');
  console.log(`🎯 Intersections found: ${intersections.length}`);
  
  if (intersections.length > 0) {
    // Get the hitbox that was clicked
    const hitboxObject = intersections[0].object;
    console.log(`🎯 Closest hitbox: ${hitboxObject.name}`);
    if (hitboxObject.userData.originalObject.scale.x < 0.00001) {
      return;
    }
    
    // Get the original object from the hitbox
    const originalObject = hitboxObject.userData.originalObject;
    console.log(`🎯 Original object: ${originalObject ? originalObject.name : 'none'}`);
    
    if (originalObject && originalObject.name.includes("Pointer")) {
      console.log('🎯 Object is a Pointer - checking interactive objects');
      
      // Check if the clicked object matches any interactive object
      const clickedInteractiveObject = interactiveObjects.find(interactiveObj => {
        const matches = originalObject.name.includes(interactiveObj.name);
        console.log(`🎯 Checking ${interactiveObj.name} against ${originalObject.name}: ${matches}`);
        return matches;
      });

      if (clickedInteractiveObject) {
        console.log(`🎯 Found matching interactive object: ${clickedInteractiveObject.name}`);
        handleObjectClickCallback(clickedInteractiveObject);
      } else {
        console.warn(`⚠️ No matching interactive object found for: ${originalObject.name}`);
        console.log('🎯 Available interactive objects:', interactiveObjects.map(obj => obj.name));
      }
    } else {
      console.log('🎯 Object is not a Pointer or no original object found');
    }
  } else {
    console.log('🎯 No intersections found - click missed all objects');
  }
  console.log('🎯 === END RAYCAST CLICK ANALYSIS ===');
}

/**
 * Reset all raycasting state
 */
export function resetRaycastState() {
  currentIntersect = [];
  currentHoverObject = null;
  document.body.style.cursor = "default";
}

/**
 * Get current hover object
 * @returns {THREE.Object3D|null} - Currently hovered object
 */
export function getCurrentHoverObject() {
  return currentHoverObject;
}

/**
 * Set current hover object (used for manual state management)
 * @param {THREE.Object3D|null} object - Object to set as current hover
 */
export function setCurrentHoverObject(object) {
  currentHoverObject = object;
}
