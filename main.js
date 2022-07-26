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
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(0, 0, 0);
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// Helpers
// const lightHelper = new THREE.PointLightHelper(pointLight);
// const gridHelper = new THREE.GridHelper(200, 50);
// const axesHelper = new THREE.AxesHelper(100);
// scene.add(lightHelper, gridHelper, axesHelper);
const controls = new OrbitControls(camera, renderer.domElement);

// Torus knot
const geometry = new THREE.TorusKnotGeometry(7.5, 0.45, 300, 20, 7, 12);
const material = new THREE.MeshNormalMaterial();
const torusKnot = new THREE.Mesh(geometry, material);
scene.add(torusKnot);
torusKnot.position.x = 2;

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

// Avatar cube
const cubeTexture = new THREE.TextureLoader().load("luis.png");
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshBasicMaterial({ map: cubeTexture })
);
scene.add(cube);
cube.position.z = -5;
cube.position.x = 3;

// Earth Proto
let planetProto = {
  sphere: function (size) {
    let sphere = new THREE.SphereGeometry(size, 32, 32);

    return sphere;
  },
  material: function (options) {
    let material = new THREE.MeshPhongMaterial();
    if (options) {
      for (var property in options) {
        material[property] = options[property];
      }
    }

    return material;
  },
  glowMaterial: function (intensity, fade, color) {
    // Custom glow shader from https://github.com/stemkoski/stemkoski.github.com/tree/master/Three.js
    let glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: {
          type: "f",
          value: intensity,
        },
        p: {
          type: "f",
          value: fade,
        },
        glowColor: {
          type: "c",
          value: new THREE.Color(color),
        },
        viewVector: {
          type: "v3",
          value: camera.position,
        },
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize( normalMatrix * normal );
          vec3 vNormel = normalize( normalMatrix * viewVector );
          intensity = pow( c - dot(vNormal, vNormel), p );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() 
        {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, 1.0 );
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    return glowMaterial;
  },
  texture: function (material, property, uri) {
    let textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = true;
    textureLoader.load(uri, function (texture) {
      material[property] = texture;
      material.needsUpdate = true;
    });
  },
};

let createPlanet = function (options) {
  // Create the planet's Surface
  let surfaceGeometry = planetProto.sphere(options.surface.size);
  let surfaceMaterial = planetProto.material(options.surface.material);
  let surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);

  // Create the planet's Atmosphere
  let atmosphereGeometry = planetProto.sphere(
    options.surface.size + options.atmosphere.size
  );
  let atmosphereMaterialDefaults = {
    side: THREE.DoubleSide,
    transparent: true,
  };
  let atmosphereMaterialOptions = Object.assign(
    atmosphereMaterialDefaults,
    options.atmosphere.material
  );
  let atmosphereMaterial = planetProto.material(atmosphereMaterialOptions);
  let atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

  // Create the planet's Atmospheric glow
  let atmosphericGlowGeometry = planetProto.sphere(
    options.surface.size +
      options.atmosphere.size +
      options.atmosphere.glow.size
  );
  let atmosphericGlowMaterial = planetProto.glowMaterial(
    options.atmosphere.glow.intensity,
    options.atmosphere.glow.fade,
    options.atmosphere.glow.color
  );
  let atmosphericGlow = new THREE.Mesh(
    atmosphericGlowGeometry,
    atmosphericGlowMaterial
  );

  // Nest the planet's Surface and Atmosphere into a planet object
  let planet = new THREE.Object3D();
  surface.name = "surface";
  atmosphere.name = "atmosphere";
  atmosphericGlow.name = "atmosphericGlow";
  planet.add(surface);
  planet.add(atmosphere);
  planet.add(atmosphericGlow);

  // Load the Surface's textures
  for (let textureProperty in options.surface.textures) {
    planetProto.texture(
      surfaceMaterial,
      textureProperty,
      options.surface.textures[textureProperty]
    );
  }

  // Load the Atmosphere's texture
  for (let textureProperty in options.atmosphere.textures) {
    planetProto.texture(
      atmosphereMaterial,
      textureProperty,
      options.atmosphere.textures[textureProperty]
    );
  }

  return planet;
};

let earth = createPlanet({
  surface: {
    size: 1.2,
    material: {
      bumpScale: 0.05,
      specular: new THREE.Color("grey"),
      shininess: 10,
    },
    textures: {
      map: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthmap1k.jpg",
      bumpMap:
        "https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthbump1k.jpg",
      specularMap:
        "https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthspec1k.jpg",
    },
  },
  atmosphere: {
    size: 0.003,
    material: {
      opacity: 0.8,
    },
    textures: {
      map: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthcloudmap.jpg",
      alphaMap:
        "https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthcloudmaptrans.jpg",
    },
    glow: {
      size: 0.02,
      intensity: 0.7,
      fade: 7,
      color: 0x93cfef,
    },
  },
});
scene.add(earth);
earth.position.z = 37;
earth.position.setX(-3.5);
earth.position.setY(-0.5);

// Galaxy
let galaxyModel;
let loader = new GLTFLoader();
loader.load(
  "/assets/galaxy/scene.gltf",
  function (gltf) {
    galaxyModel = gltf;
    scene.add(gltf.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Computer
let computerModel;
loader = new GLTFLoader();
loader.load(
  "/assets/computer/scene.gltf",
  function (gltf) {
    computerModel = gltf;
    scene.add(gltf.scene);
    computerModel.scene.position.setZ(4);
    computerModel.scene.position.setX(1.25);
    computerModel.scene.position.setY(-0.75);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Hat
let hatModel;
loader = new GLTFLoader();
loader.load(
  "/assets/hat/scene.gltf",
  function (gltf) {
    hatModel = gltf;
    scene.add(gltf.scene);
    hatModel.scene.position.setZ(-5);
    hatModel.scene.position.setX(3);
    hatModel.scene.position.setY(2);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Desk
let deskModel;
loader = new GLTFLoader();
loader.load(
  "/assets/desk/scene.gltf",
  function (gltf) {
    deskModel = gltf;
    scene.add(gltf.scene);
    deskModel.scene.position.setZ(12.5);
    deskModel.scene.position.setX(-5);
    deskModel.scene.position.setY(-2);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Books
let booksModel;
loader = new GLTFLoader();
loader.load(
  "/assets/books/scene.gltf",
  function (gltf) {
    booksModel = gltf;
    scene.add(gltf.scene);
    booksModel.scene.position.setZ(20);
    booksModel.scene.position.setX(2.5);
    booksModel.scene.position.setY(-1);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Background
const nebula = new THREE.TextureLoader().load("/carina-nebula.jpg");
scene.background = nebula;

// Scroll Animation
function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  earth.rotation.y += 0.025;

  cube.rotation.y += 0.025;
  cube.rotation.z += 0.025;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}
document.body.onscroll = moveCamera;
moveCamera();

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  if (galaxyModel) {
    galaxyModel.scene.scale.set(75, 75, 75);
    galaxyModel.scene.rotation.x -= 0.00125;
    galaxyModel.scene.rotation.y -= 0.00125;
    galaxyModel.scene.rotation.z += 0.0005;
  }
  if (computerModel) {
    computerModel.scene.scale.set(0.75, 0.75, 0.75);
    computerModel.scene.rotation.y -= 0.0025;
    computerModel.scene.rotation.z -= 0.0005;
  }
  if (hatModel) {
    hatModel.scene.scale.set(0.75, 0.75, 0.75);
    hatModel.scene.rotation.y -= 0.0025;
  }
  if (deskModel) {
    deskModel.scene.scale.set(0.025, 0.025, 0.025);
    deskModel.scene.rotation.y -= 0.0025;
    deskModel.scene.rotation.x += 0.0005;
  }
  if (booksModel) {
    booksModel.scene.scale.set(2.5, 2.5, 2.5);
    booksModel.scene.rotation.y -= 0.01;
  }
  earth.rotation.y += 0.001;
  torusKnot.rotation.z += 0.005;

  //controls.update();
  renderer.render(scene, camera);
}
animate();
