const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/analyze', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { data, info } = await sharp(req.file.buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels; // usually 4 (RGBA)
    const pixelCount = info.width * info.height;

    let sumR = 0, sumG = 0, sumB = 0;
    let greenPixels = 0;

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sumR += r; sumG += g; sumB += b;
      if (g > r + 10 && g > b + 10 && g > 80) greenPixels++;
    }

    const avgR = sumR / pixelCount;
    const avgG = sumG / pixelCount;
    const avgB = sumB / pixelCount;
    const greenRatio = greenPixels / pixelCount;

    // Simple heuristics for suggestions
    let watering = '';
    let sunlight = '';
    let care = '';

    if (greenRatio < 0.05) {
      watering = 'Low greenery detected. Water sparingly — small or drought-tolerant plant.';
      sunlight = 'Provide bright indirect light; avoid long direct sun.';
      care = 'Check soil moisture and roots; consider repotting if stressed.';
    } else if (greenRatio < 0.2) {
      watering = 'Moderate to low foliage. Water when top 2-3 cm of soil is dry.';
      sunlight = 'Bright light for several hours daily or morning sun.';
      care = 'Allow good drainage; trim any brown leaves.';
    } else if (greenRatio < 0.5) {
      watering = 'Typical houseplant foliage. Water roughly once per week, adjust to soil.';
      sunlight = 'Bright indirect light; avoid prolonged harsh midday sun.';
      care = 'Fertilize monthly during growing season; wipe dust from leaves.';
    } else {
      watering = 'Leafy plant — keep soil evenly moist but not waterlogged.';
      sunlight = 'Bright indirect light, tolerates some morning direct sun.';
      care = 'Feed during growing season; prune to maintain shape.';
    }

    // Slight adjustments based on average green intensity
    if (avgG > 130) {
      watering += ' Plant looks lush — monitor for overwatering.';
    } else if (avgG < 90) {
      watering += ' Leaves look pale — may need slightly more water or nutrients.';
    }

    res.json({ suggestions: { watering, sunlight, care }, analysis: { avgR, avgG, avgB, greenRatio } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Plantcare Assistant running on http://localhost:${PORT}`));
