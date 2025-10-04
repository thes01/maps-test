import { spawn } from 'child_process';
import { join } from 'path';

/**
 * Convert frames to video using FFmpeg
 * @param {string} framesDir - Directory containing frames
 * @param {string} outputPath - Output video path
 * @param {number} fps - Frames per second
 * @returns {Promise<void>}
 */
export async function exportVideo(framesDir, outputPath, fps) {
  return new Promise((resolve, reject) => {
    console.log(`Exporting video to ${outputPath}...`);
    
    const args = [
      '-y', // Overwrite output file
      '-framerate', fps.toString(),
      '-i', join(framesDir, 'frame_%04d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-crf', '23',
      outputPath
    ];

    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('Video export complete!');
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg: ${error.message}. Make sure FFmpeg is installed.`));
    });
  });
}
