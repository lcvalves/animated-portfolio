import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(100);
camera.position.setX(0);

renderer.render(scene, camera);

// Background
const nebula = new THREE.TextureLoader().load("/carina-nebula.jpg");
scene.background = nebula;

// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// Galaxy
let loadedModel;
const loader = new GLTFLoader();
loader.load(
  "/assets/galaxy/scene.gltf",
  function (gltf) {
    loadedModel = gltf;
    scene.add(gltf.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Helpers
const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(100, 100);
const axesHelper = new THREE.AxesHelper(100);

scene.add(lightHelper, gridHelper, axesHelper);

const controls = new OrbitControls(camera, renderer.domElement);

// Animation Loop
function animate() {
  if (loadedModel) {
    loadedModel.scene.scale.set(250, 250, 250);
    loadedModel.scene.rotation.x -= 0.0025;
    loadedModel.scene.rotation.y -= 0.0025;
    loadedModel.scene.rotation.z += 0.001;
  }

  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
