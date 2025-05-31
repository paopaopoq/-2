let video;
let handpose;
let predictions = [];

let tools = [
  {
    name: "地球儀",
    x: 150,
    y: 400,
    w: 80,
    h: 80,
    color: [100, 180, 255],
    target: 0, // 對應教學區塊 index
    dragging: false,
    offsetX: 0,
    offsetY: 0,
    placed: false
  },
  {
    name: "電路板",
    x: 350,
    y: 400,
    w: 80,
    h: 80,
    color: [0, 200, 120],
    target: 1,
    dragging: false,
    offsetX: 0,
    offsetY: 0,
    placed: false
  }
];

let targets = [
  {
    name: "地理教學區",
    x: 150,
    y: 120,
    w: 120,
    h: 120,
    color: [255, 240, 180]
  },
  {
    name: "科技教學區",
    x: 350,
    y: 120,
    w: 120,
    h: 120,
    color: [255, 220, 240]
  }
];

let score = 0;
let message = "請用食指指尖拖曳教具到正確教學區！";
let draggingTool = null;

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handpose = ml5.handpose(video, () => {
    console.log("Handpose model ready!");
  });
  handpose.on("predict", results => {
    predictions = results;
  });
}

function draw() {
  background(240);
  image(video, 0, 0, width, height);

  // 畫教學區塊
  for (let t of targets) {
    fill(t.color);
    stroke(120);
    rect(t.x - t.w / 2, t.y - t.h / 2, t.w, t.h, 20);
    fill(60);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(18);
    text(t.name, t.x, t.y + t.h / 2 + 18);
  }

  // 處理手勢與拖曳
  if (predictions.length > 0) {
    let hand = predictions[0];
    let [hx, hy] = hand.landmarks[8]; // 食指指尖

    // 畫出食指指尖
    fill(255, 0, 0, 180);
    noStroke();
    ellipse(hx, hy, 24, 24);

    // 如果沒有正在拖曳，檢查是否碰到教具
    if (!draggingTool) {
      for (let tool of tools) {
        if (!tool.placed && isInside(hx, hy, tool)) {
          tool.dragging = true;
          tool.offsetX = tool.x - hx;
          tool.offsetY = tool.y - hy;
          draggingTool = tool;
          break;
        }
      }
    }

    // 拖曳教具
    if (draggingTool && !draggingTool.placed) {
      draggingTool.x = hx + draggingTool.offsetX;
      draggingTool.y = hy + draggingTool.offsetY;

      // 如果食指離開教具一段距離就放下
      if (dist(hx, hy, draggingTool.x, draggingTool.y) > 60) {
        draggingTool.dragging = false;
        draggingTool = null;
      }
    }

    // 放下教具時檢查是否放到正確區塊
    if (draggingTool && !draggingTool.placed) {
      for (let i = 0; i < targets.length; i++) {
        let t = targets[i];
        if (
          isInside(draggingTool.x, draggingTool.y, t) &&
          draggingTool.target === i
        ) {
          draggingTool.placed = true;
          draggingTool.x = t.x;
          draggingTool.y = t.y;
          score++;
          message = "配對成功！";
          setTimeout(() => {
            message = "請繼續拖曳其他教具。";
          }, 1000);
          draggingTool.dragging = false;
          draggingTool = null;
        } else if (
          isInside(draggingTool.x, draggingTool.y, t) &&
          draggingTool.target !== i
        ) {
          message = "放錯區域，請再試一次！";
          setTimeout(() => {
            message = "請用食指指尖拖曳教具到正確教學區！";
          }, 1000);
        }
      }
    }
  } else {
    // 沒有偵測到手時，結束拖曳
    if (draggingTool) {
      draggingTool.dragging = false;
      draggingTool = null;
    }
  }

  // 畫教具
  for (let tool of tools) {
    push();
    translate(tool.x, tool.y);
    fill(tool.color);
    stroke(80);
    if (tool.name === "地球儀") {
      ellipse(0, 0, tool.w, tool.h);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(16);
      text(tool.name, 0, 0);
    } else if (tool.name === "電路板") {
      rectMode(CENTER);
      rect(0, 0, tool.w, tool.h, 12);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(16);
      text(tool.name, 0, 0);
    }
    pop();
  }

  // 顯示分數與提示
  fill(0);
  noStroke();
  textSize(22);
  textAlign(LEFT, TOP);
  text("分數：" + score, 20, 20);
  textSize(18);
  textAlign(CENTER, TOP);
  fill(message === "配對成功！" ? "green" : "red");
  text(message, width / 2, 20);
}

// 判斷點是否在教具或區塊內
function isInside(x, y, obj) {
  if (obj.name === "地球儀") {
    return dist(x, y, obj.x, obj.y) < obj.w / 2;
  } else {
    return (
      x > obj.x - obj.w / 2 &&
      x < obj.x + obj.w / 2 &&
      y > obj.y - obj.h / 2 &&
      y < obj.y + obj.h / 2
    );
  }
}
