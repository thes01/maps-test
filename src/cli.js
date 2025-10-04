#!/usr/bin/env node

import { Command } from 'commander';
import { geocodePlaces } from './geocode.js';
import { generateCameraPath } from './cameraPath.js';
import { renderFrames } from './renderer-simple.js';
import { exportVideo } from './video.js';
import { join } from 'path';
import fs from 'fs';

const program = new Command();

program
  .name('journey')
  .description('CLI 3D Travel Journey Video Generator')
  .version('1.0.0')
  .requiredOption('--places <places...>', 'List of locations (names or lat,lon)')
  .requiredOption('--output <filename>', 'Output video filename (e.g. journey.mp4)')
  .option('--duration <seconds>', 'Total animation duration in seconds', '10')
  .option('--fps <fps>', 'Frames per second', '30')
  .option('--width <pixels>', 'Video width in pixels', '1920')
  .option('--height <pixels>', 'Video height in pixels', '1080')
  .option('--frames-dir <directory>', 'Directory to save frames', './frames')
  .option('--keep-frames', 'Keep frame files after video generation', false)
  .action(async (options) => {
    try {
      console.log('=== CLI 3D Travel Journey Video Generator ===\n');

      // Parse options
      const places = options.places;
      const outputPath = options.output;
      const duration = parseFloat(options.duration);
      const fps = parseInt(options.fps);
      const width = parseInt(options.width);
      const height = parseInt(options.height);
      const framesDir = options.framesDir;
      const keepFrames = options.keepFrames;

      // Validate inputs
      if (places.length < 2) {
        throw new Error('At least 2 places are required');
      }
      if (duration <= 0 || fps <= 0) {
        throw new Error('Duration and FPS must be positive numbers');
      }

      const totalFrames = Math.floor(duration * fps);
      console.log(`Configuration:`);
      console.log(`  Places: ${places.length}`);
      console.log(`  Duration: ${duration}s`);
      console.log(`  FPS: ${fps}`);
      console.log(`  Total frames: ${totalFrames}`);
      console.log(`  Resolution: ${width}x${height}`);
      console.log(`  Output: ${outputPath}\n`);

      // Step 1: Geocode places
      console.log('Step 1: Geocoding places...');
      const geocodedPlaces = await geocodePlaces(places);
      geocodedPlaces.forEach((place, i) => {
        console.log(`  ${i + 1}. ${place.name} (${place.lat.toFixed(4)}, ${place.lon.toFixed(4)})`);
      });
      console.log();

      // Save geocoded data to JSON
      const dataPath = join(framesDir, 'journey-data.json');
      if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
      }
      fs.writeFileSync(dataPath, JSON.stringify({
        places: geocodedPlaces,
        totalFrames,
        fps,
        duration
      }, null, 2));
      console.log(`Saved journey data to ${dataPath}\n`);

      // Step 2: Generate camera path
      console.log('Step 2: Generating camera path...');
      const cameraPath = generateCameraPath(geocodedPlaces, totalFrames);
      console.log(`  Generated ${cameraPath.length} camera positions\n`);

      // Save camera path
      const cameraPathFile = join(framesDir, 'camera-path.json');
      fs.writeFileSync(cameraPathFile, JSON.stringify(cameraPath, null, 2));
      console.log(`Saved camera path to ${cameraPathFile}\n`);

      // Step 3: Render frames
      console.log('Step 3: Rendering frames with canvas-based map...');
      await renderFrames(geocodedPlaces, cameraPath, framesDir, width, height);
      console.log();

      // Step 4: Export video
      console.log('Step 4: Exporting video with FFmpeg...');
      await exportVideo(framesDir, outputPath, fps);
      console.log();

      // Cleanup frames if requested
      if (!keepFrames) {
        console.log('Cleaning up frame files...');
        const files = fs.readdirSync(framesDir);
        for (const file of files) {
          if (file.startsWith('frame_') && file.endsWith('.png')) {
            fs.unlinkSync(join(framesDir, file));
          }
        }
        console.log('Frame files removed.\n');
      }

      console.log('=== Journey video generation complete! ===');
      console.log(`Output saved to: ${outputPath}`);

    } catch (error) {
      console.error(`\nError: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
