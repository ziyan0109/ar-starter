import { createPlaneMarker } from "./objects/PlaneMarker";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { handleXRHitTest } from "./utils/hitTest";

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


export function createScene(renderer: WebGLRenderer) {
  const scene = new Scene()

  const camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.02,
      20,
  )

  //Add hit plane marker
  const planeMarker = createPlaneMarker();

  scene.add(planeMarker);

  //add koala

  let GLBModel: Object3D;

  const gltfLoader = new GLTFLoader();
  //CHANGE ME\\
  gltfLoader.load("../assets/models/shanshan.glb", (gltf: GLTF) => {
    GLBModel = gltf.scene.children[0];
  });

  //add controller
  const controller = renderer.xr.getController(0);
  scene.add(controller);

  const renderLoop = (timestamp: number, frame?: XRFrame) => {
    if (renderer.xr.isPresenting) {

      //if find surface, render floor marker as visible
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

  //if user press screen show koala
  controller.addEventListener("select", onSelect);

  function onSelect() {
    if (planeMarker.visible) {
      const model = GLBModel.clone();

      model.position.setFromMatrixPosition(planeMarker.matrix);

      // Rotate the model randomly to give a bit of variation to the scene.
      // model.rotation.y =  (Math.PI);
      model.lookAt(camera.position);
      model.visible = true;

      scene.add(model);
    }
  }

  //add light
  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  renderer.setAnimationLoop(renderLoop);
};
