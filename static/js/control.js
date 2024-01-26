
// const rendererURL = 'http://127.0.0.1:5500/renderer_vosh/renderer.html'
const assetsURL = 'https://huggingface.co/zachzhang07/Vosh/tree/main';
const rendererURL = "https://zhou-yongyang.github.io/renderer_vosh/renderer.html";

// const rendererURL = 'https://huggingface.co/zachzhang07/Vosh/tree/main/'
function handleGardenButtonClick(){
    var voshVersionCode = document.querySelector('input[name="garden-vosh"]:checked').value;
    
    var voshQuality = document.querySelector('input[name="garden-quality"]:checked').value;
    var sceneName = 'garden';
    var voshVersion = 'base';

    if(voshVersionCode==1){
        voshVersion = 'light';
    }
    gotoRenderer(sceneName, voshVersion, voshQuality);
}

function handleStumpButtonClick(){
    var voshVersionCode = document.querySelector('input[name="stump-vosh"]:checked').value;
    
    var voshQuality = document.querySelector('input[name="stump-quality"]:checked').value;
    var sceneName = 'stump';
    var voshVersion = 'base';

    if(voshVersionCode==1){
        voshVersion = 'light';
    }
    gotoRenderer(sceneName, voshVersion, voshQuality);
}

function handleBicycleButtonClick(){
    var voshVersionCode = document.querySelector('input[name="bicycle-vosh"]:checked').value;
    
    var voshQuality = document.querySelector('input[name="bicycle-quality"]:checked').value;
    var sceneName = 'bicycle';
    var voshVersion = 'base';

    if(voshVersionCode==1){
        voshVersion = 'light';
    }
    gotoRenderer(sceneName, voshVersion, voshQuality);
}

function gotoRenderer(sceneName, version ,quality){
    var dirUrl = rendererURL + '?dir='+ assetsURL +'/' + sceneName + '_vosh_' + version + '/assets' + '&quality=' + quality;
    console.log(dirUrl);
    window.open(dirUrl, '_blank');
}