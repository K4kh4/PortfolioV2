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

//Loaders
const textureLoader = new THREE.TextureLoader()
//model loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const textureMap = {
  First: {
    day: "/textures/TextureSetDenoise_PNG.webp"

  }
};
const loadedTexture = {
  First: {
    day: {}
  }
};

Object.entries(textureMap).forEach(([key, value]) => {
  const dayTexture = textureLoader.load(value.day)
  dayTexture.flipY = false
  dayTexture.colorSpace = THREE.SRGBColorSpace
  loadedTexture[key].day = dayTexture
});

loader.load("/models/RoomV1.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      const material = new THREE.MeshBasicMaterial()
      material.map = loadedTexture.First.day
      child.material = material
      if (child.name === "Plane") {
        const newMaterial = new THREE.MeshToonMaterial(
          {
            color: 0xffffff,
            map: null
          });
        child.material = newMaterial;

      }
      if (child.material.map) {
        child.material.map.minFilter = THREE.LinearFilter;
      }
    }
  })
  scene.add(gltf.scene)
})

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


//event listeners
window.addEventListener("resize", OnResize);


function OnResize() 
{
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}



const Update = () => {
  controls.update()
  renderer.render(scene, camera);
  window.requestAnimationFrame(Update);
}

Update();

