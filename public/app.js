const form = document.getElementById('uploadForm');
const photoInput = document.getElementById('photoInput');
const preview = document.getElementById('preview');
const results = document.getElementById('results');
const fileCard = document.getElementById('fileCard');
const clearBtn = document.getElementById('clearBtn');

let currentObjectUrl = null;

function setPreviewFile(file){
  preview.innerHTML = '';
  if (!file) return;
  const img = document.createElement('img');
  const url = URL.createObjectURL(file);
  currentObjectUrl = url;
  img.src = url;
  img.alt = file.name || 'Plant photo preview';

  const info = document.createElement('div');
  info.className = 'thumb-info';
  info.innerHTML = `<strong>${escapeHtml(file.name || 'Photo')}</strong><span class="muted">${Math.round(file.size/1024)} KB</span>`;

  preview.appendChild(img);
  preview.appendChild(info);
}

photoInput.addEventListener('change', () => {
  const f = photoInput.files[0];
  setPreviewFile(f);
});

clearBtn.addEventListener('click', () => {
  photoInput.value = '';
  preview.innerHTML = '';
  results.innerHTML = '';
  if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
});

['dragenter','dragover'].forEach(ev => {
  fileCard.addEventListener(ev, (e) => { e.preventDefault(); fileCard.classList.add('dragover'); });
});
['dragleave','drop','dragend'].forEach(ev => {
  fileCard.addEventListener(ev, (e) => { e.preventDefault(); fileCard.classList.remove('dragover'); });
});

fileCard.addEventListener('drop', (e) => {
  e.preventDefault();
  const dt = e.dataTransfer;
  if (!dt || !dt.files || !dt.files.length) return;
  const f = dt.files[0];
  if (!f.type.startsWith('image/')) return;
  // populate file input
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(f);
  photoInput.files = dataTransfer.files;
  setPreviewFile(f);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!photoInput.files[0]) return alert('Please select a photo.');

  results.innerHTML = '<div class="card"><div class="loader"></div> Analyzing…</div>';
  // show skeleton placeholders while server processes image
  createSkeletons(3);

  const fd = new FormData();
  fd.append('photo', photoInput.files[0]);

  try {
    const res = await fetch('/analyze', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Analysis failed');
    const json = await res.json();
    renderResults(json);
  } catch (err) {
    results.innerHTML = `<div class="card"><h3>Error</h3><p class="meta">${escapeHtml(err.message || 'Unknown error')}</p></div>`;
  }
});

function renderResults(json){
  results.innerHTML = '';
  const suggestions = json.suggestions || {};
  const analysis = json.analysis || {};

  const map = [
    ['Watering', suggestions.watering || 'No specific watering advice available.'],
    ['Sunlight', suggestions.sunlight || 'Sunlight guidance not found.'],
    ['Care', suggestions.care || 'General care not provided.']
  ];

  map.forEach(([title, text], i) => {
    const c = document.createElement('div');
    c.className = 'card reveal';
    c.style.animationDelay = (i * 80) + 'ms';
    c.innerHTML = `<h3>${escapeHtml(title)}</h3><div class="meta">${escapeHtml(text)}</div>`;
    results.appendChild(c);
  });

  const stats = document.createElement('div');
  stats.className = 'card';
  const greenRatio = analysis.greenRatio ? (analysis.greenRatio*100).toFixed(1)+'%' : 'N/A';
  const avgG = typeof analysis.avgG === 'number' ? Math.round(analysis.avgG) : 'N/A';
  stats.innerHTML = `<h3>Analysis</h3><div class="meta"><span class="stat">Green ratio:</span> ${greenRatio} · <span class="stat">avgG:</span> ${avgG}</div>`;
  results.appendChild(stats);
}

function escapeHtml(s){ return String(s || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function createSkeletons(count){
  results.innerHTML = '';
  for(let i=0;i<count;i++){
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `<div class="skeleton" style="height:56px;"></div>`;
    results.appendChild(c);
  }
}

