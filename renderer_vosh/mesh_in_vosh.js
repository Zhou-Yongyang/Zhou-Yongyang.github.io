const BASE = './'; // local

const voshVertexShader = `
varying vec2 vUv;

varying vec3 vOrigin;
varying vec3 vDirection;
uniform mat4 world_T_clip;

// varying vec3 rayDirection;

void main() {
    vUv = uv;
    
    vec4 positionClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = positionClip;
    
    positionClip /= positionClip.w;
    vec4 nearPoint = world_T_clip * vec4(positionClip.x, positionClip.y, -1.0, 1.0);
    vec4 farPoint = world_T_clip * vec4(positionClip.x, positionClip.y, 1.0, 1.0);
    
    vOrigin = nearPoint.xyz / nearPoint.w;
    vDirection = normalize(farPoint.xyz / farPoint.w - vOrigin);
    // rayDirection = (modelMatrix * vec4( position, 1.0 )).rgb - cameraPosition;

}
`;
const voshFragmentShaderHeader = `
precision highp float;

varying vec3 vOrigin;
varying vec3 vDirection;

uniform int displayMode;

uniform mat3 worldspaceROpengl;

uniform highp sampler2D weightsZero;
uniform highp sampler2D weightsOne;
uniform highp sampler2D weightsTwo;

varying vec2 vUv;
uniform highp sampler2D tDiffuse;
uniform highp sampler2D tSpecular;

`;


const voshFragmentShader = `
void main() {
    // See the DisplayMode enum at the top of this file.
    // Runs the full model with view dependence.
    const int DISPLAY_NORMAL = 0;
    // Disables the view-dependence network.
    const int DISPLAY_DIFFUSE = 1;
    // Only shows the latent features.
    const int DISPLAY_FEATURES = 2;
    // Only shows the view dependent component.
    const int DISPLAY_VIEW_DEPENDENT = 3;
    // Only shows the coarse block grid.
    const int DISPLAY_COARSE_GRID = 4;
  
    vec4 diffuse = texture( tDiffuse, vUv );
    if (displayMode == DISPLAY_COARSE_GRID) {
        gl_FragColor.rgb = vec3(0.0, 0.0, 0.0);
    } else if (displayMode == DISPLAY_DIFFUSE) { // diffuse
        gl_FragColor.rgb = diffuse.rgb;
    } else {
        vec4 specularFeature = texture( tSpecular, vUv );
        vec3 specular = vec3(0.0, 0.0, 0.0);
        if (displayMode == DISPLAY_VIEW_DEPENDENT){
            specular = evaluateNetwork(diffuse.rgb, specularFeature, 
                worldspaceROpengl * normalize(vDirection));
            gl_FragColor.rgb = specular.rgb;
        } else { // full
            gl_FragColor.rgb = clamp(diffuse.rgb + specular.rgb, 0.0, 1.0);
        }
    }
    gl_FragColor.a = 1.0;
}
`;

let container, params, progress, scene, camera, renderer, controls, stats;

// configs[name] = {
//     renderMode: parseInt(params.get(name + '.renderMode')) || 0, // rendering mode: 0 = normal, 1 = diffuse, 2 = specular.
//     pos_x: parseFloat(params.get(name + '.pos_x')) || 0,
//     pos_y: parseFloat(params.get(name + '.pos_y')) || 0,
//     pos_z: parseFloat(params.get(name + '.pos_z')) || 0,
//     scale_x: parseFloat(params.get(name + '.scale_x')) || 1,
//     scale_y: parseFloat(params.get(name + '.scale_y')) || 1,
//     scale_z: parseFloat(params.get(name + '.scale_z')) || 1,
//     rot_x: parseFloat(params.get(name + '.rot_x')) || 0,
//     rot_y: parseFloat(params.get(name + '.rot_y')) || 0,
//     rot_z: parseFloat(params.get(name + '.rot_z')) || 0,
// };

function loadMeshInVosh(dirUrl, viewDependenceFunctions, worldspaceROpengl,
                        weightsTexZero, weightsTexOne, weightsTexTwo, onlyMesh) {
    name = dirUrl + '/mesh';
    cas = 0;

    console.log("[INFO] loading:", name);
    let newmat = null;
    if (onlyMesh === false) {
        // load feature texture
        let tex0 = new THREE.TextureLoader().load(BASE + name + '/feat0_' + cas.toString() + '.jpg', object => {
            console.log('[INFO] loaded diffuse tex:', name + '/feat0_' + cas.toString() + '.jpg');
        });
        let tex1 = new THREE.TextureLoader().load(BASE + name + '/feat1_' + cas.toString() + '.jpg', object => {
            console.log('[INFO] loaded specular tex:', name + '/feat1_' + cas.toString() + '.jpg');
        });

        tex0.magFilter = THREE.NearestFilter;
        tex0.minFilter = THREE.NearestFilter;
        tex1.magFilter = THREE.NearestFilter;
        tex1.minFilter = THREE.NearestFilter;

        newmat = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            vertexShader: voshVertexShader,
            fragmentShader: voshFragmentShaderHeader + viewDependenceFunctions + voshFragmentShader,
            uniforms: {
                tDiffuse: {'value': tex0},
                tSpecular: {'value': tex1},
                weightsZero: {'value': weightsTexZero},
                weightsOne: {'value': weightsTexOne},
                weightsTwo: {'value': weightsTexTwo},
                displayMode: {'value': gDisplayMode - 0},
                worldspaceROpengl: {'value': worldspaceROpengl},
                world_T_clip: {'value': new THREE.Matrix4()},
            },
            // glslVersion: THREE.GLSL3
        });
    }

    // load obj
    return new Promise(function (resolve, reject) {
        new OBJLoader().load(BASE + name + '/mesh_' + cas.toString() + '.obj', object => {
            if (onlyMesh === false)
                object.traverse(function (child) {
                    if (child.type === 'Mesh') {
                        child.material = newmat;
                    }
                });
            // object.position.set(configs[name].pos_x, configs[name].pos_y, configs[name].pos_z);
            // object.scale.set(configs[name].scale_x, configs[name].scale_y, configs[name].scale_z);
            // object.rotation.set(configs[name].rot_x / 180 * Math.PI, configs[name].rot_y / 180 * Math.PI, configs[name].rot_z / 180 * Math.PI);
            // scene.add(object);
            object.position.set(0, 0, 0);
            object.scale.set(1, 1, 1);
            object.rotation.set(-Math.PI * 0.5, 0, -Math.PI * 0.5);

            console.log('[INFO] loaded mesh:', name + '/mesh_' + cas.toString() + '.obj');
            resolve(object);
        });
    });
}

function loadMeshOnly(dirUrl) {
    name = dirUrl + '/mesh';

    console.log("[INFO] loading:", name);
    // load obj
    return new Promise(function (resolve, reject) {
        new OBJLoader().load(BASE + name + '/mesh_0.obj', object => {
            object.position.set(0, 0, 0);
            object.scale.set(1, 1, 1);
            object.rotation.set(-Math.PI * 0.5, 0, -Math.PI * 0.5);

            console.log('[INFO] loaded mesh:', name + '/mesh_0.obj');
            resolve(object);
        });
    });
}