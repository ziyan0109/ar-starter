import { createPlaneMarker } from "./objects/PlaneMarker";
import { handleXRHitTest } from "./utils/hitTest";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import * as THREE from "three";

import {
  AmbientLight,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  XRFrame,
  AnimationClip,
} from "three";

// Array to store placed models
const placedModels: Object3D[] = [];
const ROTATION_SPEED = 0.02;

export function createScene(renderer: WebGLRenderer) {
  const scene = new Scene();

  const camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.02,
    20
  );

  const planeMarker = createPlaneMarker();
  scene.add(planeMarker);

  let FBXModel: Object3D;
  let animationClip: AnimationClip | null = null;

  const fbxLoader = new FBXLoader();
  fbxLoader.load("../assets/models/Dancing.fbx", (fbx: Object3D) => {
    FBXModel = fbx;
    FBXModel.scale.set(0.001, 0.001, 0.001);

    // Store animation clip (assumes first animation)
    if ((fbx as any).animations && (fbx as any).animations.length > 0) {
      animationClip = (fbx as any).animations[0]; // Use the first animation
    }
  });

  const controller = renderer.xr.getController(0);
  scene.add(controller);

  const renderLoop = (timestamp: number, frame?: XRFrame) => {
    if (renderer.xr.isPresenting) {
      // Rotate all placed models
      placedModels.forEach((model) => {
        model.rotation.y += ROTATION_SPEED;
      });

      if (frame) {
        handleXRHitTest(
          renderer,
          frame,
          (hitPoseTransformed: Float32Array) => {
            if (hitPoseTransformed) {
              planeMarker.visible = true;
              planeMarker.matrix.fromArray(hitPoseTransformed);
            }
          },
          () => {
            planeMarker.visible = false;
          }
        );
      }
      renderer.render(scene, camera);
    }
  };

  controller.addEventListener("select", onSelect);

  function onSelect() {
    if (planeMarker.visible && FBXModel) {
      const model = FBXModel.clone();
      model.position.setFromMatrixPosition(planeMarker.matrix);

      const cameraPosition = camera.position.clone();
      cameraPosition.y = model.position.y;
      model.lookAt(cameraPosition);
      model.visible = true;

      // Apply only one frame of the animation manually
      if (animationClip) {
        applyAnimationFrame(model, animationClip, 0.5); // Change 0.5 to a specific time (in seconds)
      }

      scene.add(model);
      placedModels.push(model);
    }
  }

  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  renderer.setAnimationLoop(renderLoop);
}

// Function to manually apply a specific animation frame
// Function to manually apply a specific animation frame
function applyAnimationFrame(model: Object3D, animationClip: AnimationClip, frameNumber: number) {
  const fps = 30; // Assuming animation runs at 30 FPS (common for FBX)
  const totalFrames = fps * animationClip.duration; // Total frame count
  const frameTime = (frameNumber / totalFrames) * animationClip.duration; // Convert frame number to time
  
  const tracks = animationClip.tracks;

  tracks.forEach((track) => {
    const nodeName = track.name.split(".")[0]; // Extract bone or object name
    const object = model.getObjectByName(nodeName);
    
    if (!object) return; // Skip if object is not found

    // POSITION
    if (track.name.endsWith(".position")) {
      const positions = track.values;
      const frameIndex = Math.floor((positions.length / 3) * (frameTime / animationClip.duration));
      object.position.set(
        positions[frameIndex * 3],
        positions[frameIndex * 3 + 1],
        positions[frameIndex * 3 + 2]
      );
    }

    // ROTATION (QUATERNION)
    if (track.name.endsWith(".quaternion")) {
      const quaternions = track.values;
      const frameIndex = Math.floor((quaternions.length / 4) * (frameTime / animationClip.duration));
      object.quaternion.set(
        quaternions[frameIndex * 4],
        quaternions[frameIndex * 4 + 1],
        quaternions[frameIndex * 4 + 2],
        quaternions[frameIndex * 4 + 3]
      );
    }

    // SCALE (Prevent animation from overriding correct scale)
    if (track.name.endsWith(".scale")) {
      const scales = track.values;
      const frameIndex = Math.floor((scales.length / 3) * (frameTime / animationClip.duration));
      object.scale.set(
        scales[frameIndex * 3],
        scales[frameIndex * 3 + 1],
        scales[frameIndex * 3 + 2]
      );
    } else {
      // Reset scale to prevent animation from overriding it
      object.scale.set(0.01, 0.01, 0.01);
    }
  });

  // Ensure the whole model has the correct uniform scale
  model.scale.set(0.01, 0.01, 0.01); // Adjust this to match your desired scale

  console.log(`✅ Applied animation frame #${frameNumber} (Time: ${frameTime.toFixed(2)}s)`);
}
