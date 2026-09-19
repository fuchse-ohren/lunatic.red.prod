/* index.js */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// State
let baseImage = null;
let tool = "rect"; // rect, line, arrow, blur
let isDrawing = false;
let startX = 0,
  startY = 0,
  endX = 0,
  endY = 0;

// Annotation Dragging State
let isDraggingAnnot = false;
let draggingAnnotIndex = -1;
let tempShapes = [];

// History
let history = [[]];
let historyIndex = 0;
const MAX_HISTORY = 10;

// UI Elements
const elements = {
  fgColor: document.getElementById("color-fg"),
  bgColor: document.getElementById("color-bg"),
  annotRect: document.getElementById("annot-rect"),
  annotLine: document.getElementById("annot-line"),
  annotArrow: document.getElementById("annot-arrow"),
  annotBlur: document.getElementById("annot-blur"),
  fontFamily: document.getElementById("font-family"),
  annotSize: document.getElementById("annot-size"),
  btnUndo: document.getElementById("btn-undo"),
  btnRedo: document.getElementById("btn-redo"),
};

const circledNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳"];

function getCircledNumber(index) {
  if (index < 20) return circledNumbers[index];
  return `(${index + 1})`;
}

// --- Image Loading ---
function loadImage(src) {
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    baseImage = img;
    history = [[]];
    historyIndex = 0;
    updateButtons();
    render();
  };
  img.src = src;
}

// --- History Management ---
function saveState(shapes) {
  const shapesCopy = JSON.parse(JSON.stringify(shapes));
  history = history.slice(0, historyIndex + 1);
  history.push(shapesCopy);
  if (history.length > MAX_HISTORY + 1) {
    history.shift();
  } else {
    historyIndex++;
  }
  updateButtons();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    render();
    updateButtons();
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    render();
    updateButtons();
  }
}

function updateButtons() {
  elements.btnUndo.disabled = historyIndex === 0;
  elements.btnRedo.disabled = historyIndex === history.length - 1;
}

// --- Annotation Positioning ---
function getInitialAnnotPos(shape) {
  const size = parseInt(shape.annotSize);
  let minX = Math.min(shape.startX, shape.endX);
  let minY = Math.min(shape.startY, shape.endY);
  let maxX = Math.max(shape.startX, shape.endX);
  let maxY = Math.max(shape.startY, shape.endY);

  const offset = size + 5;
  const candidates = [
    { x: minX - offset, y: minY - offset },
    { x: maxX + offset, y: minY - offset },
    { x: minX - offset, y: maxY + offset },
    { x: maxX + offset, y: maxY + offset },
    { x: minX + (maxX - minX) / 2, y: minY - offset },
  ];

  for (let c of candidates) {
    if (c.x - size >= 0 && c.y - size >= 0 && c.x + size <= canvas.width && c.y + size <= canvas.height) {
      return { x: c.x, y: c.y };
    }
  }
  return { x: minX, y: minY };
}

// --- Drawing Engine ---
function render(customShapes = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (baseImage) {
    ctx.drawImage(baseImage, 0, 0);
  }

  const shapes = customShapes || history[historyIndex];
  let annotCount = 0;

  // 1. まずすべての図形（ぼかし以外）を描画
  shapes.forEach((shape) => {
    if (shape.type !== "blur") {
      drawShape(shape);
    }
  });

  // 2. ぼかしを適用（ベース画像に対して直接作用）
  shapes.forEach((shape) => {
    if (shape.type === "blur") {
      applyBlur(shape);
    }
  });

  // 3. 再度非ぼかし図形を描画（ぼかしの上に線を乗せるため）
  shapes.forEach((shape) => {
    if (shape.type !== "blur") {
      drawShape(shape);
    }
  });

  // 4. 傍記を描画
  shapes.forEach((shape) => {
    if (shape.needsAnnot) {
      drawAnnotation(shape, annotCount);
      annotCount++;
    }
  });

  // プレビュー表示
  if (isDrawing) {
    const previewShape = {
      type: tool,
      startX,
      startY,
      endX,
      endY,
      color: elements.fgColor.value,
    };
    if (tool === "blur") {
      drawBlurPreview(previewShape);
    } else {
      drawShape(previewShape);
    }
  }
}

function drawShape(shape) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  if (shape.type === "rect") {
    ctx.rect(shape.startX, shape.startY, shape.endX - shape.startX, shape.endY - shape.startY);
    ctx.stroke();
  } else if (shape.type === "line" || shape.type === "arrow") {
    ctx.moveTo(shape.startX, shape.startY);
    ctx.lineTo(shape.endX, shape.endY);
    ctx.stroke();

    if (shape.type === "arrow") {
      const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
      const headlen = 15;
      ctx.beginPath();
      ctx.moveTo(shape.endX, shape.endY);
      ctx.lineTo(shape.endX - headlen * Math.cos(angle - Math.PI / 6), shape.endY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(shape.endX, shape.endY);
      ctx.lineTo(shape.endX - headlen * Math.cos(angle + Math.PI / 6), shape.endY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  }
}

// ぼかしの適用
function applyBlur(shape) {
  const x = Math.min(shape.startX, shape.endX);
  const y = Math.min(shape.startY, shape.endY);
  const w = Math.abs(shape.endX - shape.startX);
  const h = Math.abs(shape.endY - shape.startY);

  if (w < 1 || h < 1) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // filterを使ってぼかしを適用
  ctx.filter = "blur(8px)";
  if (baseImage) {
    ctx.drawImage(baseImage, 0, 0);
  }
  ctx.filter = "none";
  ctx.restore();
}

// ぼかしのプレビュー表示
function drawBlurPreview(shape) {
  const x = Math.min(shape.startX, shape.endX);
  const y = Math.min(shape.startY, shape.endY);
  const w = Math.abs(shape.endX - shape.startX);
  const h = Math.abs(shape.endY - shape.startY);

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawAnnotation(shape, count) {
  if (shape.annotX === undefined || shape.annotY === undefined) return;

  const text = getCircledNumber(count);
  const size = parseInt(shape.annotSize);

  ctx.beginPath();
  ctx.arc(shape.annotX, shape.annotY, size, 0, Math.PI * 2);
  ctx.fillStyle = shape.bgColor;
  ctx.fill();

  ctx.font = `bold ${size * 1.5}px ${shape.font}`;
  ctx.fillStyle = shape.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, shape.annotX, shape.annotY);
}

// --- Mouse Events ---
canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const currentShapes = history[historyIndex];

  // 傍記のドラッグ判定
  for (let i = currentShapes.length - 1; i >= 0; i--) {
    const shape = currentShapes[i];
    if (shape.needsAnnot && shape.annotX !== undefined && shape.annotY !== undefined) {
      const dist = Math.hypot(mouseX - shape.annotX, mouseY - shape.annotY);
      if (dist <= parseInt(shape.annotSize)) {
        isDraggingAnnot = true;
        draggingAnnotIndex = i;
        tempShapes = JSON.parse(JSON.stringify(currentShapes));
        return;
      }
    }
  }

  // 描画開始
  startX = mouseX;
  startY = mouseY;
  endX = startX;
  endY = startY;
  isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  let curX = e.clientX - rect.left;
  let curY = e.clientY - rect.top;

  if (isDraggingAnnot) {
    tempShapes[draggingAnnotIndex].annotX = curX;
    tempShapes[draggingAnnotIndex].annotY = curY;
    render(tempShapes);
    return;
  }

  if (isDrawing) {
    // Shiftキー処理
    if (e.shiftKey) {
      if (tool === "line" || tool === "arrow") {
        const dx = Math.abs(curX - startX);
        const dy = Math.abs(curY - startY);
        if (dx > dy) curY = startY;
        else curX = startX;
      } else if (tool === "blur" || tool === "rect") {
        // 正方形に制限
        const size = Math.max(Math.abs(curX - startX), Math.abs(curY - startY));
        curX = startX + (curX > startX ? size : -size);
        curY = startY + (curY > startY ? size : -size);
      }
    }
    endX = curX;
    endY = curY;
    render();
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (isDraggingAnnot) {
    isDraggingAnnot = false;
    saveState(tempShapes);
    render();
    return;
  }

  if (!isDrawing) return;
  isDrawing = false;

  if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) {
    render();
    return;
  }

  // 傍記が必要かどうか判定
  let needsAnnot = false;
  if (tool === "rect" && elements.annotRect.checked) needsAnnot = true;
  if (tool === "line" && elements.annotLine.checked) needsAnnot = true;
  if (tool === "arrow" && elements.annotArrow.checked) needsAnnot = true;
  if (tool === "blur" && elements.annotBlur.checked) needsAnnot = true;

  const newShape = {
    type: tool,
    startX,
    startY,
    endX,
    endY,
    color: elements.fgColor.value,
    bgColor: elements.bgColor.value,
    needsAnnot: needsAnnot,
    annotSize: elements.annotSize.value,
    font: elements.fontFamily.value,
  };

  if (needsAnnot) {
    const pos = getInitialAnnotPos(newShape);
    newShape.annotX = pos.x;
    newShape.annotY = pos.y;
  }

  const currentShapes = [...history[historyIndex]];
  currentShapes.push(newShape);
  saveState(currentShapes);
  render();
});

// --- Keyboard ---
window.addEventListener("keydown", (e) => {
  if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    if (e.key === "1") setTool("rect");
    if (e.key === "2") setTool("line");
    if (e.key === "3") setTool("arrow");
    if (e.key === "4") setTool("blur");
  }

  if (e.ctrlKey || e.metaKey) {
    if (e.key === "s") {
      e.preventDefault();
      saveImage();
    }
    if (e.key === "c") {
      e.preventDefault();
      copyImage();
    }
    if (e.key === "z") {
      e.preventDefault();
      undo();
    }
    if (e.key === "y") {
      e.preventDefault();
      redo();
    }
  }
});

function setTool(newTool) {
  document.querySelector("#tool-selected").textContent = { rect: "描写: 矩形", line: "描写: 直線", arrow: "描写: 矢印", blur: "描写: ぼかし" }[newTool];
  tool = newTool;
  //document.querySelectorAll('[id^="tool-"]').forEach((el) => (el.className = ""));
  //const idx = { rect: 1, line: 2, arrow: 3, blur: 4 }[newTool];
  //document.getElementById("tool-" + idx).className = "active-tool";
}

// --- 画像入力関連 ---
window.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      loadImage(URL.createObjectURL(items[i].getAsFile()));
      e.preventDefault();
      break;
    }
  }
});

window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith("image/")) {
      loadImage(URL.createObjectURL(file));
    }
  }
});

document.getElementById("btn-open").addEventListener("click", () => {
  document.getElementById("file-input").click();
});
document.getElementById("file-input").addEventListener("change", (e) => {
  if (e.target.files[0]) loadImage(URL.createObjectURL(e.target.files[0]));
});

// --- 保存・コピー ---
function saveImage() {
  const link = document.createElement("a");
  link.download = "edited_image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function copyImage() {
  canvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      alert("クリップボードにコピーしました");
    } catch {
      alert("コピーに失敗しました。");
    }
  });
}

document.getElementById("btn-save").addEventListener("click", saveImage);
document.getElementById("btn-copy").addEventListener("click", copyImage);
elements.btnUndo.addEventListener("click", undo);
elements.btnRedo.addEventListener("click", redo);

updateButtons();
(function () {
  const ua = navigator.userAgent;
  const isFirefox = /Firefox/.test(ua);
  if (!isFirefox) {
    document.body.outerHTML = '<a href="https://www.firefox.com/download/">Download Firefox</a>';
  }
})();
