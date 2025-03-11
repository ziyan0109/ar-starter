import { createPlaneMarker } from "./objects/PlaneMarker";
// import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
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

  let FBXModel: Object3D;

  const fbxLoader = new FBXLoader();
  //CHANGE ME\\
  fbxLoader.load("../assets/models/shanshan.glb", (fbx: Object3D) => {
    FBXModel = fbx;
    FBXModel.scale.set(1,1,1);
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
      const model = FBXModel.clone();

      model.position.setFromMatrixPosition(planeMarker.matrix);

      // Rotate the model randomly to give a bit of variation to the scene.
      // model.rotation.y =  (Math.PI);
      // model.lookAt(camera.position);
      const cameraPosition = camera.position.clone();
      cameraPosition.y = model.position.y; // Keep Y level the same

      model.lookAt(cameraPosition);

      model.visible = true;

      scene.add(model);
    }
  }

  //add light
  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  renderer.setAnimationLoop(renderLoop);
};
