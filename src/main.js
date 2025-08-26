import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './style.scss'

import gsap from 'gsap';

// Import raycasting functionality
import {
  raycastObjects,
  createAllHitboxes,
  updatePointer,
  performRaycast,
  handleHoverEffects,
  handleCursorChanges,
  handleClickEvents,
  resetRaycastState,
  getCurrentHoverObject,
  setCurrentHoverObject
} from './raycast.js';

// Import modal functionality
import {
  isModalOpen,
  setModalOpen,
  openModal,
  closeModal,
  showModal,
  hideModal,
  navigateWork,
  initializeModals,
  showEnterModal,
  closeEnterModal,
  hideLoadingModal,
  initializeHomeButton,
  showHomeButton,
  hideHomeButton,
  initializeDarkModeButton,
  showDarkModeButton,
  hideDarkModeButton,
  toggleDarkMode,
  showUIControls,
  hideUIControls
} from './modal.js';

// =============================================================================
// GLOBAL VARIABLES
// =============================================================================

// Reference to the 3D notebook object that opens to show work buttons
let notebookObject;

/**
 * Interactive objects configuration - maps 3D objects to their corresponding actions and modals
 * Each object has:
 * - name: 3D object name to match against
 * - object: Will be populated with actual 3D object reference when model loads
 * - modal: CSS class of modal to open (if applicable)
 * - action: What happens when clicked (openNotebook, zoomToAboutMe, zoomToBoard, showModal)
 */
const buttonObjects = [
  {
    name: "MyWork_Button",
    object: null, // Will be set when loading the model
    modal: "",
    action: "openNotebook" // Special action for this button
  },
  {
    name: "Fourth_notebook_MyWork_Top_Raycaster_Pointer",
    object: null, // Will be set when loading the model
    modal: "",
    action: "openNotebook" // Special action for this button
  },
  {
    name: "MyWork_Sign",
    object: null, // Will be set when loading the model
    modal: "",
    action: "openNotebook" // Special action for this button
  },
  {
    name: "Fifth_Seat_Top_Raycaster_Pointer",
    object: null, // Will be set when loading the model
    modal: "",
    action: "rotateSeat" // Special action for this button
  },
  {
    name: "AboutMe_Button",
    object: null,
    modal: "about",
    action: "zoomToAboutMe"
  },
  {
    name: "AboutMe_Sign",
    object: null,
    modal: "about",
    action: "zoomToAboutMe"
  },
  {
    name: "Other_Button",
    object: null,
    modal: "gallery",
    action: "showModal"
  },
  {
    name: "Other_Sign",
    object: null,
    modal: "gallery",
    action: "showModal"
  },
  {
    name: "WorkButton_1",
    object: null,
    modal: "work1",
    action: "showModal"
  },
  {
    name: "WorkButton_2",
    object: null,
    modal: "work5",
    action: "showModal"
  },
  {
    name: "WorkButton_3",
    object: null,
    modal: "work3",
    action: "showModal"
  },
  {
    name: "WorkButton_4",
    object: null,
    modal: "work4",
    action: "showModal"
  },
  {
    name: "WorkButton_5",
    object: null,
    modal: "work2",
    action: "showModal"
  },
  {
    name: "AbouButton",
    object: null,
    modal: "about",
    action: "showModal"
  },
  {
    name: "ResumeButton",
    object: null,
    modal: "",
    action: "zoomToResume"
  }
];

// =============================================================================
// INITIALIZATION AND STARTUP
// =============================================================================

// Modal system initialization and global exports
document.addEventListener('DOMContentLoaded', () => {
  // Initialize modal system
  initializeModals();

  // Initialize home button with camera reset functionality
  initializeHomeButton(resetCameraPosition);

  // Initialize dark mode button
  initializeDarkModeButton();

  // Start loading messages
  startLoadingMessages();
});

// Make essential functions globally available for console debugging
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateWork = navigateWork;
window.showEnterModal = showEnterModal;
window.closeEnterModal = closeEnterModal;
window.hideLoadingModal = hideLoadingModal;
window.showHomeButton = showHomeButton;
window.hideHomeButton = hideHomeButton;
window.showDarkModeButton = showDarkModeButton;
window.hideDarkModeButton = hideDarkModeButton;
window.toggleDarkMode = toggleDarkMode;
window.hideUIControls = hideUIControls;

// Debug function to check modal state


// Global function to manually reset notebook and camera to original position
window.resetNotebookView = () => {
  console.log('🏠 Resetting notebook and camera to original position');
  if (notebookObject) {
    CloseNoteBook();
  }
};

// =============================================================================
// THREE.JS SETUP AND CONFIGURATION
// =============================================================================

// Canvas and scene setup
const canvas = document.querySelector('#experience-canvas')
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Create Three.js scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);

// Initialize loaders
const textureLoader = new THREE.TextureLoader();


// Texture configuration - maps room sections to their texture files
const textureMap = {
  First: {
    day: "/textures/First_Texture_Set_Day_Denoised_Compressed.webp"
  },
  Second: {
    day: "/textures/Second_Texture_Set_Day_Denoised_Compressed.webp"
  },
  Third: {
    day: "/textures/Third_Texture_Set_Day_Denoised_Compressed.webp"
  },
  Fourth: {
    day: "/textures/Forth_Texture_Set_Day_Denoised_Compressed.webp"
  },
  Fifth: {
    day: "/textures/Fifth_Texture_Set_Day_Denoised_Compressed.webp"
  },
  books:{
    day: "/textures/Books.001.png"
  }
};

// Storage for loaded textures - populated during async loading
const loadedTexture = {
  First: { day: {} },
  Second: { day: {} },
  Third: { day: {} },
  Fourth: { day: {} },
  Fifth: { day: {} },
  books: { day: {} }
};

// =============================================================================
// LOADING SYSTEM
// =============================================================================

// Asset loading state tracking
let texturesLoaded = 0;
let modelLoaded = false;
let objectsAssigned = false;
const totalTextures = Object.keys(textureMap).length;

// Loading screen messages that cycle while assets load
const loadingMessages = [
  "Who's there?",
  "Just a sec!",
  "Be right there.",
  "Be right there..",
  "Be right there..."
];
let currentMessageIndex = 0;
let messageInterval;

/**
 * Start the loading message cycle
 */
function startLoadingMessages() {
  const loadingText = document.getElementById('loading-text');
  if (!loadingText) return;

  // Show first message
  loadingText.textContent = loadingMessages[currentMessageIndex];

  // Cycle through messages every 1 seconds
  messageInterval = setInterval(() => {
    currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[currentMessageIndex];

    // Restart animation
    loadingText.style.animation = 'none';
    loadingText.offsetHeight; // Trigger reflow
    loadingText.style.animation = 'fadeInOut 1.5s ease-in-out';
  }, 760);
}





/**
 * Called when all assets are loaded
 */
function onLoadComplete() {
  console.log('🎉 All assets loaded and objects ready!');

  // Hide loading modal and show enter modal
  hideLoadingModal(messageInterval);

  // Show enter modal after loading modal fade out



  // Initialize notebook state
  if (notebookObject) {
    CloseNoteBook(notebookObject);
  }

  // Ready for interaction
  console.log('✅ Portfolio ready for interaction!');
  showEnterModal();

}

/**
 * Check if all objects are properly assigned
 */
function checkObjectsAssigned() {
  // Check if notebook object is assigned
  if (!notebookObject) return false;

  // Check if all interactive objects have their 3D objects
  const allObjectsAssigned = buttonObjects.every(obj => {
    // If it's a work button, it must have an object assigned
    if (obj.name.includes("WorkButton_")) {
      return obj.object !== null;
    }
    return true; // Non-work buttons don't need to be checked
  });

  return allObjectsAssigned;
}

/**
 * Check if everything is loaded and ready
 */
function checkIfComplete() {
  // Check if assets are loaded
  const assetsLoaded = texturesLoaded === totalTextures && modelLoaded;

  // Check if objects are assigned
  if (!objectsAssigned) {
    objectsAssigned = checkObjectsAssigned();
  }

  // Only complete when both assets are loaded AND objects are assigned
  if (assetsLoaded && objectsAssigned) {
    console.log('✨ All assets loaded and objects assigned!');
    onLoadComplete();
  }
}

Object.entries(textureMap).forEach(([key, value]) => {
  const dayTexture = textureLoader.load(
    value.day,
    () => {
      texturesLoaded++;
      console.log(`Texture loaded: ${key} (${texturesLoaded}/${totalTextures})`);
      checkIfComplete();
    }
  );
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTexture[key].day = dayTexture;
});

// =============================================================================
// MODEL LOADING AND SCENE SETUP
// =============================================================================

// Configure DRACO compression loader for efficient model loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

// Configure GLTF loader with DRACO support
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
// Load the main 3D model and configure all its components
loader.load("/models/Room_V1-Compresed-v1.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      // Apply appropriate textures to different room sections
      if (child.name.includes("First_")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.First.day
        child.material = material
      }

      if (child.name.includes("Second_Room")) {//change the fucking name
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.Second.day
        child.material = material
      }
      if (child.name.includes("Third")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.Third.day
        child.material = material
      }
      if (child.name.includes("Fourth")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.Fourth.day
        material.transparent = true;
        material.alphaTest = 0.5;
        child.material = material
      }
      if (child.name.includes("Fifth")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.Fifth.day
        child.material = material
      }
      if (child.name.includes("Book")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.books.day
        child.material = material
      }

      if (child.material.map) {
        child.material.map.minFilter = THREE.LinearFilter;
      }
      // setting up layers 


      if (child.name.includes("Raycaster")) {
        raycastObjects.push(child);
      }
      if (child.name.includes("Hover")) {
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.isAnimating = false;
      }
      if (child.name.includes("Fourth_notebook_MyWork_Top_Raycaster_Pointer")) {
        notebookObject = child;
        console.log("notebookObject was added", notebookObject);
      }

      // Check if this object matches any interactive object
      buttonObjects.forEach(interactiveObj => {
        if (child.name.includes(interactiveObj.name)) {
          interactiveObj.object = child;
          console.log(`Found interactive object: ${interactiveObj.name}`);
        }
      });
    }
  })
  scene.add(gltf.scene)
  //add ambient light with light blue tint




  // Log which interactive objects were found
  logInteractiveObjectsStatus();

  // Create static hitboxes for all interactive objects after model loads
  createAllHitboxes(scene);

  // Log interactive objects status
  logInteractiveObjectsStatus();

  // Mark model as loaded and check completion
  modelLoaded = true;
  console.log('🏠 3D Model loaded successfully!');

  // Check completion multiple times to ensure objects are assigned
  const checkInterval = setInterval(() => {
    checkIfComplete();
    if (objectsAssigned) {
      clearInterval(checkInterval);
    }
  }, 100);
})

// =============================================================================
// RENDERER AND CAMERA SETUP
// =============================================================================

// Configure WebGL renderer with antialiasing for smooth visuals
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// =============================================================================
// CAMERA POSITIONS AND CONTROLS
// =============================================================================

// Predefined camera positions for different views
const cameraNotebookPosition = new THREE.Vector3(1.0116149200302174, 6.571313242426443, -0.8049478528131928);
const targetNotebookPosition = new THREE.Vector3(-1.0674379059115109, 4.033968206624388, -0.790316383561921);

const cameraResumePosition = new THREE.Vector3(1.3, 4.8, -0.7);
const targetResumePosition = new THREE.Vector3(1.2, 3.8, -2.1);

const cameraBoardPosition = new THREE.Vector3(-0.3770576922642992, 5.700365453619895, 0.7587538593560265);
const targetBoardPosition = new THREE.Vector3(-1.4046725555142923, 5.587512942935852, 0.7441562290266093);


// Initial camera position - wide view of the entire room
const originalCameraPosition = new THREE.Vector3(12.19, 6.97, 9.10);
const originalTargetPosition = new THREE.Vector3(0.09, 2.78, 0.08);

camera.position.copy(originalCameraPosition);
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableZoom = true
controls.enablePan = true
controls.dampingFactor = 0.5
controls.target.copy(originalTargetPosition);

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle window resize events - updates camera and renderer
 */
function OnResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Handle mouse movement for raycasting
 * @param {MouseEvent} event - Mouse move event
 */
function OnMouseMove(event) {
  updatePointer(event);
}

/**
 * Handle click events on 3D objects
 */
function OnClick() {
  // Prevent scene interactions when modal is open
  if (isModalOpen()) {
    console.log('🚫 Click blocked - modal is open');
    return;
  }

  console.log('🎯 Processing scene click');
  const intersections = performRaycast(camera);
  if (intersections.length > 0) {
    handleClickEvents(intersections, buttonObjects, handleObjectClick);
  }
}

// Handle different types of object clicks
function handleObjectClick(interactiveObject) {
  console.log('🎯 === OBJECT CLICK EVENT ===');
  console.log(`🎯 Clicked on: ${interactiveObject.name}`);
  console.log(`🎯 Modal: ${interactiveObject.modal}`);
  console.log(`🎯 Action: ${interactiveObject.action}`);
  console.log(`🎯 Object data:`, interactiveObject);

  switch (interactiveObject.action) {
    case "openNotebook":
      console.log('🎯 Executing: openNotebook');
      OpenNoteBook(notebookObject);
      break;
    case "zoomToAboutMe":
      console.log('🎯 Executing: zoomToAboutMe');
      zoomCameraToResume();
      break;
    case "zoomToBoard":
      console.log('🎯 Executing: zoomToBoard');
      zoomCameraToBoard();
      break;

    case "showModal":
      console.log('🎯 Executing: showModal');
      if (interactiveObject.modal) {
        // Use direct modal class name instead of cached references
        console.log(`🎯 Attempting to open modal: ${interactiveObject.modal}`);
        const modalElement = document.querySelector(`.modal.${interactiveObject.modal}`);
        console.log(`🎯 Found modal element:`, modalElement);

        if (modalElement) {
          console.log('🎯 Modal element found, calling openModal');
          openModal(interactiveObject.modal);
        } else {
          console.error(`🚫 Modal element not found for: ${interactiveObject.modal}`);
        }
      } else {
        console.error('🚫 No modal specified for interactive object');
      }
      break;
    case "rotateSeat":
      console.log('🎯 Executing: rotateSeat');
      rotateSeat();
      break;
    default:
      console.warn(`⚠️ Unknown action: ${interactiveObject.action}`);
  }
  console.log('🎯 === END OBJECT CLICK EVENT ===');
}




// Helper function to log all interactive objects status
function logInteractiveObjectsStatus() {
  console.log("Interactive Objects Status:");
  buttonObjects.forEach(obj => {
    console.log(`- ${obj.name}: ${obj.object ? 'Loaded' : 'Not Found'} (Modal: ${obj.modal}, Action: ${obj.action})`);
  });
}


// =============================================================================
// EVENT LISTENERS AND MAIN LOOP
// =============================================================================

// Register event listeners
window.addEventListener("mousemove", (e) => { OnMouseMove(e); })
window.addEventListener("resize", OnResize);
window.addEventListener("click", OnClick);

/**
 * Main animation loop - handles rendering and interactions
 */
let isNotebookOpen = false;
const Update = () => {
  // Always continue the animation loop
  window.requestAnimationFrame(Update);

  //check distance between camera and notebook if  its greater than 3  its open  close the notebook and open the resume 

  const distance = controls.target.distanceTo(targetNotebookPosition);
  const distance2 = camera.position.distanceTo(cameraNotebookPosition);
  if (distance > (3) && isNotebookOpen) {
    console.log("closing notebook");
    CloseNoteBook();
  }
  if (distance2 > 5 && isNotebookOpen) {
    CloseNoteBook();
  }

  // Always update camera controls - users should be able to move camera even when modal is open
  controls.update();
  renderer.render(scene, camera);

  // Only perform raycasting and interactions when no modal is open
  if (!isModalOpen()) {
    // Perform raycasting and handle interactions
    const intersections = performRaycast(camera);
    const intersectionData = handleHoverEffects(intersections, OnHover);
    handleCursorChanges(intersectionData);
  } else {
    // Reset cursor when modal is open to prevent hover cursor from sticking
    document.body.style.cursor = "default";
  }
}

// =============================================================================
// CAMERA ANIMATION FUNCTIONS
// =============================================================================

/**
 * Opens the notebook with animation and shows work buttons
 */
function OpenNoteBook() {
  gsap.to(notebookObject.rotation, {
    x: Math.PI,
    y: 0,
    z: 0,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: function () {
      buttonObjects.forEach(interactiveObj => {
        if (interactiveObj.name.includes("WorkButton_")) {
          gsap.killTweensOf(interactiveObj.object.scale);
          interactiveObj.object.scale.set(0, 0, 0);
          interactiveObj.object.show = true;
          gsap.to(interactiveObj.object.scale, {
            x: interactiveObj.object.userData.initialScale.x,
            y: interactiveObj.object.userData.initialScale.y,
            z: interactiveObj.object.userData.initialScale.z,
            duration: 0.1,
            ease: 'power2.inOut',
            onComplete: function () {
              isNotebookOpen = true;
            }
          })
        }
      })
    },
  })
  zoomCameraToNoteBook();
}

/**
 * Closes the notebook and hides work buttons
 */
function CloseNoteBook() {
  isNotebookOpen = false;
  // Only proceed if we have the notebook object
  if (!notebookObject) {
    console.log('Notebook object not yet loaded');
    return;
  }

  // Hide work buttons
  buttonObjects.forEach(interactiveObj => {
    if (interactiveObj.name.includes("WorkButton_")) {
      gsap.killTweensOf(interactiveObj.object.scale);
      interactiveObj.object.scale.set(0, 0, 0);
    }
  });

  // Rotate notebook back
  gsap.to(notebookObject.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.5,
    ease: 'power2.inOut'
  })

  // Reset camera to original position

}

/**
 * Resets camera to the original wide view position
 */
function resetCameraPosition() {
  gsap.to(camera.position, {
    x: originalCameraPosition.x,
    y: originalCameraPosition.y,
    z: originalCameraPosition.z,
    duration: 0.5,
    ease: 'power2.inOut'
  });
  gsap.to(controls.target, {
    x: originalTargetPosition.x,
    y: originalTargetPosition.y,
    z: originalTargetPosition.z,
    duration: 0.5,
    ease: 'power2.inOut'
  });
  CloseNoteBook();
}
/**
 * Animates camera to focus on the notebook
 */
function zoomCameraToNoteBook() {
  gsap.to(camera.position, {
    x: cameraNotebookPosition.x,
    y: cameraNotebookPosition.y,
    z: cameraNotebookPosition.z,
    duration: 0.5,
    ease: 'power2.out'
  })
  gsap.to(controls.target, {
    x: targetNotebookPosition.x,
    y: targetNotebookPosition.y,
    z: targetNotebookPosition.z,
    duration: 0.5,
    ease: 'power2.inOut'
  })
}
function zoomCameraToResume() {
  gsap.to(camera.position, {
    x: cameraResumePosition.x,
    y: cameraResumePosition.y,
    z: cameraResumePosition.z,
    duration: 0.5,
    ease: 'power2.inOut'
  })
  gsap.to(controls.target, {
    x: targetResumePosition.x,
    y: targetResumePosition.y,
    z: targetResumePosition.z,
    duration: 0.5,
    ease: 'power2.inOut'
  })
}
function zoomCameraToBoard() {
  gsap.to(camera.position, {
    x: cameraBoardPosition.x,
    y: cameraBoardPosition.y,
    z: cameraBoardPosition.z,
    duration: 0.5,
    ease: 'power2.inOut'
  })
  gsap.to(controls.target, {
    x: targetBoardPosition.x,
    y: targetBoardPosition.y,
    z: targetBoardPosition.z,
    duration: 0.5,
    ease: 'power2.inOut'
  })
}
function OnHover(object, isHovering) {
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);
  if (object.scale.x < 0.00001) {
    return;
  }
  let scalePercentage = 1.15
  if (isHovering) {


    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scalePercentage,
      y: object.userData.initialScale.y * scalePercentage,
      z: object.userData.initialScale.z * scalePercentage,
      duration: 0.2,
      ease: 'back.out(3)',
    })
  }
  else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.2,
      ease: 'back.out(3)',

    })
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x,
      y: object.userData.initialRotation.y,
      z: object.userData.initialRotation.z,
      duration: 0.2,
      ease: 'back.out(3)',

    })
    gsap.to(object.position, {
      x: object.userData.initialPosition.x,
      y: object.userData.initialPosition.y,
      z: object.userData.initialPosition.z,
      duration: 0.2,
      ease: 'back.out(3s)',
    })
  }
}
//exrea stuff
function rotateSeat() {
  const seatObject = buttonObjects.find(obj => obj.name === "Fifth_Seat_Top_Raycaster_Pointer").object;
  gsap.to(seatObject.rotation, {
    x: 0,
    y: seatObject.rotation. y - Math.PI*2,
    z: 0,
    duration: 1,
    ease: 'back.inOut(3)'
    ,
   
  })
}

//start update loop
Update();
