const form = document.getElementById('uploadForm');
const photoInput = document.getElementById('photoInput');
const preview = document.getElementById('preview');
const results = document.getElementById('results');

photoInput.addEventListener('change', () => {
  const f = photoInput.files[0];
  preview.innerHTML = '';
  if (!f) return;
  const img = document.createElement('img');
  img.src = URL.createObjectURL(f);
  preview.appendChild(img);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!photoInput.files[0]) return alert('Please select a photo.');

  results.innerHTML = '<div class="card"><div class="loader"></div> Analyzing…</div>';

  const fd = new FormData();
  fd.append('photo', photoInput.files[0]);

  try {
    const res = await fetch('/analyze', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Analysis failed');
    const json = await res.json();
    renderResults(json);
  } catch (err) {
    results.innerHTML = `<div class="card"><h3>Error</h3><p class="meta">${err.message}</p></div>`;
  }
});

function renderResults(json){
  results.innerHTML = '';
  const { suggestions, analysis } = json;

  const map = [
    ['Watering', suggestions.watering],
    ['Sunlight', suggestions.sunlight],
    ['Care', suggestions.care]
  ];

  map.forEach(([title, text]) => {
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `<h3>${title}</h3><div class="meta">${escapeHtml(text)}</div>`;
    results.appendChild(c);
  });

  const stats = document.createElement('div');
  stats.className = 'card';
  stats.innerHTML = `<h3>Analysis</h3><div class="meta">Green ratio: ${ (analysis.greenRatio*100).toFixed(1) }% · avgG: ${ Math.round(analysis.avgG) }</div>`;
  results.appendChild(stats);
}

function escapeHtml(s){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
