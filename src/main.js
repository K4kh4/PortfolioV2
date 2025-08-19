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


//modals
const Modals = {
  work1: document.querySelector('.modal.work1'),
  work2: document.querySelector('.modal.work2'),
  work3: document.querySelector('.modal.work3'),
  work4: document.querySelector('.modal.work4'),
  work5: document.querySelector('.modal.work5'),
  about: document.querySelector('.modal.about'),
  contact: document.querySelector('.modal.contact')
}

document.querySelectorAll('.modal-exit-button').forEach(button => {
  button.addEventListener('click', () => {
    hideModal(button.parentElement);
  })
})

const showModal = (modal) => {
  ModalOpen = true;
  modal.style.display = 'block';
  gsap.set(modal, {
    opacity: 0,
  })
  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  })
}
const hideModal = (modal) => {
  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = 'none';
      CloseNoteBook(notebookObject);
      ModalOpen = false;
    }
  })
}

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
camera.position.set(5, 5.5, -11.7)
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableZoom = true
controls.enablePan = true
controls.dampingFactor = 0.5
controls.target.set(1.4, 2.1, -1.6)

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
  console.log(interactiveObject.modal);
  switch (interactiveObject.action) {
    case "openNotebook":
      OpenNoteBook(notebookObject);
      break;

    case "showModal":
      if (interactiveObject.modal && Modals[interactiveObject.modal]) {
        showModal(Modals[interactiveObject.modal]);
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

  if (ModalOpen) {
    return;
  }
  controls.update();
  renderer.render(scene, camera);
  raycaster.setFromCamera(pointer, camera);
  currentIntersect = raycaster.intersectObjects(raycastObjects);




  if (currentIntersect.length > 0) {
    // need to add ayerrs ike clickable, hoverable, animated, 
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

  window.requestAnimationFrame(Update);
}

function OpenNoteBook(object) {
  gsap.to(object.rotation, {
    x: Math.PI,
    y: 0,
    z: 0,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: function () { interactiveObjects.forEach(interactiveObj => {
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
    }) },
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
      x: object.userData.initialScale.x + 0.1,
      y: object.userData.initialScale.y + 0.1,
      z: object.userData.initialScale.z + 0.1,
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

