/* =========================================================
   CANVASVERSE — script.js
   Ties together navigation, the drawing engine, the gallery,
   auto-save, and the daily challenge banner.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAllCanvases();
  initGallery();
  initAutoSave();
  initDailyChallenge();
});


/* =========================================================
   1. NAVIGATION
   ========================================================= */

// Remembers which category screen we came from, so the shared
// coloring screen's back button can return to the right place.
let coloringOrigin = 'screen-home';

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('active');

  // Any canvas that just became visible needs to be sized now,
  // since canvases inside display:none screens report 0 size.
  target.querySelectorAll('canvas.drawing-canvas').forEach(fitCanvasToContainer);
}

function initNavigation() {
  document.querySelectorAll('[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('category-card')) {
        coloringOrigin = document.querySelector('.screen.active').id;
        loadColoringCategory(btn.dataset.category);
      }
      showScreen(btn.dataset.target);
    });
  });

  const coloringBackBtn = document.getElementById('coloring-back-btn');
  if (coloringBackBtn) {
    coloringBackBtn.addEventListener('click', () => showScreen(coloringOrigin));
  }
}


/* =========================================================
   2. DRAWING ENGINE
   One controller per canvas. Registered in `canvasControllers`
   so other parts of the app (gallery, auto-save, category
   loading) can clear/load/read whichever canvas they need.
   ========================================================= */

const canvasControllers = {};

function fitCanvasToContainer(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const newWidth = Math.round(rect.width * dpr);
  const newHeight = Math.round(rect.height * dpr);

  if (canvas.width === newWidth && canvas.height === newHeight) return;

  const ctx = canvas.getContext('2d');
  const prevData = (canvas.width && canvas.height) ? canvas.toDataURL() : null;

  canvas.width = newWidth;
  canvas.height = newHeight;

  if (prevData) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = prevData;
  }
}

function setupCanvas(config) {
  const canvas = document.getElementById(config.canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let currentColor = '#000000';
  let currentSize = config.sizeMap[config.defaultSizeKey] || 10;
  let isErasing = false;
  let drawing = false;

  const undoStack = [];
  const redoStack = [];

  function pushUndo() {
    undoStack.push(canvas.toDataURL());
    redoStack.length = 0; // starting a new action clears redo history
  }

  function restoreFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataURL;
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // --- Pointer / touch drawing (continuous strokes, not dots) ---
  canvas.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary) return;
    e.preventDefault();
    drawing = true;
    pushUndo();
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drawing || !e.isPrimary) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  });

  function stopDrawing() {
    drawing = false;
  }
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);
  canvas.addEventListener('pointerleave', stopDrawing);

  // --- Color palette ---
  const palette = document.getElementById(config.paletteId);
  if (palette) {
    palette.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        currentColor = swatch.dataset.color;
        isErasing = false;
        if (config.brushBtnId) setActiveTool('brush');
      });
    });
  }

  if (config.customColorPickerId) {
    const picker = document.getElementById(config.customColorPickerId);
    if (picker) {
      picker.addEventListener('input', () => {
        currentColor = picker.value;
        isErasing = false;
        if (config.brushBtnId) setActiveTool('brush');
      });
    }
  }

  // --- Brush size buttons ---
  const screenEl = canvas.closest('.screen');
  const brushButtons = screenEl ? screenEl.querySelectorAll('.brush-size-btn') : [];
  brushButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentSize = config.sizeMap[btn.dataset.size] || currentSize;
      brushButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // --- Brush / eraser toggle (freedraw screens only) ---
  function setActiveTool(tool) {
    isErasing = tool === 'eraser';
    if (config.brushBtnId && config.eraserBtnId) {
      document.getElementById(config.brushBtnId).classList.toggle('selected', tool === 'brush');
      document.getElementById(config.eraserBtnId).classList.toggle('selected', tool === 'eraser');
    }
  }

  if (config.brushBtnId) {
    document.getElementById(config.brushBtnId).addEventListener('click', () => setActiveTool('brush'));
  }
  if (config.eraserBtnId) {
    document.getElementById(config.eraserBtnId).addEventListener('click', () => setActiveTool('eraser'));
  }

  // --- Undo / Redo / Clear / Save ---
  if (config.undoBtnId) {
    document.getElementById(config.undoBtnId).addEventListener('click', () => {
      if (undoStack.length === 0) return;
      redoStack.push(canvas.toDataURL());
      restoreFromDataURL(undoStack.pop());
    });
  }

  if (config.redoBtnId) {
    document.getElementById(config.redoBtnId).addEventListener('click', () => {
      if (redoStack.length === 0) return;
      undoStack.push(canvas.toDataURL());
      restoreFromDataURL(redoStack.pop());
    });
  }

  if (config.clearBtnId) {
    document.getElementById(config.clearBtnId).addEventListener('click', () => {
      pushUndo();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  if (config.saveBtnId) {
    document.getElementById(config.saveBtnId).addEventListener('click', () => {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'canvasverse-drawing.png';
      link.click();
      saveToGallery(dataURL, config.canvasId, config.galleryTitle || 'My Drawing');
    });
  }

  // Register controller so other features can control this canvas
  canvasControllers[config.canvasId] = {
    clear: () => {
      pushUndo();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    loadImage: (dataURL) => restoreFromDataURL(dataURL),
    getDataURL: () => canvas.toDataURL('image/png'),
    canvasEl: canvas,
  };
}

function initAllCanvases() {
  // Shared coloring screen (ages 3-10, 11-15 coloring books, 16+ coloring books)
  setupCanvas({
    canvasId: 'canvas-coloring',
    paletteId: 'palette-coloring',
    sizeMap: { big: 26, small: 8 },
    defaultSizeKey: 'big',
    undoBtnId: 'undo-coloring',
    clearBtnId: 'clear-coloring',
    saveBtnId: 'save-coloring',
    galleryTitle: 'Coloring Page',
  });

  // Ages 11-15 Free Draw
  setupCanvas({
    canvasId: 'canvas-11-15-freedraw',
    paletteId: 'palette-11-15',
    sizeMap: { small: 6, medium: 14, large: 26 },
    defaultSizeKey: 'medium',
    undoBtnId: 'undo-11-15',
    redoBtnId: 'redo-11-15',
    clearBtnId: 'clear-11-15',
    saveBtnId: 'save-11-15',
    brushBtnId: 'tool-brush-11-15',
    eraserBtnId: 'tool-eraser-11-15',
    galleryTitle: 'Free Draw',
  });

  // Ages 16+ Full Free Draw Studio
  setupCanvas({
    canvasId: 'canvas-16-freedraw',
    paletteId: 'palette-16',
    customColorPickerId: 'custom-color-picker-16',
    sizeMap: { small: 6, medium: 14, large: 28 },
    defaultSizeKey: 'medium',
    undoBtnId: 'undo-16',
    redoBtnId: 'redo-16',
    clearBtnId: 'clear-16',
    saveBtnId: 'save-16',
    brushBtnId: 'tool-brush-16',
    eraserBtnId: 'tool-eraser-16',
    galleryTitle: 'Advanced Free Draw',
  });
}

// Called when a category card is tapped (from index.html data-category)
function loadColoringCategory(category) {
  const controller = canvasControllers['canvas-coloring'];
  if (controller) {
    controller.canvasEl.dataset.category = category;
    controller.clear();
  }
  // TODO: once outline artwork exists per category, load it here
  // with controller.loadImage('path/to/outline.png') instead of clear().
}


/* =========================================================
   3. GALLERY  (saved drawings, stored in localStorage)
   ========================================================= */

const GALLERY_KEY = 'canvasverse-gallery';

// Maps a canvas id back to the screen that should open when
// continuing a saved drawing.
const canvasToScreen = {
  'canvas-coloring': 'screen-coloring',
  'canvas-11-15-freedraw': 'screen-11-15-freedraw',
  'canvas-16-freedraw': 'screen-16-freedraw',
};

function getGalleryEntries() {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveGalleryEntries(entries) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(entries));
}

function saveToGallery(dataURL, canvasId, title) {
  const entries = getGalleryEntries();
  entries.unshift({
    id: Date.now().toString(),
    dataURL,
    canvasId,
    title,
    date: new Date().toLocaleDateString(),
  });
  saveGalleryEntries(entries);
  renderGallery();
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const entries = getGalleryEntries();
  grid.innerHTML = '';

  entries.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = `
      <img src="${entry.dataURL}" alt="${entry.title}" />
      <div class="gallery-card-date">${entry.title} — ${entry.date}</div>
      <div class="gallery-card-actions">
        <button data-action="continue">Continue</button>
        <button data-action="rename">Rename</button>
        <button data-action="delete">Delete</button>
      </div>
    `;

    card.querySelector('[data-action="continue"]').addEventListener('click', () => {
      const screenId = canvasToScreen[entry.canvasId];
      const controller = canvasControllers[entry.canvasId];
      if (controller && screenId) {
        showScreen(screenId);
        controller.loadImage(entry.dataURL);
      }
    });

    card.querySelector('[data-action="rename"]').addEventListener('click', () => {
      const newTitle = prompt('Rename drawing:', entry.title);
      if (newTitle) {
        entry.title = newTitle;
        saveGalleryEntries(entries);
        renderGallery();
      }
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      const remaining = entries.filter((e) => e.id !== entry.id);
      saveGalleryEntries(remaining);
      renderGallery();
    });

    grid.appendChild(card);
  });
}

function initGallery() {
  renderGallery();
  const newDrawingBtn = document.getElementById('new-drawing-btn');
  if (newDrawingBtn) {
    newDrawingBtn.addEventListener('click', () => showScreen('screen-home'));
  }
}


/* =========================================================
   4. AUTO-SAVE  ("Welcome back!" prompt)
   ========================================================= */

const AUTOSAVE_KEY = 'canvasverse-autosave';

function initAutoSave() {
  // Every few seconds, if a drawing screen is active, save its state.
  setInterval(() => {
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen || !activeScreen.classList.contains('draw-screen')) return;

    const canvas = activeScreen.querySelector('canvas.drawing-canvas');
    if (!canvas) return;

    const controller = canvasControllers[canvas.id];
    if (!controller) return;

    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      canvasId: canvas.id,
      dataURL: controller.getDataURL(),
      savedAt: Date.now(),
    }));
  }, 5000);

  // On load, check for a previous auto-saved drawing.
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(AUTOSAVE_KEY));
  } catch (e) {
    saved = null;
  }

  if (saved && saved.canvasId) {
    const modal = document.getElementById('welcome-back-modal');
    modal.classList.remove('hidden');

    document.getElementById('continue-drawing-btn').addEventListener('click', () => {
      modal.classList.add('hidden');
      const screenId = canvasToScreen[saved.canvasId];
      const controller = canvasControllers[saved.canvasId];
      if (controller && screenId) {
        showScreen(screenId);
        controller.loadImage(saved.dataURL);
      }
    });

    document.getElementById('start-new-btn').addEventListener('click', () => {
      modal.classList.add('hidden');
      localStorage.removeItem(AUTOSAVE_KEY);
    });
  }
}


/* =========================================================
   5. DAILY CHALLENGE
   ========================================================= */

function initDailyChallenge() {
  const challenges = [
    'Draw something from outer space! 🚀',
    'Draw your favorite animal! 🐾',
    'Draw a magical castle! 🏰',
    'Draw something underwater! 🌊',
    'Draw your dream house! 🏡',
    'Draw a superhero! 🦸',
    'Draw a rainbow! 🌈',
  ];

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const challengeText = challenges[dayOfYear % challenges.length];

  const el = document.querySelector('#daily-challenge .daily-challenge-text');
  if (el) el.textContent = challengeText;
}
