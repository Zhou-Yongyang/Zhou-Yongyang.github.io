/**
 * @fileoverview Progressive rendering.
 */

/**
 * The THREE.js renderer object we use.
 * @type {?THREE.WebGLRenderer}
 */
let gRenderer = null;

/**
 * This scene renders the baked NeRF reconstruction using ray marching.
 * @type {?THREE.Scene}
 */
let gRayMarchScene = null;

/**
 * The perspective camera we use to view the scene.
 * @type {?THREE.PerspectiveCamera}
 */
let gCamera = null;
/**
 * A lower res orthographic camera used to kick off ray marching
 * with a full-screen render pass.
 * @type {?THREE.OrthographicCamera}
 */
let gLowResBlitCamera = null;


let gLowResTexture = null;

let gMeshRenderTarget = null;


/**
 * Sets up the state needed for progressive rendering.
 */
function setupProgressiveRendering(view) {
    
    // view.offsetWidth: framebuffer width
    // view.offsetHeight: framebuffer height

    //left, right, top, bottom, near, far
    //near = -10000, far = 10000 

    gLowResTexture = new THREE.WebGLRenderTarget(
        Math.trunc(view.offsetWidth),
        Math.trunc(view.offsetHeight), {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
            format: THREE.RGBAFormat
        });

    gMeshRenderTarget = new THREE.WebGLMultipleRenderTargets(view.offsetWidth, view.offsetHeight, 2);
    for (let i = 0, il = gMeshRenderTarget.texture.length; i < il; i++) {
        gMeshRenderTarget.texture[i].minFilter = THREE.NearestFilter;
        gMeshRenderTarget.texture[i].magFilter = THREE.NearestFilter;
        // gMeshRenderTarget.texture[i].type = THREE.FloatType;
        gMeshRenderTarget.texture[i].format = THREE.RGBAFormat;
    }
    gMeshRenderTarget.texture[0].name = 'diffuse';
    gMeshRenderTarget.texture[1].name = 'specular';
    gMeshRenderTarget.depthTexture = new THREE.DepthTexture();
    gMeshRenderTarget.depthTexture.format = THREE.DepthFormat;


    gLowResBlitCamera = new THREE.OrthographicCamera(
        Math.trunc(view.offsetWidth) / -2,
        Math.trunc(view.offsetWidth) / 2,
        Math.trunc(view.offsetHeight) / 2,
        Math.trunc(view.offsetHeight) / -2, -10000, 10000);
    gLowResBlitCamera.position.z = 100;
}


  function renderProgressively(cas_num) {
  const clip_T_camera = gCamera.projectionMatrix.clone();
  const camera_T_clip = clip_T_camera.clone().invert();
  const world_T_camera = gCamera.matrixWorld.clone();
  const world_T_clip = new THREE.Matrix4().multiplyMatrices(world_T_camera, camera_T_clip);
  const inv_world_T_clip = new THREE.Matrix4().multiplyMatrices(clip_T_camera, gCamera.matrixWorldInverse.clone());

  if (gRenderVosh !== 0) {
    gRenderer.setRenderTarget(gMeshRenderTarget);
    const displayMode = gDisplayMode - 0;
    for(let i=0;i<cas_num;i++){
      gSceneMeshInVosh.children[i].children[0].material.uniforms.displayMode.value = displayMode;
    }
    gRenderer.clear();
    gRenderer.render(gSceneMeshInVosh, gCamera);
  }

  gRenderer.setRenderTarget(null);
  const rayMarchMaterial = gRayMarchScene.children[0].material;
  rayMarchMaterial.uniforms.world_T_clip.value = world_T_clip;
  rayMarchMaterial.uniforms.inv_world_T_clip.value = inv_world_T_clip;
  const displayMode = gDisplayMode - 0;
  rayMarchMaterial.uniforms.displayMode.value = displayMode;
  rayMarchMaterial.uniforms.stepMult.value = gStepMult;

  if (gRenderVosh !== 0) {
    rayMarchMaterial.uniforms.tDepth.value = gMeshRenderTarget.depthTexture;
    rayMarchMaterial.uniforms.tDiff.value = gMeshRenderTarget.texture[0];
    rayMarchMaterial.uniforms.tSpec.value = gMeshRenderTarget.texture[1];
    rayMarchMaterial.uniforms.gRenderVosh.value = gRenderVosh;
  }

  gRenderer.clear();
  gRenderer.render(gRayMarchScene, gLowResBlitCamera);
}