/**
 * @fileoverview Defines default camera pose for each scene.
 */

/**
 *  Set initial camera pose depending on the scene.
 */
function setupInitialCameraPose(dirUrl) {
    initialPoses =
        {
          'bicycle': {
            'position': [-0.24357632065559817,-0.04154231118630643,-0.7796562641669662],
            'lookat': [0.14010597615248718,-0.07601530721727329,0.14316522869783266]
          },
          'garden': {
            'position': [0.7020762992835078,-0.22881465648588267,0.490896980072982],
            'lookat': [-0.03394992551486875,-0.423942571454784,-0.15732404183111037],
          },
          'stump': {
            'position': [-0.8360010283302459,0.007098839803907671,-0.529239419368186],
            'lookat': [0.058681300659995106,0.018280983721879474,-0.08267644523673034],
          },
          'flowerbed': {
            'position':
                [-0.02402388218043944, 0.11825367482140309, 0.907525093384825],
            'lookat': [
              0.016306507293821822, -0.15676691106539536, -0.016192691610482132
            ],
          },
          'treehill': {
            'position':
                [-0.70994804046872, 0.19435986647308223, 0.30833533637897453],
            'lookat': [
              0.06327294888291587, -0.13299740290200024, 0.0037554887097183934
            ],
          },

          'kitchenlego': {
            'position':
                [-0.5872864419408019, 0.05633623000443683, -0.9472239198227385],
            'lookat':
                [0.07177184299031553, -0.4020277194862108, 0.04850453170234236],
          },
          'fulllivingroom': {
            'position':
                [1.1539572663654272, -0.006785278327404387, -0.0972986385811351],
            'lookat':
                [-0.05581392405861873, -0.40202760746449473, 0.02985343723310108],
          },
          'kitchencounter': {
            'position':
                [-0.7006764413546107, 0.2255633917824672, -0.46941182833135847],
            'lookat':
                [0.13197415755218864, -0.4020278046227117, 0.09221809216932579],
          },
          'officebonsai': {
            'position':
                [-0.4773314920559294, 0.05409730603092788, 1.014304107335418],
            'lookat': [
              0.11970974858222336, -0.40426664345968033, -0.019801655674420764
            ],
          },
          'default': {
            'position':[1.5,1.5,1.5],
              'lookat': [0.0, 0.0, 0.0],
          },
        }
  
    /**
     * Quick helper function to set the lookat point regardless of camera
     * controls.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    function cameraLookAt(x, y, z) {
      if (gOrbitControls) {
        gOrbitControls.target.x = x;
        gOrbitControls.target.y = y;
        gOrbitControls.target.z = z;
      }
      if (gPointerLockControls) {
        gCamera.lookAt(x, y, z);
      }
    }
  
    function setCameraPose(d) {
      gCamera.position.x = d['position'][0];
      gCamera.position.y = d['position'][1];
      gCamera.position.z = d['position'][2];
      cameraLookAt(d['lookat'][0], d['lookat'][1], d['lookat'][2]);
    }
  
    setCameraPose(initialPoses['default']);
    for (let sceneName in initialPoses) {
      if (dirUrl.includes(sceneName)) {
        setCameraPose(initialPoses[sceneName]);
        break;
      }
    }
    gCamera.updateProjectionMatrix();
    gCamera.updateMatrixWorld();
  }