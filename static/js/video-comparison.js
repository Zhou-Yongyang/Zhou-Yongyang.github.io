// Written by Dor Verbin, October 2021
// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/

function playVids(videoId) {
  var videoMerge = document.getElementById(videoId + "Merge");
  var vid = document.getElementById(videoId);

  var position = 0.5;
  var vidWidth = vid.videoWidth / 2;
  var vidHeight = vid.videoHeight;

  var mergeContext = videoMerge.getContext("2d");


  if (vid.readyState > 3) {
    vid.play();

    function trackLocation(e) {
      // Normalize to [0, 1]
      bcr = videoMerge.getBoundingClientRect();
      position = ((e.pageX - bcr.x) / bcr.width);
    }
    function trackLocationTouch(e) {
      // Normalize to [0, 1]
      bcr = videoMerge.getBoundingClientRect();
      position = ((e.touches[0].pageX - bcr.x) / bcr.width);
    }

    videoMerge.addEventListener("mousemove", trackLocation, false);
    videoMerge.addEventListener("touchstart", trackLocationTouch, false);
    videoMerge.addEventListener("touchmove", trackLocationTouch, false);


    function drawLoop() {
      mergeContext.drawImage(vid, 0, 0, vidWidth, vidHeight, 0, 0, vidWidth, vidHeight);
      var colStart = (vidWidth * position).clamp(0.0, vidWidth);
      var colWidth = (vidWidth - (vidWidth * position)).clamp(0.0, vidWidth);
      mergeContext.drawImage(vid, colStart + vidWidth, 0, colWidth, vidHeight, colStart, 0, colWidth, vidHeight);
      requestAnimationFrame(drawLoop);


      var arrowLength = 0.05 * vidHeight;
      var arrowheadWidth = 0.004 * vidHeight;
      var arrowheadLength = 0.003 * vidHeight;
      var arrowPosY = vidHeight / 2;
      var arrowWidth = 0.002 * vidHeight;
      var currX = vidWidth * position;

      // // Draw circle
      mergeContext.arc(currX, arrowPosY, arrowLength*0.0, 0, Math.PI * 2, false);
      mergeContext.fillStyle = "#FFD79340";
      mergeContext.fill()
      mergeContext.strokeStyle = "#ffffff";
      mergeContext.stroke()

      // // Draw border
      mergeContext.beginPath();
      mergeContext.moveTo(vidWidth * position, 0);
      mergeContext.lineTo(vidWidth * position, vidHeight);
      mergeContext.closePath()
      mergeContext.strokeStyle = "#ffffff";
      mergeContext.lineWidth = 5;
      mergeContext.stroke();

      // // Draw arrow
      mergeContext.beginPath();
      mergeContext.moveTo(currX, arrowPosY - arrowWidth/2);

      // Move right until meeting arrow head
      mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowWidth/2);

      // Draw right arrow head
      mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowheadWidth/2);
      mergeContext.lineTo(currX + arrowLength/2, arrowPosY);
      mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowheadWidth/2);
      mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowWidth/2);

      // Go back to the left until meeting left arrow head
      mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowWidth/2);

      // Draw left arrow head
      mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowheadWidth/2);
      mergeContext.lineTo(currX - arrowLength/2, arrowPosY);
      mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY  - arrowheadWidth/2);
      mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY);

      mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY - arrowWidth/2);
      mergeContext.lineTo(currX, arrowPosY - arrowWidth/2);

      mergeContext.closePath();

      mergeContext.fillStyle = "#ffffff";
      mergeContext.fill();
    }
    requestAnimationFrame(drawLoop);
  }
}

Number.prototype.clamp = function (min, max) {
  return Math.min(Math.max(this, min), max);
};


function resizeAndPlay(element) {
  var cv = document.getElementById(element.id + "Merge");
  //   cv.width = element.videoWidth/2;
  cv.width = element.videoWidth / 2;
  cv.height = element.videoHeight;
  element.play();
  element.style.height = "0px";  // Hide video without stopping it

  playVids(element.id);
}



// Written by Dor Verbin, October 2021
// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/

function drawImg(canvas, image) {
  // 获取画布上下文
  var ctx = canvas.getContext('2d');

  // 在画布上绘制图片
  ctx.drawImage(image, 0, 0);

  // 在这里添加你的操作代码
  var position = 0.5;
  var imgWidth = image.width / 2;
  var imgHeight = image.height;
  var mergeContext = canvas.getContext("2d");
  function trackLocation(e) {
    // Normalize to [0, 1]
    bcr = canvas.getBoundingClientRect();
    position = ((e.pageX - bcr.x) / bcr.width);
  }
  function trackLocationTouch(e) {
    // Normalize to [0, 1]
    bcr = canvas.getBoundingClientRect();
    position = ((e.touches[0].pageX - bcr.x) / bcr.width);
  }

  canvas.addEventListener("mousemove", trackLocation, false);
  canvas.addEventListener("touchstart", trackLocationTouch, false);
  canvas.addEventListener("touchmove", trackLocationTouch, false);

  function drawLoop() {
    mergeContext.drawImage(image, 0, 0, imgWidth, imgHeight, 0, 0, imgWidth, imgHeight);
    var colStart = (imgWidth * position).clamp(0.0, imgWidth);
    var colWidth = (imgWidth - (imgWidth * position)).clamp(0.0, imgWidth);
    mergeContext.drawImage(image, colStart + imgWidth, 0, colWidth, imgHeight, colStart, 0, colWidth, imgHeight);
    requestAnimationFrame(drawLoop);

    var arrowLength = 0.05 * imgHeight;
    var arrowheadWidth = 0.004 * imgHeight;
    var arrowheadLength = 0.003 * imgHeight;
    var arrowPosY = imgHeight / 2;
    var arrowWidth = 0.002 * imgHeight;
    var currX = imgWidth * position;

    // Draw circle
    mergeContext.arc(currX, arrowPosY, arrowLength*0.00, 0, Math.PI * 2, false);
    mergeContext.fillStyle = "#FFD79340";
    mergeContext.fill()
    mergeContext.strokeStyle = "#00aaff";
    mergeContext.stroke()

    // Draw border
    mergeContext.beginPath();
    mergeContext.moveTo(imgWidth * position, 0);
    mergeContext.lineTo(imgWidth * position, imgHeight);
    mergeContext.closePath()
    mergeContext.strokeStyle = "#00aaff";
    mergeContext.lineWidth = 4;
    mergeContext.stroke();

    // // Draw arrow
    mergeContext.beginPath();
    mergeContext.moveTo(currX, arrowPosY - arrowWidth/2);

    // Move right until meeting arrow head
    mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowWidth/2);

    // Draw right arrow head
    mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowheadWidth/2);
    mergeContext.lineTo(currX + arrowLength/2, arrowPosY);
    mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowheadWidth/2);
    mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowWidth/2);

    // Go back to the left until meeting left arrow head
    mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowWidth/2);

    // Draw left arrow head
    mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowheadWidth/2);
    mergeContext.lineTo(currX - arrowLength/2, arrowPosY);
    mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY  - arrowheadWidth/2);
    mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY);

    mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY - arrowWidth/2);
    mergeContext.lineTo(currX, arrowPosY - arrowWidth/2);

    mergeContext.closePath();

    mergeContext.fillStyle = "#00aaff";
    mergeContext.fill();



    const fontSize = 30;
    const textPadding = 5;
    ctx.font = `${fontSize}px Times New Roman`;
    


    const botLeftText = 'Full';
    // ctx.fillStyle = 'lightblue';
    // ctx.fillRect(textPadding, textPadding, ctx.measureText(topLeftText).width + 2 * textPadding, fontSize + textPadding);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(botLeftText, textPadding, canvas.height - textPadding);


    const botRightText = 'Volume';
    // ctx.fillStyle = 'lightblue';
    // ctx.fillRect(canvas.width - ctx.measureText(topRightText).width - 2* textPadding, textPadding, ctx.measureText(topRightText).width + 2 * textPadding, fontSize + textPadding);
    ctx.fillStyle = "#000000";
    ctx.fillText(botRightText, canvas.width - ctx.measureText(botRightText).width - textPadding, canvas.height - textPadding);
  }

  requestAnimationFrame(drawLoop);

  Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
  };
}

Number.prototype.clamp = function (min, max) {
  return Math.min(Math.max(this, min), max);
};

function resizeAndDrawImg(elementID, pic_url) {
  // 获取画布元素和图片元素
  var canvas = document.getElementById(elementID);
  var image = new Image();
  image.src = pic_url;

  // 等待图片加载完成
  image.addEventListener('load', function () {
    // 设置画布尺寸与图片尺寸相同
    canvas.width = image.width / 2;
    canvas.height = image.height;
    drawImg(canvas, image);
  });
}