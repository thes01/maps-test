import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate HTML page for CesiumJS rendering
 * @param {Array} places - Geocoded places
 * @param {Array} cameraPath - Camera path data
 * @returns {string} HTML content
 */
function generateCesiumHTML(places, cameraPath) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>3D Journey</title>
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Cesium.js"></script>
  <link href="https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
  <style>
    html, body, #cesiumContainer {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="cesiumContainer"></div>
  <script>
    // Initialize Cesium viewer
    const viewer = new Cesium.Viewer('cesiumContainer', {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
      selectionIndicator: false,
      terrainProvider: undefined // Flat style, no terrain
    });

    viewer.scene.globe.enableLighting = false;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#E8F1F2');

    // Add pins for each location
    const places = ${JSON.stringify(places)};
    places.forEach(place => {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(place.lon, place.lat),
        billboard: {
          image: 'data:image/svg+xml;base64,' + btoa(\`
            <svg width="32" height="48" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 32 16 32s16-23.2 16-32C32 7.2 24.8 0 16 0z" fill="#FF5252"/>
              <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
            </svg>
          \`),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 1.0
        },
        label: {
          text: place.name.split(',')[0],
          font: '14px sans-serif',
          fillColor: Cesium.Color.BLACK,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 10)
        }
      });
    });

    // Camera path data
    const cameraPath = ${JSON.stringify(cameraPath)};
    
    // Function to set camera position
    window.setCameraPosition = function(frameIndex) {
      if (frameIndex >= cameraPath.length) {
        frameIndex = cameraPath.length - 1;
      }
      const pos = cameraPath[frameIndex];
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.altitude),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0
        }
      });
    };

    // Set initial camera position
    window.setCameraPosition(0);
    
    // Ready signal
    window.cesiumReady = true;
  </script>
</body>
</html>`;
}

/**
 * Render frames using Puppeteer and CesiumJS
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

  // Generate HTML content
  const htmlContent = generateCesiumHTML(places, cameraPath);
  const htmlPath = join(process.cwd(), outputDir, 'cesium-viewer.html');
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

  console.log('Loading Cesium viewer...');
  
  // Set longer timeout for external resources
  page.setDefaultTimeout(60000);
  
  try {
    await page.goto(`file://${htmlPath}`, { 
      waitUntil: 'networkidle0',
      timeout: 60000
    });
  } catch (error) {
    console.log('Warning: Page load timeout, continuing anyway...');
  }

  // Wait for Cesium to be ready
  try {
    await page.waitForFunction(() => window.cesiumReady === true, { timeout: 45000 });
  } catch (error) {
    throw new Error('Cesium failed to initialize. This may be due to network restrictions blocking the Cesium CDN (cesium.com). Please check your internet connection or firewall settings.');
  }
  
  // Give it a bit more time to fully initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`Capturing ${cameraPath.length} frames...`);
  
  for (let i = 0; i < cameraPath.length; i++) {
    await page.evaluate((frameIndex) => {
      window.setCameraPosition(frameIndex);
    }, i);

    // Wait for scene to render
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
