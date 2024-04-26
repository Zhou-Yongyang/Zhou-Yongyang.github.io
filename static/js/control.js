
// const rendererURL = 'http://127.0.0.1:5500/renderer_vosh/renderer.html'
// const assetsURL = 'https://huggingface.co/zachzhang07/Vosh/resolve/main';
const mipnerf_assetsURL = 'https://huggingface.co/bit-zyy/Vosh-mipnerf/resolve/main';
const synthetic_assetsURL =  'https://huggingface.co/bit-zyy/Vosh-synthetic/resolve/main';
const rendererURL = "./renderer_vosh/renderer.html";
// const assetsURL = "../Assets";


//Mipnerf 360
// const rendererURL = 'https://huggingface.co/zachzhang07/Vosh/tree/main/'

function handleGoToSceneButtonClick(scenename, is_obj, cas_num){
    var voshVersionCode = document.querySelector("input[name=\"" + scenename + "-vosh\"]:checked").value;

    
    var voshQuality = document.querySelector("input[name=\"" + scenename + "-quality\"]:checked").value;
    var voshVersion = 'base';

    if(voshVersionCode==1){
        voshVersion = 'light';
    }
    gotoRenderer(scenename, voshVersion, voshQuality, is_obj, cas_num);
}



function gotoRenderer(sceneName, version ,quality, is_object, cas_num){
    var assetsURL = mipnerf_assetsURL;
    if(is_object === 'true'){
        assetsURL = synthetic_assetsURL;
    }
    console.log(assetsURL);
    var dirUrl = rendererURL + '?dir='+ assetsURL +'/' + sceneName + '_' + version + '/assets' + '&quality=' + quality + '&is_object=' + is_object + '&cas_num=' + cas_num;
    console.log(dirUrl);
    window.open(dirUrl, '_blank');
}