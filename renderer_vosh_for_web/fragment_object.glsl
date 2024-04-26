

vec2 rayAabbIntersection(vec3 aabbMin, vec3 aabbMax, vec3 origin,
vec3 invDirection) {
    vec3 t1 = (aabbMin - origin) * invDirection;
    vec3 t2 = (aabbMax - origin) * invDirection;
    vec3 tMin = min(t1, t2);
    vec3 tMax = max(t1, t2);
    return vec2(max(tMin.x, max(tMin.y, tMin.z)),
    min(tMax.x, min(tMax.y, tMax.z)));
}

#define SIGMOID(DTYPE) DTYPE sigmoid(DTYPE x) { return 1.0 / (1.0 + exp(-x)); }
SIGMOID(vec3)
    SIGMOID(vec4)

#define DENORMALIZE(DTYPE)\
DTYPE denormalize(DTYPE x, float min, float max) { \
 return min + x * (max - min);\
 }
DENORMALIZE(float)
    DENORMALIZE(vec3)
    DENORMALIZE(vec4)

float densityActivation(float x) { return exp(x - 1.0f); }

float densityToAlpha(float x, float stepSize) {
    return 1.0 - exp(-x * stepSize);
}

// Component-wise maximum
float max3 (vec3 v) {
    return max (max (v.x, v.y), v.z);
}

// Projective contraction
vec3 contract(vec3 x) {
    return x;
}

// Inverse projective contraction
vec3 inverseContract(vec3 z) {
    return z;
}

// A solution is invalid if it does not lie on the plane or is outside of 
// the bounding box
#define INF 1e25
#define SOLUTION_CHECK(T, P, AXIS)\
q = contract(o + T.AXIS * d);\
if (abs(q.AXIS - P.AXIS) > eps || any(lessThan(q, aabbMin - eps)) ||\
    any(greaterThan(q, aabbMax + eps))) { \
  T.AXIS = -INF;\
 }

// First checks wether the computed cancidate solutions are actually lieing on
// the bounding box. Then of all the valid intersections we return the one with
// the highest t-value (tMax).
// o: origin
// d: direction
// t0: candiate solutions for intersections with minimum YZ, XZ, XY planes
// t1: candiate solutions for intersections with maximum YZ, XZ, XY planes
// aabbMin: minimum of axis-aligned bounding bound
// aabbMin: maximum of axis-aligned bounding bound
float getTMax(vec3 o, vec3 d, vec3 t0, vec3 t1,
vec3 aabbMin, vec3 aabbMax){
    float eps = 1e-3;
    vec3 q;

    // Invalid solutions are set to -INF and therefore ignored.
    SOLUTION_CHECK(t0, aabbMin, x)
SOLUTION_CHECK(t0, aabbMin, y)
SOLUTION_CHECK(t0, aabbMin, z)
SOLUTION_CHECK(t1, aabbMax, x)
SOLUTION_CHECK(t1, aabbMax, y)
SOLUTION_CHECK(t1, aabbMax, z)
return max(max3(t0), max3(t1));
}

// The following functions compute intersections between rays and axis-aligned
// planes in contracted space.
// The seven functions correspond to seven cases assiociated with the seven
// quadrants present in projective contraction. The functions are derived 
// by solving contract(o+t*d) for t.
// o: origin
// d: direction
// p: x, y and z components define axis-aligned planes that the ray (o, d) is
//    intersected against
//    (x -> YZ-plane, y -> XZ-plane, z -> XY-plane)
vec3 h(vec3 o, vec3 d, vec3 p) {
    return (p - o) / d;
}



float findTraversedQuadrants(vec3 o, vec3 d, float near) {
    float listQuadrantTMax;;// Rays traverse up to 5 quadrants
    int numQuadrantsTraversed = 0;
    vec3 aabbMin;
    vec3 aabbMax;
    vec3 t0;
    vec3 t1;
    float tMax;

    // core region
    aabbMin = vec3(-2.0, -2.0, -2.0);
    aabbMax = vec3(2.0, 2.0, 2.0);
    t0 = h(o, d, aabbMin);
    t1 = h(o, d, aabbMax);
    tMax = getTMax(o, d, t0, t1, aabbMin, aabbMax);

    // We discard intersections with quadrants that lie behind the camera
    // (tMax < near). When a quadrant is not traversed, getTMax returns -INF
    // and therefore this check also discards these values.
    if (tMax >= near) {
        listQuadrantTMax = tMax;
    }
    return listQuadrantTMax;
}



struct QuadrantSetupResults {
    vec3 oContracted;// ray origin in contracted space
    vec3 dContracted;// ray direction in contracted space
    vec2 quadrantTMinMaxContracted;// contraction-space t-values at which the ray
// enters or exits the current quadrant
};

// This function is called whenever we enter a new quadrant. We compute
// origin and direction of the ray in contracted space and compute for which
// t-value (in contracted space) the ray enters/exits the quadrant
// tP and tQ are two world-space t-values that must lie within th entered
// quadrant, i.e. contract(o+tP*d) and  contract(o+tQ*d) must lie within the
// entered quadrant.
QuadrantSetupResults quadrantSetup(vec3 o, vec3 d, float tP, float tQ) {
    QuadrantSetupResults r;

    // Which quadrant did we enter?
    vec3 xP = o + tP * d;
    // vec3 xAbs = abs(xP);
    // float xMax = max3(xAbs);

    // Get the AABB of the quadrant the point x is in
    // Non-squash case, central quadrant:
    // vec3 aabbMin = vec3(-1.0, -1.0, -1.0);
    // vec3 aabbMax = vec3(1.0, 1.0, 1.0);
    vec3 aabbMin = vec3(-2.0, -2.0, -2.0);
    vec3 aabbMax = vec3(2.0, 2.0, 2.0);


    // Estimate the direction of the ray in contracted space by computing the
    // vector difference with two different t-values that are guanteed to
    // correspond to points within the current quadrant
    r.oContracted = contract(xP);
    vec3 zQ = contract(o + tQ * d);
    r.dContracted = normalize(zQ - r.oContracted);

    r.quadrantTMinMaxContracted = rayAabbIntersection(aabbMin, aabbMax, r.oContracted, 1.0 / r.dContracted);
    return r;
}


struct OccupancyQueryResults {
    bool inEmptySpace;
    float tBlockMax;
};

OccupancyQueryResults queryOccupancyGrid(
vec3 z, vec3 minPosition, vec3 oContracted,
vec3 invDContracted, highp sampler3D occupancyGrid,
float voxelSizeOccupancy, vec3 gridSizeOccupancy) {
    OccupancyQueryResults r;
    vec3 posOccupancy;
    vec3 blockMin;
    vec3 blockMax;
    float occupancy;
    posOccupancy = (z - minPosition) / voxelSizeOccupancy;
    blockMin = floor(posOccupancy);
    blockMax = floor(posOccupancy) + 1.0;
    occupancy = texture(
    occupancyGrid,
    (blockMin + blockMax) * 0.5 / gridSizeOccupancy
    ).r;
    blockMin = blockMin * voxelSizeOccupancy + minPosition;
    blockMax = blockMax * voxelSizeOccupancy + minPosition;
    r.inEmptySpace = occupancy == 0.0;
    r.tBlockMax = rayAabbIntersection(blockMin, blockMax, oContracted, invDContracted).y;
    return r;
}


#define QUERY_OCCUPANCY_GRID(tBlockMax_L, occupancyGrid, voxelSizeOccupancy, gridSizeOccupancy)\
if (tContracted > tBlockMax_L) { \
  occupancyQueryResults =\
    queryOccupancyGrid(z, minPosition, r.oContracted, invDContracted, \
                        occupancyGrid, voxelSizeOccupancy, gridSizeOccupancy);\
  tBlockMax_L = occupancyQueryResults.tBlockMax;\
  if (occupancyQueryResults.inEmptySpace) { \
    tContracted = max(tContracted, tBlockMax_L) + 0.5 * stepSizeContracted;\
 continue;\
 }\
 }

#include <packing>
float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    fragCoordZ = (fragCoordZ + 1.0) / 2.0;
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);// near和far还原真实的深度值
    return viewZ;
    // return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);  //真实的深度值转0-1
}

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
    // Only shows the rendered mesh
    const int DISPLAY_MESH = 5;
    // Only shows the rendered volume
    const int DISPLAY_VOLUME = 6;
    // Only shows the rendered mesh and grid
    const int DISPLAY_MESH_AND_GRID = 7;


    
    bool empty = true;
    int use_displayMode = displayMode;
    // float w = 1080.0 / 1920.0;
    // if(gl_FragCoord.x * w <= gl_FragCoord.y){
    //     use_displayMode = DISPLAY_NORMAL;
    // }
    
    // Set up the ray parameters in world space..
    float nearWorld = nearPlane;
    
    vec3 originWorld = vOrigin;
    vec3 directionWorld = normalize(vDirection);

    // 1.[ndc depth compare mode]
    float mesh_screen_depth = texture2D(tDepth, vUv).x;
    float mesh_ndc_depth = (mesh_screen_depth-0.5)*2.0;

    float visibility = 1.0;
    vec3 accumulatedColor = vec3(0.0, 0.0, 0.0);
    vec4 accumulatedFeatures = vec4(0.0, 0.0, 0.0, 0.0);

    #ifdef HAS_VOL
    #ifdef USE_SPARSE_GRID
        ivec3 iGridSize = ivec3(round(sparseGridGridSize));     //1024
        int iBlockSize = int(round(dataBlockSize));             //8
        ivec3 iBlockGridBlocks = (iGridSize + iBlockSize - 1) / iBlockSize; //(8+1024-1) / 8
        ivec3 iBlockGridSize = iBlockGridBlocks * iBlockSize;               //1031
        vec3 blockGridSize = vec3(iBlockGridSize);                          //1032
    #endif

    // float[5] listQuadrantTMax = findTraversedQuadrants(originWorld,
    // directionWorld, nearWorld);
    float listQuadrantTMax = findTraversedQuadrants(originWorld,
    directionWorld, nearWorld);

    float tP = nearWorld;
    // float tQ = mix(nearWorld, listQuadrantTMax[0], 0.5);
    float tQ = mix(nearWorld, listQuadrantTMax, 0.5);

    QuadrantSetupResults r = quadrantSetup(originWorld, directionWorld, tP, tQ);
    // float tContracted = 0.0;
    float tContracted = r.quadrantTMinMaxContracted.x;
    int quadrantIndex = 1;

    float tBlockMax_L0 = -INF;
    float tBlockMax_L1 = -INF;
    float tBlockMax_L2 = -INF;
    float tBlockMax_L3 = -INF;
    float tBlockMax_L4 = -INF;


    int step_ray = 0;

    #ifdef USE_TRIPLANE
        #define GRID_SIZE triplaneGridSize
        #define VOXEL_SIZE triplaneVoxelSize
    #else
        #define GRID_SIZE sparseGridGridSize
        #define VOXEL_SIZE sparseGridVoxelSize
    #endif

    int maxStep = stepMult * int(ceil(length(GRID_SIZE)));
    float origStepSizeContracted = VOXEL_SIZE / float(stepMult);

    int maxRealStep = 1024;
    int realStep = 0;


    if(use_displayMode != DISPLAY_MESH){
        while (step_ray < maxStep && visibility > 1.0 / 255.0) {
            step_ray++;
            #ifdef LARGER_STEPS_WHEN_OCCLUDED
                float stepSizeContracted = origStepSizeContracted * mix(8.0, 1.0, min(1.0, visibility / 0.66));
            #else
                float stepSizeContracted = origStepSizeContracted;
            #endif

            // check if the ray is exiting the current quadrant

            if (tContracted > r.quadrantTMinMaxContracted.y) {
                vec3 z = r.oContracted + r.quadrantTMinMaxContracted.y * r.dContracted;

                // Check if we hit an outer wall
                // If so, we can terminate the ray as the ray won't enter another quadrant
                // if (max3(abs(z)) >= 2.0 - 1e-3) break;

                if(max3(abs(z)) >= 2.0 - 1e-3 && use_displayMode == DISPLAY_COARSE_GRID){
                    break;
                }


                if (max3(abs(z)) >= 2.0 - 1e-3 && mesh_ndc_depth == 1.0){
                    break;
                }
                else if (max3(abs(z)) >= 2.0 - 1e-3 && mesh_ndc_depth != 1.0){
                    empty = false;
                    accumulatedColor += visibility * texture(tDiff, vUv).rgb;
                    accumulatedFeatures += visibility * texture(tSpec, vUv).rgba;
                    visibility = 0.0;
                    break;
                }
            }


            // Position of current sample in contracted space
            vec3 z = r.oContracted + tContracted * r.dContracted;

            // transfom z to viewport space [same to depth]
            vec3 wz = inverseContract(z);
            vec4 clipz = inv_world_T_clip * vec4(wz, 1.0);
            float mesh_clip_depth = mesh_ndc_depth * clipz.w;


            // !Display mode
            if(clipz.z >= mesh_clip_depth && mesh_clip_depth < clipz.w){
                empty = false;
                if(use_displayMode == DISPLAY_VOLUME){
                    accumulatedColor += visibility * vec3(1.0, 1.0, 1.0);
                    accumulatedFeatures += visibility * vec4(0.0, 0.0, 0.0, 1.0);
                    visibility = 0.0;
                    continue;
                }
                else{
                    if (use_displayMode != DISPLAY_VIEW_DEPENDENT && use_displayMode != DISPLAY_COARSE_GRID){
                        accumulatedColor += visibility * texture(tDiff, vUv).rgb;
                    }
                    if (use_displayMode != DISPLAY_DIFFUSE && use_displayMode != DISPLAY_COARSE_GRID){
                         accumulatedFeatures += visibility * texture(tSpec, vUv).rgba;
                    }

                    if(use_displayMode != DISPLAY_COARSE_GRID){
                        visibility = 0.0;
                        continue;
                    }
                }
            }


            // !Speed test mode
            // if(clipz.z >= mesh_clip_depth && mesh_clip_depth < clipz.w && use_displayMode != DISPLAY_VOLUME){
            //     empty = false;
            //     accumulatedColor += visibility * texture(tDiff, vUv).rgb;
            //     accumulatedFeatures += visibility * texture(tSpec, vUv).rgba;
            //     visibility = 0.0;
            //     continue;
            // }

            // Hierarchical empty space skipping
            vec3 invDContracted = 1.0 / r.dContracted;
            OccupancyQueryResults occupancyQueryResults;
            QUERY_OCCUPANCY_GRID(tBlockMax_L0, occupancyGrid_L0, voxelSizeOccupancy_L0, gridSizeOccupancy_L0)
            QUERY_OCCUPANCY_GRID(tBlockMax_L1, occupancyGrid_L1, voxelSizeOccupancy_L1, gridSizeOccupancy_L1)
            QUERY_OCCUPANCY_GRID(tBlockMax_L2, occupancyGrid_L2, voxelSizeOccupancy_L2, gridSizeOccupancy_L2)
            QUERY_OCCUPANCY_GRID(tBlockMax_L3, occupancyGrid_L3, voxelSizeOccupancy_L3, gridSizeOccupancy_L3)
            QUERY_OCCUPANCY_GRID(tBlockMax_L4, occupancyGrid_L4, voxelSizeOccupancy_L4, gridSizeOccupancy_L4)


            empty = false;
            // We are in occupied space
            // compute grid positions for the sparse 3D grid and on the triplane planes
            #ifdef USE_SPARSE_GRID
                vec3 posSparseGrid = (z - minPosition) / sparseGridVoxelSize - 0.5;
            #endif
            #ifdef USE_TRIPLANE
                vec3 posTriplaneGrid = (z - minPosition) / triplaneVoxelSize;
            #endif

            // Calculate where the next sample would land in order to compute the
            // step size in world space (required for density-to-alpha conversion)
            // make sure not to shoot ouf the current quadrant
            float tContractedNext = min(tContracted + stepSizeContracted, r.quadrantTMinMaxContracted.y);
            // Position of the next sample in contracted space
            vec3 zNext = r.oContracted + tContractedNext * r.dContracted;
            float stepSizeWorld = distance(inverseContract(zNext), inverseContract(z));

        #ifdef USE_SPARSE_GRID
            vec3 atlasBlockMin =
                floor(posSparseGrid / dataBlockSize) * dataBlockSize;
            vec3 atlasBlockMax = atlasBlockMin + dataBlockSize;
            vec3 atlasBlockIndex =
                255.0 * texture(sparseGridBlockIndices, (atlasBlockMin + atlasBlockMax) /
                                          (2.0 * blockGridSize)).xyz;

            if (atlasBlockIndex.x <= 254.0) {
                vec3 posAtlas = clamp(posSparseGrid - atlasBlockMin, 0.0, dataBlockSize);

                posAtlas += atlasBlockIndex * (dataBlockSize + 1.0);
                posAtlas += 0.5;
                vec3 atlasUvw = posAtlas / atlasSize;

            if (use_displayMode == DISPLAY_COARSE_GRID || use_displayMode == DISPLAY_MESH_AND_GRID) {
                // Half-pixel apron
                accumulatedColor = atlasBlockIndex * (dataBlockSize + 1.0) / atlasSize;
                accumulatedFeatures.rgb = atlasBlockIndex * (dataBlockSize + 1.0) / atlasSize;
                accumulatedFeatures.a = 1.0;
                visibility = 0.0;
                continue;
            }
        #endif

         // First fetch all densities
        #ifdef USE_SPARSE_GRID
            float density = texture(sparseGridDensity, atlasUvw).x;
            density = denormalize(density, rangeDensityMin, rangeDensityMax);
        #else
            float density = 0.0;
        #endif

        #ifdef USE_TRIPLANE
            vec3[3] planeUv;
            planeUv[0] = vec3(posTriplaneGrid.yz / triplaneGridSize, 0.0);
            planeUv[1] = vec3(posTriplaneGrid.xz / triplaneGridSize, 1.0);
            planeUv[2] = vec3(posTriplaneGrid.xy / triplaneGridSize, 2.0);

            float densityTemp;
            densityTemp = texture(planeDensity, planeUv[0]).x;
            densityTemp = denormalize(densityTemp, rangeDensityMin, rangeDensityMax);
            density += densityTemp;

            densityTemp = texture(planeDensity, planeUv[1]).x;
            densityTemp = denormalize(densityTemp, rangeDensityMin, rangeDensityMax);
            density += densityTemp;

            densityTemp = texture(planeDensity, planeUv[2]).x;
            densityTemp = denormalize(densityTemp, rangeDensityMin, rangeDensityMax);
            density += densityTemp;
        #endif

        // Activate density and convert density to alpha.
        density = densityActivation(density);
        float alpha = densityToAlpha(density, stepSizeWorld);

        // Only fetch RGBFFFF (7 bytes) if alpha is non-negligible to save bandwidth
        if (alpha > 0.5 / 255.0) {
            #ifdef USE_SPARSE_GRID
                vec3 rgb = texture(sparseGridRgb, atlasUvw).rgb;
                rgb = denormalize(rgb, rangeFeaturesMin, rangeFeaturesMax);
            #else
                vec3 rgb = vec3(0.0, 0.0, 0.0);
            #endif

            #ifdef USE_TRIPLANE
                vec3 rgbTemp;
                rgbTemp = texture(planeRgb, planeUv[0]).rgb;
                rgbTemp = denormalize(rgbTemp.rgb, rangeFeaturesMin, rangeFeaturesMax);
                rgb += rgbTemp;

                rgbTemp = texture(planeRgb, planeUv[1]).rgb;
                rgbTemp = denormalize(rgbTemp.rgb, rangeFeaturesMin, rangeFeaturesMax);
                rgb += rgbTemp;

                rgbTemp = texture(planeRgb, planeUv[2]).rgb;
                rgbTemp = denormalize(rgbTemp.rgb, rangeFeaturesMin, rangeFeaturesMax);
                rgb += rgbTemp;
            #endif

            rgb = sigmoid(rgb);// Apply activation function

            if (use_displayMode != DISPLAY_DIFFUSE) {
                vec4 features = vec4(0.0, 0.0, 0.0, 0.0);
                #ifdef USE_SPARSE_GRID
                    features = texture(sparseGridFeatures, atlasUvw);
                    features = denormalize(features, rangeFeaturesMin, rangeFeaturesMax);
                #endif

                #ifdef USE_TRIPLANE
                    vec4 featuresTemp;
                    featuresTemp = texture(planeFeatures, planeUv[0]);
                    features += denormalize(featuresTemp, rangeFeaturesMin, rangeFeaturesMax);

                    featuresTemp = texture(planeFeatures, planeUv[1]);
                    features += denormalize(featuresTemp, rangeFeaturesMin, rangeFeaturesMax);

                    featuresTemp = texture(planeFeatures, planeUv[2]);
                    features += denormalize(featuresTemp, rangeFeaturesMin, rangeFeaturesMax);
                #endif
                    features = sigmoid(features);
                    accumulatedFeatures += visibility * alpha * features;
            }
            accumulatedColor += visibility * alpha * rgb;
            visibility *= 1.0 - alpha;
        }
        #ifdef USE_SPARSE_GRID
            }// end of check: atlasBlockIndex.x <= 254.0
        #endif

            tContracted += stepSizeContracted;
        }
    }else{
        empty = false;
        accumulatedColor = texture(tDiff, vUv).rgb;
        accumulatedFeatures = texture(tSpec, vUv).rgba;
        visibility = 0.0;
    }
    #endif

    #ifndef HAS_VOL
    if(use_displayMode != DISPLAY_MESH){
            if(mesh_ndc_depth < 1.0 && use_displayMode != DISPLAY_VOLUME){
                empty = false;
                accumulatedColor +=  texture(tDiff, vUv).rgb;
                accumulatedFeatures += texture(tSpec, vUv).rgba;
                visibility = 0.0;
            }
    }else{
        empty = false;
        accumulatedColor = texture(tDiff, vUv).rgb;
        accumulatedFeatures = texture(tSpec, vUv).rgba;
        visibility = 0.0;
    }
    #endif


    if (use_displayMode == DISPLAY_VIEW_DEPENDENT) {
        accumulatedColor = vec3(0.0, 0.0, 0.0) * visibility;
    } else if (use_displayMode == DISPLAY_FEATURES) {
        accumulatedColor = accumulatedFeatures.rgb;
    }

    // Composite on white background
    accumulatedColor = vec3(1.0, 1.0, 1.0) * visibility + accumulatedColor;
    
    if (mesh_ndc_depth == 1.0 && (DISPLAY_MESH == use_displayMode)){
        accumulatedColor = vec3(1.0, 1.0, 1.0);
    }


    // Run view-dependency network
    // if ((use_displayMode == DISPLAY_NORMAL ||
    // use_displayMode == DISPLAY_VIEW_DEPENDENT ||
    // use_displayMode == DISPLAY_MESH ||
    // use_displayMode == DISPLAY_VOLUME)) {
    //     accumulatedColor += evaluateNetwork(accumulatedColor, accumulatedFeatures, worldspaceROpengl * directionWorld);
    // }

    if ((use_displayMode == DISPLAY_NORMAL ||
    use_displayMode == DISPLAY_VIEW_DEPENDENT ||
    use_displayMode == DISPLAY_MESH ||
    use_displayMode == DISPLAY_VOLUME) && !empty) {
        accumulatedColor += evaluateNetwork(accumulatedColor, accumulatedFeatures, worldspaceROpengl * directionWorld);
    }


    gl_FragColor = vec4(accumulatedColor, 1.0);
} 