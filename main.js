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
camera.position.setX(-10);

renderer.render(scene, camera);

// Stars
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(250));

  star.position.set(x, y, z);
  scene.add(star);
}
Array(500).fill().forEach(addStar);

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
const gridHelper = new THREE.GridHelper(200, 50);
const axesHelper = new THREE.AxesHelper(100);

scene.add(lightHelper, gridHelper, axesHelper);

const controls = new OrbitControls(camera, renderer.domElement);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  if (loadedModel) {
    loadedModel.scene.scale.set(250, 250, 250);
    loadedModel.scene.rotation.x -= 0.0025;
    loadedModel.scene.rotation.y -= 0.0025;
    loadedModel.scene.rotation.z += 0.001;
  }
  controls.update();
  renderer.render(scene, camera);
}

animate();
