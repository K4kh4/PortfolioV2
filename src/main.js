import * as THREE from 'three';
import { OrbitControls } from './utils/OrbitControls.js'; //from src/utils/OrbitControls untill here
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
// GLOBAL VARIABLES & CONSTANTS
// =============================================================================

// Performance and interaction constants
const CAMERA_THRESHOLDS = {
  NOTEBOOK_DISTANCE: 3,
  POSITION_DISTANCE: 5,
  CLOSE_DISTANCE: 0.00001
};

const PERFORMANCE_CONFIG = {
  RAYCAST_INTERVAL: 33, // 30fps for interactions (33ms)
  MOBILE_RAYCAST_INTERVAL: 50, // 20fps for mobile (50ms)
  MOBILE_PIXEL_RATIO_MAX: 1.5
};

// Mobile detection
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Application state management
class PortfolioApp {
  constructor() {
    this.animationId = null;
    this.isDestroyed = false;
    this.lastRaycastTime = 0;
    this.raycastInterval = isMobile ? PERFORMANCE_CONFIG.MOBILE_RAYCAST_INTERVAL : PERFORMANCE_CONFIG.RAYCAST_INTERVAL;

    // Interaction state management
    this.isNavigating = false;
    this.isMouseOverUI = false;
    this.currentUIElement = null; // Store the actual UI element under mouse
    this.mouseDownPosition = { x: 0, y: 0 };
    this.navigationThreshold = 5; // pixels - minimum movement to consider as navigation
  }

  destroy() {
    this.isDestroyed = true;

    // Stop animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Cleanup Three.js resources
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
    }

    if (scene) {
      // Dispose of all geometries and materials
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      scene.clear();
    }

    // Remove event listeners
    window.removeEventListener("mousemove", OnMouseMove);
    window.removeEventListener("mousedown", OnMouseDown);
    window.removeEventListener("mouseup", OnMouseUp);
    window.removeEventListener("resize", OnResize);
    window.removeEventListener("click", OnClick);
  }
}

// Global app instance
let portfolioApp = new PortfolioApp();

/**
 * Check if an element or its parents are UI elements that should block 3D interactions
 * @param {Element} element - The element to check
 * @returns {boolean} - True if element is UI
 */
function isUIElement(element) {
  if (!element){console.log("No element found"); return false;} 

  // Check if element itself or any parent has UI-related classes/IDs
  let currentElement = element;
  while (currentElement && currentElement !== document.body) {
    // Check for UI element classes and IDs
    if (currentElement.classList.contains('home-button') ||
      currentElement.classList.contains('dark-mode-button') ||
      currentElement.classList.contains('modal-exit-button') ||
      currentElement.classList.contains('nav-arrow') ||
      currentElement.classList.contains('enter-button') ||
      currentElement.classList.contains('loading-modal') ||
      currentElement.classList.contains('modal') ||
      currentElement.classList.contains('Dark') ||
      currentElement.id === 'home-button' ||
      currentElement.id === 'dark-mode-button' ||
      currentElement.id === 'enter-button' ||
      currentElement.id === 'loading-modal') {
      return true;
    }

    // Check for any button or interactive element
    if (currentElement.tagName === 'BUTTON' ||
      currentElement.tagName === 'A' ||
      currentElement.hasAttribute('onclick') ||
      currentElement.style.cursor === 'pointer') {
      return true;
    }

    currentElement = currentElement.parentElement;
  }

  return false;
}

/**
 * Get the actual target element from event (works for both mouse and touch)
 * @param {Event} event - Mouse or touch event
 * @returns {Element} - The target element
 */
function getEventTarget(event) {
  if (event.type.startsWith('touch')) {
    // For touch events, use elementFromPoint to get the element under touch
    const touch = event.touches[0] || event.changedTouches[0];
    if (touch) {
      return document.elementFromPoint(touch.clientX, touch.clientY);
    }
  }
  return event.target;
}

/**
 * Calculate distance between two points
 * @param {Object} point1 - First point with x, y properties
 * @param {Object} point2 - Second point with x, y properties
 * @returns {number} - Distance in pixels
 */
function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

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
    name: "Third_MyWork_Button_Raycaster_Pointer_Hover",
    object: null, // Will be set when loading the model
    modal: "",
    action: "openNotebook" // Special action for this button
  },
  {
    name: "Third_MyWork_Sign_Raycaster_Pointer_Hover",
    object: null, // Will be set when loading the model
    modal: "",
    action: "openNotebook" // Special action for this button
  },
  {
    name: "Mac_display",
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
    name: "Third_Other_Button_Raycaster_Pointer_Hover",
    object: null,
    modal: "gallery",
    action: "showModal"
  },
  {
    name: "Third_Other_Sign_Raycaster_Pointer_Hover",
    object: null,
    modal: "gallery",
    action: "showModal"
  },
  {
    name: "Fourth__Board_ExtraButton_Raycaster_HoverV1_Pointer",
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
    modal: "work2",
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
    modal: "work5",
    action: "showModal"
  },
  {
    name: "WorkButton_6",
    object: null,
    modal: "work6",
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
  // Initialize canvas now that DOM is ready
  canvas = document.querySelector('#experience-canvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Initialize renderer and controls now that canvas exists
  initializeRenderer();
  initializeControls();

  // Initialize modal system AFTER controls are ready
  initializeModals();

  // Initialize home button with camera reset functionality
  initializeHomeButton(resetCameraPosition);

  // Initialize dark mode button
  initializeDarkModeButton();

  // Bind enter button without inline handler
  const enterBtn = document.getElementById('enter-button');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => hideLoadingModal());
  }

  // Start loading messages
  startLoadingMessages();

});



// Global function to manually reset notebook and camera to original position
window.resetNotebookView = () => {
  console.log('🏠 Resetting notebook and camera to original position');
  if (notebookObject) {
    CloseNoteBook();
  }
};
window.onModeSwitch = (e) => {
  switchMode(e);
};

// =============================================================================
// THREE.JS SETUP AND CONFIGURATION
// =============================================================================

// Canvas and scene setup - will be initialized when DOM is ready
let canvas = null;
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
    day: "/textures/Day/First_Texture_Set_Day_Denoised_Compressed.webp",
    night: "/textures/Night/First_Texture_Set_Night_Denoised_Compressed.webp"
  },
  Second: {
    day: "/textures/Day/Second_Texture_Set_Day_Denoised_Compressed.webp",
    night: "/textures/Night/Second_Texture_Set_Night_Denoised_Compressed.webp"
  },
  Third: {
    day: "/textures/Day/Third_Texture_Set_Day_Denoised_Compressed.webp",
    night: "/textures/Night/Third_Texture_Set_Night_Denoised_Compressed.webp"
  },
  Fourth: {
    day: "/textures/Day/Forth_Texture_Set_Day_Denoised_Compressed.webp",
    night: "/textures/Night/Forth_Texture_Set_Night_Denoised_Compressed.webp"
  },
  Fifth: {
    day: "/textures/Day/Fifth_Texture_Set_Day_Denoised_Compressed.webp",
    night: "/textures/Night/Fifth_Texture_Set_Night_Denoised_Compressed.webp"
  },

  macbook: {
    day: "/textures/Day/Mac.webp",
    night: "/textures/Night/Mac_Night.webp"
  }
};
const materialMap = {
  First: { },
  Second: { },
  Third: { },
  Fourth: { },
  Fifth: { },
  macbook: { }
};

// Storage for loaded textures - populated during async loading
const loadedTexture = {
  First: { day: {}, night: {} },
  Second: { day: {}, night: {} },
  Third: { day: {}, night: {} },
  Fourth: { day: {}, night: {} },
  Fifth: { day: {}, night: {} },
  books: { day: {}, night: {} },
  macbook: { day: {}, night: {} }
};

// =============================================================================
// LOADING SYSTEM
// =============================================================================

// Asset loading state tracking
let texturesLoaded = 0;
let modelLoaded = false;
let objectsAssigned = false;
const totalTextures = Object.keys(textureMap).length;

// Progress tracking for loading bar
let totalAssets = totalTextures + 1; // +1 for the model
let loadedAssets = 0;

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
 * Update the progress bar and percentage text
 */
function updateProgress() {
  const progressPercentage = Math.round((loadedAssets / totalAssets) * 100);
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  if (progressFill) {
    progressFill.style.width = progressPercentage + '%';
  }

  if (progressText) {
    progressText.textContent = progressPercentage + '%';
  }

  console.log(`Loading progress: ${loadedAssets}/${totalAssets} (${progressPercentage}%)`);
}

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
  }, 1500);
}





/**
 * Called when all assets are loaded
 */
function onLoadComplete() {
  console.log('🎉 All assets loaded and objects ready!');

  // Initialize notebook state
  if (notebookObject) {
    CloseNoteBook(notebookObject);
  }

  // Clear the message interval
  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }

  // Hide loading elements and show enter button
  const loadingText = document.getElementById('loading-text');
  const progressContainer = document.querySelector('.progress-container');
  const enterButton = document.getElementById('enter-button');

  if (loadingText) {
    loadingText.style.display = 'none';
  }

  if (progressContainer) {
    progressContainer.style.display = 'none';
  }

  if (enterButton) {
    enterButton.classList.remove('hidden');
  }

  // Ready for interaction
  console.log('✅ Portfolio ready for interaction!');
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

/**
 * Load textures with error handling and mobile optimization
 */
function loadTextures() {
  Object.entries(textureMap).forEach(([key, value]) => {
    const dayTexture = textureLoader.load(
      value.day,
      // onLoad
      (texture) => {
        texturesLoaded++;
        loadedAssets++;
        console.log(`✅ Texture loaded: ${key} (${texturesLoaded}/${totalTextures})`);

        // Optimize texture for mobile
        if (isMobile) {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
        }

        updateProgress();
        checkIfComplete();
      },
      // onProgress
      (progress) => {
        console.log(`📥 Loading texture ${key}: ${Math.round((progress.loaded / progress.total) * 100)}%`);
      },
      // onError
      (error) => {
        console.error(`❌ Failed to load texture ${key}:`, error);
        texturesLoaded++; // Still count as "loaded" to prevent hanging
        loadedAssets++;

        // Create fallback colored texture
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333333'; // Dark gray fallback
        ctx.fillRect(0, 0, 1, 1);

        const fallbackTexture = new THREE.CanvasTexture(canvas);
        fallbackTexture.flipY = false;
        fallbackTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture[key].day = fallbackTexture;

        console.log(`🔄 Created fallback texture for ${key}`);
        updateProgress();
        checkIfComplete();
      }
    );
    const nightTexture = textureLoader.load(
      value.night,
      (texture) => {
       
        console.log(`✅ Texture loaded: ${key} (${texturesLoaded}/${totalTextures})`);
      }
    );
    nightTexture.flipY = false;
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture[key].night = nightTexture;

    dayTexture.flipY = false;
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture[key].day = dayTexture;
  });
}

// Start texture loading
loadTextures();

// =============================================================================
// MODEL LOADING AND SCENE SETUP
// =============================================================================

// Configure DRACO compression loader for efficient model loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

// Configure GLTF loader with DRACO support
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

/**
 * Create fallback 2D portfolio interface
 */
function createFallbackInterface() {
  console.log('🔄 Creating fallback 2D interface...');

  const fallbackHTML = `
    <div class="fallback-portfolio" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0b0d10;
      color: #e6eef8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Helvetica', sans-serif;
      z-index: 10001;
    ">
      <div style="text-align: center; max-width: 600px; padding: 2rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: -2px;">
          NATIA<br>KALANDIA
        </h1>
        <p style="font-size: 1rem; color: #9fb0c3; margin-bottom: 3rem;">
          Personality hire copywriter
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <button onclick="openModal('work1')" style="
            background: rgba(159, 249, 255, 0.1);
            border: 2px solid rgba(159, 249, 255, 0.5);
            color: #e6eef8;
            padding: 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(159, 249, 255, 0.2)'" onmouseout="this.style.background='rgba(159, 249, 255, 0.1)'">
            N26 Banking
          </button>
          
          <button onclick="openModal('work2')" style="
            background: rgba(159, 249, 255, 0.1);
            border: 2px solid rgba(159, 249, 255, 0.5);
            color: #e6eef8;
            padding: 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(159, 249, 255, 0.2)'" onmouseout="this.style.background='rgba(159, 249, 255, 0.1)'">
            Plastic Fischer
          </button>
          
          <button onclick="openModal('work3')" style="
            background: rgba(159, 249, 255, 0.1);
            border: 2px solid rgba(159, 249, 255, 0.5);
            color: #e6eef8;
            padding: 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(159, 249, 255, 0.2)'" onmouseout="this.style.background='rgba(159, 249, 255, 0.1)'">
            Norse Project
          </button>
          
          <button onclick="openModal('work4')" style="
            background: rgba(159, 249, 255, 0.1);
            border: 2px solid rgba(159, 249, 255, 0.5);
            color: #e6eef8;
            padding: 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(159, 249, 255, 0.2)'" onmouseout="this.style.background='rgba(159, 249, 255, 0.1)'">
            Dr. Martens
          </button>
          
          <button onclick="openModal('work5')" style="
            background: rgba(159, 249, 255, 0.1);
            border: 2px solid rgba(159, 249, 255, 0.5);
            color: #e6eef8;
            padding: 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(159, 249, 255, 0.2)'" onmouseout="this.style.background='rgba(159, 249, 255, 0.1)'">
            IKEA
          </button>
          
          <button onclick="openModal('about')" style="
            background: rgba(159, 249, 255, 0.1);
            border: 2px solid rgba(159, 249, 255, 0.5);
            color: #e6eef8;
            padding: 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(159, 249, 255, 0.2)'" onmouseout="this.style.background='rgba(159, 249, 255, 0.1)'">
            About Me
          </button>
        </div>
        
        <p style="font-size: 0.9rem; color: #666; margin-top: 2rem;">
          3D experience unavailable - using fallback interface
        </p>
      </div>
    </div>
  `;

  // Hide the 3D canvas and loading modal
  const canvas = document.getElementById('experience-canvas');
  const loadingModal = document.getElementById('loading-modal');
  if (canvas) canvas.style.display = 'none';
  if (loadingModal) loadingModal.style.display = 'none';

  // Add fallback interface
  document.body.insertAdjacentHTML('beforeend', fallbackHTML);

  // Initialize modals for fallback interface
  initializeModals();

  console.log('✅ Fallback interface created successfully');
}

/**
 * Load the main 3D model with comprehensive error handling
 */
function loadModel() {
  console.log('🏠 Loading 3D model...');

  loader.load(
    "/models/NatiasRoom_V2.glb",
    // onLoad - Success callback
    (gltf) => {
      console.log('✅ 3D Model loaded successfully!');
      setupScene(gltf);
    },
    // onProgress - Progress callback
    (progress) => {
      if (progress.lengthComputable) {
        const percentComplete = Math.round((progress.loaded / progress.total) * 100);
        console.log(`📥 Loading model: ${percentComplete}%`);
      }
    },
    // onError - Error callback
    (error) => {
      console.error('❌ Failed to load 3D model:', error);
      console.log('🔄 Switching to fallback 2D interface...');

      // Create fallback interface
      createFallbackInterface();

      // Still mark as "loaded" to prevent infinite loading
      modelLoaded = true;
      loadedAssets++;
      updateProgress();
    }
  );
}

/**
 * Setup the 3D scene after model loads successfully
 */
function setupScene(gltf) {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      // Apply appropriate textures to different room sections
      if (child.name.includes("First")) {
        const material = new THREE.MeshBasicMaterial();
        material.map = loadedTexture.First.day;
        child.material = material;
        materialMap.First = child.material;
      }

      if (child.name.includes("Second")) {
        const material = new THREE.MeshBasicMaterial();
        material.map = loadedTexture.Second.day;
        child.material = material;
        materialMap.Second = child.material;
      }
      if (child.name.includes("Third")) {
        const material = new THREE.MeshBasicMaterial();
        material.map = loadedTexture.Third.day;
        child.material = material;
        materialMap.Third = child.material;
      }
      if (child.name.includes("Fourth")) {
        const material = new THREE.MeshBasicMaterial();
        material.map = loadedTexture.Fourth.day;
        material.transparent = true;
        material.alphaTest = 0.5;
        child.material = material;
        materialMap.Fourth = child.material;
      }
      if (child.name.includes("Fifth")) {
        const material = new THREE.MeshBasicMaterial();
        material.map = loadedTexture.Fifth.day;
        child.material = material;
        materialMap.Fifth = child.material;
      }
      if (child.name.includes("Mac")) {
        const material = new THREE.MeshBasicMaterial();
        material.map = loadedTexture.macbook.day;
        material.transparent = true;
        material.alphaTest = 0.5;
        child.material = material;
        materialMap.macbook = child.material;
      }

      // Optimize texture filtering
      if (child.material.map) {
        child.material.map.minFilter = THREE.LinearFilter;

      }

      // Setup interactive objects
      if (child.name.includes("Raycaster")) {
        raycastObjects.push(child);
      }

      if (child.name.includes("Hover")) {
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.isAnimating = false;
      }

      if (child.name.includes("Mac_display")) {
        notebookObject = child;
        console.log("📔 Notebook object assigned:", notebookObject.name);
      }

      // Check if this object matches any interactive object
      buttonObjects.forEach(interactiveObj => {
        if (child.name.includes(interactiveObj.name)) {
          interactiveObj.object = child;
          console.log(`🎯 Found interactive object: ${interactiveObj.name}`);
        }
      });
    }
  });

  scene.add(gltf.scene);

  // Log which interactive objects were found
  logInteractiveObjectsStatus();

  // Create static hitboxes for all interactive objects after model loads
  createAllHitboxes(scene);

  // Log interactive objects status
  logInteractiveObjectsStatus();

  // Mark model as loaded and check completion
  modelLoaded = true;
  loadedAssets++;
  console.log('✅ 3D Model setup completed successfully!');
  updateProgress();

  // Check completion with timeout to prevent infinite loops
  let checkAttempts = 0;
  const maxCheckAttempts = 50; // 5 seconds max

  const checkInterval = setInterval(() => {
    checkAttempts++;
    checkIfComplete();

    if (objectsAssigned || checkAttempts >= maxCheckAttempts) {
      clearInterval(checkInterval);
      if (checkAttempts >= maxCheckAttempts) {
        console.warn('⚠️ Object assignment check timed out - proceeding anyway');
        onLoadComplete();
      }
    }
  }, 100);
}

// Start model loading
loadModel();

// =============================================================================
// RENDERER AND CAMERA SETUP
// =============================================================================

// Renderer and controls will be initialized when DOM is ready
let renderer = null;
let controls = null;

/**
 * Initialize the WebGL renderer with mobile optimization
 */
function initializeRenderer() {
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: !isMobile, // Disable antialiasing on mobile for performance
    powerPreference: isMobile ? "low-power" : "high-performance"
  });

  renderer.setSize(sizes.width, sizes.height);

  // Optimize pixel ratio for mobile devices
  const maxPixelRatio = isMobile ? PERFORMANCE_CONFIG.MOBILE_PIXEL_RATIO_MAX : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));

  console.log(`🎮 Renderer initialized - Mobile: ${isMobile}, PixelRatio: ${renderer.getPixelRatio()}`);
}

/**
 * Initialize camera controls
 */
function initializeControls() {
  if (!canvas) {
    console.error('Cannot initialize controls: canvas not found');
    return;
  }

  controls = new OrbitControls(camera, canvas);
  controls.minDistance = 2;
  controls.maxDistance = 25;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minAzimuthAngle = 0;
  controls.maxAzimuthAngle = Math.PI / 2;
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.dampingFactor = 0.5;
  controls.target.copy(originalTargetPosition);

  // Force enable controls and ensure they're working
  controls.enabled = true;
  controls.update();
}
// =============================================================================
// CAMERA POSITIONS AND CONTROLS
// =============================================================================

// Predefined camera positions for different views
//0.7866554556597812,3.55143487694999,-0.7752462564324646position
//-0.9076926879177732,3.4230242980116303,-0.760892905769593target

const cameraNotebookPosition = new THREE.Vector3(0.7866554556597812, 3.55143487694999, -0.7752462564324646);
const targetNotebookPosition = new THREE.Vector3(-0.9076926879177732, 3.4230242980116303, -0.760892905769593);

const cameraResumePosition = new THREE.Vector3(1.3, 4.8, -0.7);
const targetResumePosition = new THREE.Vector3(1.2, 3.8, -2.1);

const cameraBoardPosition = new THREE.Vector3(-0.3770576922642992, 5.700365453619895, 0.7587538593560265);
const targetBoardPosition = new THREE.Vector3(-1.4046725555142923, 5.587512942935852, 0.7441562290266093);


// Initial camera position - wide view of the entire room
const originalCameraPosition = new THREE.Vector3(12.19, 6.97, 9.10);
const originalTargetPosition = new THREE.Vector3(0.09, 2.78, 0.08);

camera.position.copy(originalCameraPosition);

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
  if (renderer) {
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}

/**
 * Handle mouse movement for raycasting and navigation detection
 * @param {MouseEvent} event - Mouse move event
 */
function OnMouseMove(event) {
  // Check if mouse is over UI element using event target
  const targetElement = getEventTarget(event);
  portfolioApp.isMouseOverUI = isUIElement(targetElement);
  portfolioApp.currentUIElement = targetElement;

  // Check if we're navigating (mouse is down and moved beyond threshold)
  if (portfolioApp.isNavigating) {
    const currentPos = { x: event.clientX, y: event.clientY };
    const distance = calculateDistance(portfolioApp.mouseDownPosition, currentPos);

    if (distance > portfolioApp.navigationThreshold) {
      // We're definitely navigating - don't update pointer for raycasting
      return;
    }
  }

  // Only update pointer if we're not over UI and not navigating
  if (!portfolioApp.isMouseOverUI && !portfolioApp.isNavigating) {
    updatePointer(event);
  }
}

/**
 * Handle mouse down events to detect navigation start
 * @param {MouseEvent} event - Mouse down event
 */
function OnMouseDown(event) {
  // Only track left mouse button
  if (event.button === 0) {
    portfolioApp.isNavigating = true;
    portfolioApp.mouseDownPosition = { x: event.clientX, y: event.clientY };
    console.log('🖱️ Mouse down - navigation mode enabled');
  }
}

/**
 * Handle mouse up events to detect navigation end
 * @param {MouseEvent} event - Mouse up event
 */
function OnMouseUp(event) {
  if (event.button === 0) {
    const wasNavigating = portfolioApp.isNavigating;
    portfolioApp.isNavigating = false;

    if (wasNavigating) {
      console.log('🖱️ Mouse up - navigation mode disabled');

      // Small delay to prevent immediate interaction after navigation
      setTimeout(() => {
        // Update pointer position for next interaction
        if (!portfolioApp.isMouseOverUI) {
          updatePointer(event);
        }
      }, 50);
    }
  }
}

/**
 * Handle click events with simplified UI detection
 */
function OnClick(event) {
  // Get the actual clicked element
  const clickedElement = getEventTarget(event);

  // If clicked on UI element, let it handle the click naturally
  if (isUIElement(clickedElement)) {
    console.log('🎯 UI element click - allowing normal UI interaction');
    return; // Let UI handle the click
  }

  // Prevent scene interactions when modal is open
  if (isModalOpen()) {
    console.log('🚫 Click blocked - modal is open');
    return;
  }

  // Prevent interactions if we just finished navigating
  if (portfolioApp.isNavigating) {
    console.log('🚫 Click blocked - navigation in progress');
    return;
  }

  // Check if this was a navigation click (mouse moved significantly during click)
  if (event && portfolioApp.mouseDownPosition) {
    const currentPos = { x: event.clientX, y: event.clientY };
    const distance = calculateDistance(portfolioApp.mouseDownPosition, currentPos);

    if (distance > portfolioApp.navigationThreshold) {
      console.log('🚫 Click blocked - was navigation gesture');
      return;
    }
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

// Register event listeners with capture option to ensure they're processed first
window.addEventListener("mousemove", (e) => { OnMouseMove(e); }, { passive: true });
window.addEventListener("mousedown", (e) => { OnMouseDown(e); }, { passive: true });
window.addEventListener("mouseup", (e) => { OnMouseUp(e); }, { passive: true });
window.addEventListener("resize", OnResize);
window.addEventListener("click", (e) => { OnClick(e); });
// window.addEventListener("onModeSwitch", (e) => { OnModeSwitch(e); });

// =============================================================================
// ZOOM PREVENTION
// =============================================================================

// Prevent zoom with trackpad/mouse wheel + cmd/ctrl
window.addEventListener("wheel", (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, { passive: false });

// Prevent zoom with keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, { passive: false });

// Prevent multi-touch zoom gestures globally
document.addEventListener("touchstart", (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, { passive: false });

document.addEventListener("touchmove", (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, { passive: false });

// Prevent gesturestart, gesturechange, gestureend (Safari specific)
window.addEventListener("gesturestart", (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { passive: false });

window.addEventListener("gesturechange", (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { passive: false });

window.addEventListener("gestureend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { passive: false });

// Add mobile touch support
if (isMobile) {
  console.log('📱 Adding mobile touch event listeners');

  // Touch events for mobile interaction - simplified approach
  window.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);

      // If touching a UI element, let browser handle it naturally
      if (isUIElement(touchedElement)) {
        console.log('📱 Touch on UI element - allowing normal interaction');
        return; // Don't prevent default, don't interfere
      }

      // For 3D scene touches, prevent default and handle navigation
      e.preventDefault();

      // Simulate mouse events for 3D interaction
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      });
      OnMouseDown(mouseDownEvent);

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      OnMouseMove(mouseMoveEvent);
    }
  }, { passive: false });

  window.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);

      // If moving over UI element, don't handle as 3D navigation
      if (isUIElement(touchedElement)) {
        return;
      }

      e.preventDefault();

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      OnMouseMove(mouseMoveEvent);
    }
  }, { passive: false });

  window.addEventListener("touchend", (e) => {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);

      // If ending touch on UI element, let it handle naturally
      if (isUIElement(touchedElement)) {
        console.log('📱 Touch end on UI element - allowing normal interaction');
        return;
      }

      e.preventDefault();

      // Simulate mouse events for 3D interaction
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      });
      OnMouseUp(mouseUpEvent);

      const clickEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: document.elementFromPoint(touch.clientX, touch.clientY)
      });
      OnClick(clickEvent);
    }
  }, { passive: false });

  // Prevent context menu on long press
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  }, { passive: false });
}

// Add cleanup handlers for memory management
window.addEventListener('beforeunload', () => {
  console.log('🔄 Page unloading - cleaning up resources...');
  portfolioApp.destroy();
});

window.addEventListener('pagehide', () => {
  console.log('🔄 Page hidden - cleaning up resources...');
  portfolioApp.destroy();
});

// Handle visibility change for performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('📱 Page hidden - pausing animations');
    // Could pause animations here if needed
  } else {
    console.log('📱 Page visible - resuming animations');
  }
});

/**
 * Main animation loop - handles rendering and interactions with performance optimization
 */
let isNotebookOpen = false;
let isCameraMoving = false;

/**
 * Optimized update function with throttled raycasting
 */
const Update = () => {
  // Check if app is destroyed
  if (portfolioApp.isDestroyed) {
    return;
  }

  // Continue the animation loop
  portfolioApp.animationId = requestAnimationFrame(Update);

  // Don't do anything if renderer or controls aren't initialized yet
  if (!renderer || !controls) {
    return;
  }
  // // log camera position and target
  // console.log(camera.position.clone().toArray() + "position");
  // console.log(controls.target.clone().toArray() + "target");

  const now = performance.now();

  // Check distance between camera and notebook - use constants instead of magic numbers
  const distance = controls.target.distanceTo(targetNotebookPosition);
  const distance2 = camera.position.distanceTo(cameraNotebookPosition);

  if (distance > CAMERA_THRESHOLDS.NOTEBOOK_DISTANCE && isNotebookOpen) {
    console.log("📔 Closing notebook - camera moved away");
    CloseNoteBook();
  }
  if (distance2 > CAMERA_THRESHOLDS.POSITION_DISTANCE && isNotebookOpen) {
    CloseNoteBook();
  }

  // Always update camera controls and render - this should be 60fps
  if (controls && controls.enabled) {
    controls.update();
  }
  if (renderer) {
    renderer.render(scene, camera);
  }

  // Only perform raycasting and interactions when conditions are met
  // Throttle raycasting to improve performance (30fps on desktop, 20fps on mobile)
  const shouldPerformRaycast = !isModalOpen() &&
    !portfolioApp.isMouseOverUI &&
    !portfolioApp.isNavigating &&
    (now - portfolioApp.lastRaycastTime > portfolioApp.raycastInterval);

  if (shouldPerformRaycast) {
    // Perform raycasting and handle interactions
    const intersections = performRaycast(camera);
    const intersectionData = handleHoverEffects(intersections, OnHover);
    handleCursorChanges(intersectionData);
    portfolioApp.lastRaycastTime = now;
  } else if (isModalOpen() || portfolioApp.isMouseOverUI || portfolioApp.isNavigating) {
    // Reset cursor when interactions are blocked
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
  if (isNotebookOpen) {
    return;
  }
  isCameraMoving = true;
  gsap.to(notebookObject.rotation, {
    x: -Math.PI / 2,
    y: 0,
    z: Math.PI / 2,
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
    x: -Math.PI / 2,
    y: Math.PI / 2,
    z: Math.PI / 2,
    duration: 0.5,
    ease: 'power2.inOut'
  })
  notebookObject.userData.initialRotation = new THREE.Euler(-Math.PI / 2, Math.PI / 2, Math.PI / 2);
  
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
    ease: 'power2.out',
    onComplete: function () {
      isCameraMoving = false;
    }
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
/**
 * Handle hover effects on 3D objects with optimized animations
 * @param {THREE.Object3D} object - The object to animate
 * @param {boolean} isHovering - Whether the object is being hovered
 */
function OnHover(object, isHovering) {
  if (object.name.includes("Mac_display")) {
    macHover(object, isHovering);
    return;
  }
  // Kill any existing animations to prevent conflicts
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  
  // Don't animate objects that are scaled down (hidden)
  if (object.scale.x < CAMERA_THRESHOLDS.CLOSE_DISTANCE) {
    return;
  }

  const HOVER_CONFIG = {
    SCALE_MULTIPLIER: 1.15,
    ANIMATION_DURATION: 0.2,
    EASE_IN: 'back.out(3)',
    EASE_OUT: 'back.out(3)'
  };

  if (isHovering) {
    // Scale up on hover
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * HOVER_CONFIG.SCALE_MULTIPLIER,
      y: object.userData.initialScale.y * HOVER_CONFIG.SCALE_MULTIPLIER,
      z: object.userData.initialScale.z * HOVER_CONFIG.SCALE_MULTIPLIER,
      duration: HOVER_CONFIG.ANIMATION_DURATION,
      ease: HOVER_CONFIG.EASE_IN,
    });
  } 
  else {

    // Return to original state
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: HOVER_CONFIG.ANIMATION_DURATION,
      ease: HOVER_CONFIG.EASE_OUT,
    });

    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x,
      y: object.userData.initialRotation.y,
      z: object.userData.initialRotation.z,
      duration: HOVER_CONFIG.ANIMATION_DURATION,
      ease: HOVER_CONFIG.EASE_OUT,
    });

    gsap.to(object.position, {
      x: object.userData.initialPosition.x,
      y: object.userData.initialPosition.y,
      z: object.userData.initialPosition.z,
      duration: HOVER_CONFIG.ANIMATION_DURATION,
      ease: HOVER_CONFIG.EASE_OUT,
    });
  }
}
function macHover(object, isHovering) {
  if (isNotebookOpen || isCameraMoving) {

    return;
  }
  const HOVER_CONFIG = {
    SCALE_MULTIPLIER: 1.15,
    ANIMATION_DURATION: 0.2,
    EASE_IN: 'back.out(3)',
    EASE_OUT: 'back.out(1)'
  };
  if (isHovering) {
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x,
      y: object.userData.initialRotation.y-.5,
      z: object.userData.initialRotation.z,
      duration: HOVER_CONFIG.ANIMATION_DURATION,
      ease: HOVER_CONFIG.EASE_IN,
    });
  }
  else {
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x,
      y: object.userData.initialRotation.y,
      z: object.userData.initialRotation.z,
      duration: HOVER_CONFIG.ANIMATION_DURATION,
      ease: HOVER_CONFIG.EASE_OUT,
    });
  }
}
function switchMode(e) {
  //is dark mode frrrom modal.js 
  scene.traverse(child => {
    if (child.isMesh&& !child.name.includes("Hitbox")) {
      if (child.name.includes("First")) {
        child.material.map = e === 'dark' ? loadedTexture.First.night : loadedTexture.First.day;
      }
      if (child.name.includes("Second")) {
        child.material.map = e === 'dark' ? loadedTexture.Second.night : loadedTexture.Second.day;
      }
      if (child.name.includes("Third")) {
        child.material.map = e === 'dark' ? loadedTexture.Third.night : loadedTexture.Third.day;
      }
      if (child.name.includes("Fourth")) {
        child.material.map = e === 'dark' ? loadedTexture.Fourth.night : loadedTexture.Fourth.day;
      }
      if (child.name.includes("Fifth")) {
        child.material.map = e === 'dark' ? loadedTexture.Fifth.night : loadedTexture.Fifth.day;
      }
      if (child.name.includes("Mac")) {
        child.material.map = e === 'dark' ? loadedTexture.macbook.night : loadedTexture.macbook.day;
      }

    }
  });
}
/**
 * Rotate the seat object with smooth animation
 */
function rotateSeat() {
  const seatObject = buttonObjects.find(obj => obj.name === "Fifth_Seat_Top_Raycaster_Pointer")?.object;

  if (!seatObject) {
    console.warn('⚠️ Seat object not found for rotation');
    return;
  }

  const ROTATION_CONFIG = {
    DURATION: 1,
    EASE: 'back.inOut(3)',
    FULL_ROTATION: Math.PI * 2
  };

  gsap.to(seatObject.rotation, {
    x: 0,
    y: seatObject.rotation.y - ROTATION_CONFIG.FULL_ROTATION,
    z: 0,
    duration: ROTATION_CONFIG.DURATION,
    ease: ROTATION_CONFIG.EASE
  });
}

//start update loop
Update();
