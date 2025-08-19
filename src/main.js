import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './style.scss'


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



//model loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load("/models/Room_V1-Compresed.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
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

//event listeners
window.addEventListener("mousemove", (e) => { OnMouseMove(e); })
window.addEventListener("resize", OnResize);

// update loop
const Update = () => {
  controls.update();
  renderer.render(scene, camera);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object.name === "Book") {
      PopObject(intersects[i].object);
    }
    if (intersects[i].object.name === "Drawer_Left") {
      intersects[i].object.translateZ(-.5);
    }
  }
  if (intersects.length > 0) {
    // need to add ayerrs ike clickable, hoverable, animated, 
    document.body.style.cursor = "pointer";
  }
  else {
    document.body.style.cursor = "default";
  }


  window.requestAnimationFrame(Update);
}

//functions
function PopObject(object) {
  console.log(object.name);
  object.scale.x = 2;
  object.scale.y = 2;
  object.scale.z = 2;

  setTimeout(() => {
    object.scale.x = 1;
    object.scale.y = 1;
    object.scale.z = 1;
  }, 1000);
}
//start update loop
Update();

