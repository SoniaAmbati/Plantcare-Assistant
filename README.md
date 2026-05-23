# PlantCare Assistant

Simple web app: upload a plant photo and get watering, sunlight, and care suggestions. 

Uses a lightweight image heuristic (green channel analysis) as a placeholder for species detection.

Run locally:

```bash
npm install
npm start
# then open http://localhost:3000
```

Notes:
- The analysis is heuristic-based (color/green coverage). For production, replace with a plant-recognition model or API.
- Tested on Node.js 18+. `sharp` downloads native binaries during install; ensure build tools/network access if that fails.


Made for all plant lovers <3