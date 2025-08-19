import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './style.scss'

import gsap from 'gsap';

let ModalOpen = false;
//notebook
let notebookObject;

// Interactive objects list - each object has a 3D object reference and corresponding modal
const interactiveObjects = [
  {
    name: "Button_MyWork",
    object: null, // Will be set when loading the model
    modal: "work",
    action: "openNotebook" // Special action for this button
  },
  {
    name: "Button_About",
    object: null,
    modal: "about",
    action: "showModal"
  },
  {
    name: "Button_Contact",
    object: null,
    modal: "contact",
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
  }

];

//


//modals and navigation
let currentWork = 1;
const totalWorks = 5;

// Modal references - initialized after DOM loads
let Modals = {};

// Unified modal management functions
const openModal = (modalClass) => {
  console.log(`openModal called with: ${modalClass}`);

  // Close any open modals first (but don't wait for animation)
  const currentActiveModal = document.querySelector('.modal.active');
  if (currentActiveModal && !currentActiveModal.classList.contains(modalClass)) {
    currentActiveModal.classList.remove('active');
    currentActiveModal.style.display = 'none';
  }

  // Open the requested modal
  const modal = typeof modalClass === 'string' ?
    document.querySelector('.modal.' + modalClass) : modalClass;

  console.log(`Found modal element:`, modal);

  if (modal) {
    console.log(`Opening modal with classes: ${modal.className}`);

    // Clear any previous GSAP properties and reset modal state
    gsap.killTweensOf(modal);
    gsap.set(modal, { clearProps: "all" });
    modal.style.opacity = '';
    modal.style.display = 'block';

    ModalOpen = true;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent body scroll

    // Update current work index if it's a work modal
    if (modal.classList.contains('work1')) currentWork = 1;
    else if (modal.classList.contains('work2')) currentWork = 2;
    else if (modal.classList.contains('work3')) currentWork = 3;
    else if (modal.classList.contains('work4')) currentWork = 4;
    else if (modal.classList.contains('work5')) currentWork = 5;

    // Apply GSAP animation with fresh start
    gsap.fromTo(modal,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" }
    );

    console.log(`Modal opened successfully: ${modalClass}`);
  } else {
    console.error(`Modal not found for class: .modal.${modalClass}`);
  }
}

const closeModal = () => {
  const activeModal = document.querySelector('.modal.active');
  if (activeModal) {
    gsap.to(activeModal, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        activeModal.classList.remove('active');
        // Clear any GSAP properties that might interfere
        gsap.set(activeModal, { clearProps: "all" });
        activeModal.style.display = 'none';
        activeModal.style.opacity = '';
        document.body.style.overflow = 'auto'; // Restore body scroll

        // DON'T reset notebook and camera - keep them as they are
        // Users can continue clicking work buttons without reopening notebook

        // Reset modal state AFTER all animations are complete
        ModalOpen = false;
        console.log('Modal closed - notebook and camera remain positioned');
      }
    });
  } else {
    // If no active modal, just reset the state
    ModalOpen = false;
  }
}

const showModal = (modal) => {
  if (typeof modal === 'string') {
    openModal(modal);
  } else {
    openModal(modal.classList[0]); // Get first class name
  }
}

const hideModal = (modal) => {
  closeModal();
}

// Navigate between works
const navigateWork = (direction) => {
  let newWork;

  if (direction === 'next') {
    newWork = currentWork < totalWorks ? currentWork + 1 : 1;
  } else {
    newWork = currentWork > 1 ? currentWork - 1 : totalWorks;
  }

  // Close current modal and open new one
  closeModal();
  setTimeout(() => {
    openModal('work' + newWork);
  }, 100);
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize modal references
  Modals = {
    work1: document.querySelector('.modal.work1'),
    work2: document.querySelector('.modal.work2'),
    work3: document.querySelector('.modal.work3'),
    work4: document.querySelector('.modal.work4'),
    work5: document.querySelector('.modal.work5'),
    about: document.querySelector('.modal.about'),
    contact: document.querySelector('.modal.contact')
  };

  // Modal exit button listeners
  document.querySelectorAll('.modal-exit-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  });

  // Navigation button listeners
  document.querySelectorAll('.nav-arrow').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const direction = button.textContent.trim() === '←' ? 'prev' : 'next';
      navigateWork(direction);
    });
  });

  // Close modal when clicking outside content
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
      closeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Prevent clicks inside modal content from closing modal
  document.addEventListener('click', function (e) {
    if (e.target.closest('.work-modal-container, .about h1, .about h2, .about p, .contact h1, .contact h2, .contact p')) {
      e.stopPropagation();
    }
  });
});

// Make functions globally available for any remaining inline handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateWork = navigateWork;

// Debug function to test modals from console
window.testModal = (workNumber) => {
  console.log(`Testing modal work${workNumber}`);
  openModal(`work${workNumber}`);
};

// Debug function to check modal states
window.checkModalStates = () => {
  console.log('Current modal states:');
  for (let i = 1; i <= 5; i++) {
    const modal = document.querySelector(`.modal.work${i}`);
    if (modal) {
      console.log(`work${i}:`, {
        display: modal.style.display,
        opacity: modal.style.opacity,
        hasActive: modal.classList.contains('active'),
        computedDisplay: window.getComputedStyle(modal).display,
        computedOpacity: window.getComputedStyle(modal).opacity
      });
    }
  }
};

// Function to manually reset notebook and camera (if needed later)
window.resetNotebookView = () => {
  console.log('Resetting notebook and camera to original position');
  if (notebookObject) {
    CloseNoteBook(notebookObject);
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
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

//loaders
const textureLoader = new THREE.TextureLoader();


const textureMap = {
  First: {
    day: "/textures/Frist_Texture_Set_Deosed.webp"

  },
  Second: {
    day: "/textures/Second_Texture_Set_Deosed.webp"
  },
  Third: {
    day: "/textures/Third_Texture_Set_Deosed.webp"
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
  }
};
Object.entries(textureMap).forEach(([key, value]) => {
  const dayTexture = textureLoader.load(value.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTexture[key].day = dayTexture;
  // const nightTexture = textureLoader.load(value.night);
  // nightTexture.flipY = false;
  // nightTexture.colorSpace = THREE.SRGBColorSpace;
  // loadedTexture[key].night = nightTexture;
});

// racating
const raycastObjects = [];
let currentIntersect = [];
let currentHoverObject;
//model loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load("/models/Room_V1-Compresed.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      //setting up textures
      if (child.name.includes("First")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.First.day
        child.material = material

      }
      if (child.name.includes("Second")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.Second.day
        child.material = material
      }
      if (child.name.includes("Third")) {
        const material = new THREE.MeshBasicMaterial()
        material.map = loadedTexture.Third.day
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
      if (child.name.includes("Third_notebook_MyWork_Top_Raycaster_Pointer")) {
        notebookObject = child;
      }

      // Check if this object matches any interactive object
      interactiveObjects.forEach(interactiveObj => {
        if (child.name.includes(interactiveObj.name)) {
          interactiveObj.object = child;
          console.log(`Found interactive object: ${interactiveObj.name}`);
          if (interactiveObj.name.includes("WorkButton_")) {
            child.scale.set(0, 0, 0);
          }
        }
      });
    }
  })
  scene.add(gltf.scene)

  // Log which interactive objects were found
  logInteractiveObjectsStatus();
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
//set start position
const originalCameraPosition = new THREE.Vector3(5, 5.5, -11.7);
const originalTargetPosition = new THREE.Vector3(1.4, 2.1, -1.6);

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
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function OnClick() {
  if (currentIntersect.length > 0) {
    const currentIntersectObject = currentIntersect[0].object;
    if (currentIntersectObject.name.includes("Pointer")) {

      // Check if the clicked object matches any interactive object
      const clickedInteractiveObject = interactiveObjects.find(interactiveObj =>
        currentIntersectObject.name.includes(interactiveObj.name)
      );

      if (clickedInteractiveObject) {
        handleObjectClick(clickedInteractiveObject);
      }
    }
  }
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

// Helper function to add new interactive objects dynamically
function addInteractiveObject(name, modalName, action = "showModal") {
  const newObject = {
    name: name,
    object: null,
    modal: modalName,
    action: action
  };

  interactiveObjects.push(newObject);
  console.log(`Added new interactive object: ${name}`);
  return newObject;
}

// Helper function to get all loaded interactive objects
function getLoadedInteractiveObjects() {
  return interactiveObjects.filter(obj => obj.object !== null);
}

// Helper function to log all interactive objects status
function logInteractiveObjectsStatus() {
  console.log("Interactive Objects Status:");
  interactiveObjects.forEach(obj => {
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

  if (ModalOpen) {
    // Still render the scene but skip interactions when modal is open
    renderer.render(scene, camera);
    return;
  }

  controls.update();
  renderer.render(scene, camera);
  raycaster.setFromCamera(pointer, camera);
  currentIntersect = raycaster.intersectObjects(raycastObjects);

  if (currentIntersect.length > 0) {
    // need to add layers like clickable, hoverable, animated, 
    const currentIntersectObject = currentIntersect[0].object;
    if (currentIntersectObject.name.includes("Hover")) {
      if (currentIntersectObject !== currentHoverObject) {
        if (currentHoverObject) {
          OnHover(currentHoverObject, false);
        }
        OnHover(currentIntersectObject, true);
        currentHoverObject = currentIntersectObject;
      }
    }

    if (currentIntersectObject.name.includes("Pointer")) {
      document.body.style.cursor = "pointer";
    }
    else {
      if (currentHoverObject != null) {
        OnHover(currentHoverObject, false);
      }
      currentHoverObject = null;
      document.body.style.cursor = "default";
    }
  }
  else {
    if (currentHoverObject != null) {
      OnHover(currentHoverObject, false);
    }
    currentHoverObject = null;
    document.body.style.cursor = "default";
  }
}

function OpenNoteBook(object) {
  gsap.to(object.rotation, {
    x: Math.PI,
    y: 0,
    z: 0,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: function () {
      interactiveObjects.forEach(interactiveObj => {
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
  zoomCameraTo(object);
}
function CloseNoteBook(object) {
  interactiveObjects.forEach(interactiveObj => {
    if (interactiveObj.name.includes("WorkButton_")) {
      gsap.killTweensOf(interactiveObj.object.scale);
      interactiveObj.object.scale.set(0, 0, 0);
    }
  })
  gsap.to(object.rotation, {
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
function zoomCameraTo() {
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
function OnHover(object, isHovering) {
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (isHovering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x + object.userData.initialScale.x * 0.1,
      y: object.userData.initialScale.y + object.userData.initialScale.y * 0.1,
      z: object.userData.initialScale.z + object.userData.initialScale.z * 0.1,
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

