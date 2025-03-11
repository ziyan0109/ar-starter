import { createPlaneMarker } from "./objects/PlaneMarker";
import { handleXRHitTest } from "./utils/hitTest";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

import {
AmbientLight,
BoxBufferGeometry,
Mesh,
MeshBasicMaterial,
Object3D,
PerspectiveCamera,
Scene,
WebGLRenderer,
XRFrame,
} from "three";

// Array to store placed models
const placedModels: Object3D[] = [];
const ROTATION_SPEED = 0.02; // Adjust this value to change rotation speed

export function createScene(renderer: WebGLRenderer) {
const scene = new Scene()

const camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.02,
    20,
)

const planeMarker = createPlaneMarker();
scene.add(planeMarker);

let FBXModel: Object3D;

const fbxLoader = new FBXLoader();
fbxLoader.load("../assets/models/shanshan.fbx", (fbx: Object3D) => {
  FBXModel = fbx;
  FBXModel.scale.set(0.001,0.001,0.001);
});

const controller = renderer.xr.getController(0);
scene.add(controller);

const renderLoop = (timestamp: number, frame?: XRFrame) => {
  if (renderer.xr.isPresenting) {
    // Rotate all placed models
    placedModels.forEach(model => {
      model.rotation.y += ROTATION_SPEED;
    });

    if (frame) {
      handleXRHitTest(renderer, frame, (hitPoseTransformed: Float32Array) => {
        if (hitPoseTransformed) {
          planeMarker.visible = true;
          planeMarker.matrix.fromArray(hitPoseTransformed);
        }
      }, () => {
        planeMarker.visible = false;
      })
    }
    renderer.render(scene, camera);
  }
}

controller.addEventListener("select", onSelect);

function onSelect() {
  if (planeMarker.visible) {
    const model = FBXModel.clone();
    model.position.setFromMatrixPosition(planeMarker.matrix);

    const cameraPosition = camera.position.clone();
    cameraPosition.y = model.position.y;
    model.lookAt(cameraPosition);
    model.visible = true;

    // Add the model to both the scene and our tracking array
    scene.add(model);
    placedModels.push(model);
  }
}

const ambientLight = new AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

renderer.setAnimationLoop(renderLoop);
};