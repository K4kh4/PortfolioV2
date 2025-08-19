import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './style.scss'

import gsap from 'gsap';

//notebook


//modals
const Modals = {
  work: document.querySelector('.modal.work'),
  about: document.querySelector('.modal.about'),
  contact: document.querySelector('.modal.contact')
}

document.querySelectorAll('.modal-exit-button').forEach(button => {
  button.addEventListener('click', () => {
    hideModal(button.parentElement);
  })
})

const showModal = (modal) => {
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
let notebookObject;
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
      if (child.name.includes("Third_notebook_MyWork_Top_Raycaster_Pointer")) {
        notebookObject = child;
      }
    }
  })
  scene.add(gltf.scene)
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
      if (currentIntersectObject.name.includes("Button_MyWork")) {
        OpenNoteBook(notebookObject);
      }
    }
  }
}

//event listeners
window.addEventListener("mousemove", (e) => { OnMouseMove(e); })
window.addEventListener("resize", OnResize);
window.addEventListener("click", OnClick);
// update loop
const Update = () => {


  controls.update();
  renderer.render(scene, camera);
  raycaster.setFromCamera(pointer, camera);
  currentIntersect = raycaster.intersectObjects(raycastObjects);

  for (let i = 0; i < currentIntersect.length; i++) {
    if (currentIntersect[i].object.name.includes("Hover")) {
      PopObject(currentIntersect[i].object);
    }

  }


  if (currentIntersect.length > 0) {
    // need to add ayerrs ike clickable, hoverable, animated, 
    const currentIntersectObject = currentIntersect[0].object;
    if (currentIntersectObject.name.includes("Pointer")) {
      document.body.style.cursor = "pointer";

    }
    else {
      document.body.style.cursor = "default";
    }

  }
  else {
    
    document.body.style.cursor = "default";
  }

  window.requestAnimationFrame(Update);
}

//functions
function PopObject(object) {
  gsap.to(object.scale, {
    x: 1.1,
    y: 1.1,
    z: 1.1,
    duration: 0.1,
    ease: 'power2.inOut'
  })
 
}

function OpenNoteBook(object) {
  gsap.to(object.rotation, {
    x: Math.PI,
    y: 0,
    z: 0,
    duration: 0.5,
    ease: 'power2.inOut'
  })
  zoomCameraTo(object);
}
function CloseNoteBook(object) {
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
//start update loop
Update();

