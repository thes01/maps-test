import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate HTML page for simple 2D map rendering with canvas
 * This is a lightweight alternative when CesiumJS CDN is not available
 * @param {Array} places - Geocoded places
 * @param {Array} cameraPath - Camera path data
 * @returns {string} HTML content
 */
function generateSimpleMapHTML(places, cameraPath) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>3D Journey</title>
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: linear-gradient(180deg, #87CEEB 0%, #E8F1F2 100%);
    }
    #mapCanvas {
      display: block;
    }
  </style>
</head>
<body>
  <canvas id="mapCanvas"></canvas>
  <script>
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const places = ${JSON.stringify(places)};
    const cameraPath = ${JSON.stringify(cameraPath)};
    
    let currentFrame = 0;
    
    // Mercator projection
    function mercatorProjection(lon, lat, centerLon, centerLat, zoom) {
      const width = canvas.width;
      const height = canvas.height;
      
      const x = width / 2 + (lon - centerLon) * zoom;
      const latRad = lat * Math.PI / 180;
      const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      const centerLatRad = centerLat * Math.PI / 180;
      const centerMercN = Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2));
      const y = height / 2 - (mercN - centerMercN) * zoom;
      
      return { x, y };
    }
    
    function drawMap(frameIndex) {
      if (frameIndex >= cameraPath.length) {
        frameIndex = cameraPath.length - 1;
      }
      
      const pos = cameraPath[frameIndex];
      
      // Calculate zoom based on altitude
      const zoom = Math.max(50, 50000000 / pos.altitude);
      
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E8F1F2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines (longitude/latitude)
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
      ctx.lineWidth = 1;
      
      for (let lon = -180; lon <= 180; lon += 30) {
        const start = mercatorProjection(lon, -85, pos.lon, pos.lat, zoom);
        const end = mercatorProjection(lon, 85, pos.lon, pos.lat, zoom);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      
      for (let lat = -80; lat <= 80; lat += 20) {
        const start = mercatorProjection(-180, lat, pos.lon, pos.lat, zoom);
        const end = mercatorProjection(180, lat, pos.lon, pos.lat, zoom);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      
      // Draw route line
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < places.length; i++) {
        const p = mercatorProjection(places[i].lon, places[i].lat, pos.lon, pos.lat, zoom);
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
      
      // Draw place markers
      places.forEach((place, i) => {
        const p = mercatorProjection(place.lon, place.lat, pos.lon, pos.lat, zoom);
        
        // Pin shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 25, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pin
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + 20);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FF5252';
        ctx.stroke();
        
        // Label background
        const label = place.name.split(',')[0];
        ctx.font = 'bold 14px Arial';
        const metrics = ctx.measureText(label);
        const padding = 6;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
          p.x - metrics.width / 2 - padding,
          p.y + 25,
          metrics.width + padding * 2,
          20
        );
        
        // Label text
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, p.x, p.y + 28);
      });
      
      // Draw current camera indicator
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.stroke();
      
      // Frame info
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 60);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(\`Frame: \${frameIndex + 1}/\${cameraPath.length}\`, 20, 25);
      ctx.fillText(\`Lat: \${pos.lat.toFixed(4)}\`, 20, 42);
      ctx.fillText(\`Lon: \${pos.lon.toFixed(4)}\`, 20, 59);
    }
    
    window.setCameraPosition = function(frameIndex) {
      currentFrame = frameIndex;
      drawMap(frameIndex);
    };
    
    // Initialize
    drawMap(0);
    window.mapReady = true;
  </script>
</body>
</html>`;
}

/**
 * Render frames using Puppeteer with simple canvas-based map
 * @param {Array} places - Geocoded places
 * @param {Array} cameraPath - Camera path data
 * @param {string} outputDir - Directory to save frames
 * @param {number} width - Frame width
 * @param {number} height - Frame height
 */
export async function renderFrames(places, cameraPath, outputDir, width = 1920, height = 1080) {
  console.log('Starting frame rendering...');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate HTML content with simple map renderer
  const htmlContent = generateSimpleMapHTML(places, cameraPath);
  const htmlPath = join(process.cwd(), outputDir, 'map-viewer.html');
  fs.writeFileSync(htmlPath, htmlContent);

  console.log('Launching browser...');
  
  // Launch browser with system Chrome
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    });
  } catch (error) {
    console.log('Failed to launch chromium-browser, trying google-chrome...');
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        executablePath: '/usr/bin/google-chrome'
      });
    } catch (error2) {
      throw new Error('Could not launch browser. Please install Chrome or Chromium, or set PUPPETEER_EXECUTABLE_PATH environment variable.');
    }
  }

  const page = await browser.newPage();
  await page.setViewport({ width, height });

  console.log('Loading map viewer...');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });

  // Wait for map to be ready
  await page.waitForFunction(() => window.mapReady === true, { timeout: 5000 });
  
  // Give it a bit more time to fully render
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`Capturing ${cameraPath.length} frames...`);
  
  for (let i = 0; i < cameraPath.length; i++) {
    await page.evaluate((frameIndex) => {
      window.setCameraPosition(frameIndex);
    }, i);

    // Wait for rendering to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const framePath = join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath });

    if ((i + 1) % 10 === 0 || i === cameraPath.length - 1) {
      console.log(`  Captured frame ${i + 1}/${cameraPath.length}`);
    }
  }

  await browser.close();
  console.log('Frame rendering complete!');
}
