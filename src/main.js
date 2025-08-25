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
  testModal,
  checkModalStates,
  checkFloatingEffects
} from './modal.js';

//notebook
let notebookObject;

// Interactive objects list - each object has a 3D object reference and corresponding modal
const buttonObjects = [
  {
    name: "MyWork_Button",
    object: null, // Will be set when loading the model
    modal: "work1",
    action: "openNotebook" // Special action for this button
  },
  {
    name: "AboutMe_Button",
    object: null,
    modal: "about",
    action: "zoomToAboutMe"
  },
  {
    name: "Other_Button",
    object: null,
    modal: "other",
    action: "zoomToBoard"
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
    name: "AbouButton",
    object: null,
    modal: "about",
    action: "showModal"
  },
  {
    name: "ResumeButton",
    object: null,
    modal: "about",
    action: "zoomToResume"
  }
];

//


// Modal system initialization and global exports
document.addEventListener('DOMContentLoaded', () => {
  // Initialize modal system
  initializeModals();
  
  // Start loading messages
  startLoadingMessages();
});

// Make functions globally available for any remaining inline handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateWork = navigateWork;
window.testModal = testModal;
window.checkModalStates = checkModalStates;
window.checkFloatingEffects = checkFloatingEffects;

// Function to manually reset notebook and camera (if needed later)
window.resetNotebookView = () => {
  console.log('Resetting notebook and camera to original position');
  if (notebookObject) {
    CloseNoteBook();
  }
};

// Make resetNotebookView available globally
window.CloseNoteBook = CloseNoteBook;

//

const canvas = document.querySelector('#experience-canvas')
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);

//loaders
const textureLoader = new THREE.TextureLoader();


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
  }

};
const loadedTexture = {
  First: {
    day: {}
  },
  Second: {
    day: {}
  },
  Third: {
    day: {}
  },
  Fourth: {
    day: {}
  },
  Fifth: {
    day: {}
  }

};

// Loading tracker
let texturesLoaded = 0;
let modelLoaded = false;
let objectsAssigned = false;  // Track if all 3D objects are assigned
const totalTextures = Object.keys(textureMap).length;

// Loading messages
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
  
  // Cycle through messages every 2 seconds
  messageInterval = setInterval(() => {
    currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[currentMessageIndex];
    
    // Restart animation
    loadingText.style.animation = 'none';
    loadingText.offsetHeight; // Trigger reflow
    loadingText.style.animation = 'fadeInOut 1.5s ease-in-out';
  }, 2000);
}

/**
 * Hide the loading modal with animation
 */
function hideLoadingModal() {
  const loadingModal = document.getElementById('loading-modal');
  if (!loadingModal) return;
  
  // Clear message interval
  if (messageInterval) {
    clearInterval(messageInterval);
  }
  
  // Fade out the loading modal
  loadingModal.style.transition = 'opacity 0.5s ease-out';
  loadingModal.style.opacity = '0';
  
  setTimeout(() => {
    loadingModal.style.display = 'none';
  }, 500);
}

/**
 * Called when all assets are loaded
 */
function onLoadComplete() {
  console.log('🎉 All assets loaded and objects ready!');
  
  // Hide loading modal
  hideLoadingModal();
  
  // Initialize notebook state
  if (notebookObject) {
    CloseNoteBook(notebookObject);
  }
  
  // Ready for interaction
  console.log('✅ Portfolio ready for interaction!');
  CloseNoteBook();
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

//model loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load("/models/Room_V1-Compresed.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      // setting up textures
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
        child.material = material
      }
      if (child.name.includes("Fifth")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.Fifth.day
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
//model loader end




//renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// average position for notebook
const cameraNotebookPosition = new THREE.Vector3(1.0116149200302174, 6.571313242426443, -0.8049478528131928);
const targetNotebookPosition = new THREE.Vector3(-1.0674379059115109, 4.033968206624388, -0.790316383561921);





const cameraResumePosition = new THREE.Vector3(1.3, 4.8, -0.7);
const targetResumePosition = new THREE.Vector3(1.2, 3.8, -2.1);



const cameraBoardPosition = new THREE.Vector3(-0.3770576922642992, 5.700365453619895, 0.7587538593560265);
const targetBoardPosition = new THREE.Vector3(-1.4046725555142923, 5.587512942935852, 0.7441562290266093);


//set start position Camera Position: x:12.19, y:6.97, z:9.10 | Target: x:0.09, y:2.78, z:0.08
const originalCameraPosition = new THREE.Vector3(12.19, 6.97, 9.10);
const originalTargetPosition = new THREE.Vector3(0.09, 2.78, 0.08);

camera.position.copy(originalCameraPosition);
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableZoom = true
controls.enablePan = true
controls.dampingFactor = 0.5
controls.target.copy(originalTargetPosition);

//event functions
function OnResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function OnMouseMove(event) {
  updatePointer(event);
}

function OnClick() {
  const intersections = performRaycast(camera);
  handleClickEvents(intersections, buttonObjects, handleObjectClick);
}

// Handle different types of object clicks
function handleObjectClick(interactiveObject) {
  console.log(`Clicked on: ${interactiveObject.name}`);
  console.log(`Modal: ${interactiveObject.modal}`);
  console.log(`Action: ${interactiveObject.action}`);

  switch (interactiveObject.action) {
    case "openNotebook":
      OpenNoteBook(notebookObject);
      break;
    case "zoomToAboutMe":
      zoomCameraToResume();
      break;
    case "zoomToBoard":
      zoomCameraToBoard();
      break;

    case "showModal":
      if (interactiveObject.modal) {
        // Use direct modal class name instead of cached references
        console.log(`Attempting to open modal: ${interactiveObject.modal}`);
        const modalElement = document.querySelector(`.modal.${interactiveObject.modal}`);
        console.log(`Found modal element:`, modalElement);

        if (modalElement) {
          openModal(interactiveObject.modal);
        } else {
          console.error(`Modal element not found for: ${interactiveObject.modal}`);
        }
      } else {
        console.error('No modal specified for interactive object');
      }
      break;

    default:
      console.warn(`Unknown action: ${interactiveObject.action}`);
  }
}




// Helper function to log all interactive objects status
function logInteractiveObjectsStatus() {
  console.log("Interactive Objects Status:");
  buttonObjects.forEach(obj => {
    console.log(`- ${obj.name}: ${obj.object ? 'Loaded' : 'Not Found'} (Modal: ${obj.modal}, Action: ${obj.action})`);
  });
}


//event listeners
window.addEventListener("mousemove", (e) => { OnMouseMove(e); })
window.addEventListener("resize", OnResize);
window.addEventListener("click", OnClick);
// update loop
const Update = () => {
  // Always continue the animation loop
  
  window.requestAnimationFrame(Update);

  if (isModalOpen()) {
    // Still render the scene but skip interactions when modal is open
    renderer.render(scene, camera);
    return;
  }

  controls.update();
  renderer.render(scene, camera);
  
  // Perform raycasting and handle interactions
  const intersections = performRaycast(camera);
  const intersectionData = handleHoverEffects(intersections, OnHover);
  handleCursorChanges(intersectionData);
 
}

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
          })
        }
      })
    },
  })
  zoomCameraToNoteBook();
}

function CloseNoteBook() {
  // Only proceed if we have the notebook object
  if (!notebookObject) {
    console.log('Notebook object not yet loaded');
    return;
  }

  // Hide work buttons
  buttonObjects.forEach(interactiveObj => {
    if (interactiveObj.name.includes("WorkButton_") ) {
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
  resetCameraPosition();
}

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
}
function zoomCameraToNoteBook() {
  gsap.to(camera.position, {
    x: cameraNotebookPosition.x,
    y: cameraNotebookPosition.y,
    z: cameraNotebookPosition.z,
    duration: 0.5,
    ease: 'power2.inOut'
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
  let scalePercentage=1.2
  if (isHovering) {
    
   
    gsap.to(object.scale, {
      x:  object.userData.initialScale.x * scalePercentage,
      y: object.userData.initialScale.y * scalePercentage,
      z: object.userData.initialScale.z * scalePercentage,
      duration: 0.1,
      ease: 'power2.inOut',
    })
  }
  else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.1,
      ease: 'power2.inOut',

    })
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x,
      y: object.userData.initialRotation.y,
      z: object.userData.initialRotation.z,
      duration: 0.1,
      ease: 'power2.inOut',

    })
    gsap.to(object.position, {
      x: object.userData.initialPosition.x,
      y: object.userData.initialPosition.y,
      z: object.userData.initialPosition.z,
      duration: 0.1,
      ease: 'power2.inOut',
    })
  }
}


//start update loop
Update();
