# Quick Start Guide

## Installation

1. **Clone and Install**
```bash
git clone https://github.com/thes01/maps-test.git
cd maps-test
npm install
```

2. **Install System Dependencies**

FFmpeg (for video encoding):
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

Chromium (for rendering):
```bash
# Ubuntu/Debian
sudo apt-get install chromium-browser

# macOS
brew install --cask chromium
```

## Usage

### Basic Command
```bash
node src/cli.js --places "City1" "City2" "City3" --output my-journey.mp4
```

### Examples

**Simple two-city journey:**
```bash
node src/cli.js \
  --places "Paris" "London" \
  --output europe.mp4 \
  --duration 5 \
  --fps 30
```

**World tour:**
```bash
node src/cli.js \
  --places "Tokyo" "Singapore" "Dubai" "Rome" "Paris" "New York" \
  --output world-tour.mp4 \
  --duration 15 \
  --fps 30
```

**Using coordinates:**
```bash
node src/cli.js \
  --places "35.6762,139.6503" "48.8566,2.3522" "40.7128,-74.0060" \
  --output coordinates.mp4 \
  --duration 10
```

**Custom resolution:**
```bash
node src/cli.js \
  --places "Madrid" "Barcelona" "Valencia" \
  --output spain-4k.mp4 \
  --duration 8 \
  --width 3840 \
  --height 2160
```

**Keep frames for inspection:**
```bash
node src/cli.js \
  --places "Sydney" "Melbourne" \
  --output australia.mp4 \
  --keep-frames
```

## Output

The tool generates:
- `<output>.mp4` - The final video
- `frames/` directory containing:
  - `frame_XXXX.png` - Individual frames (if --keep-frames)
  - `journey-data.json` - Geocoded locations
  - `camera-path.json` - Camera positions

## Options Reference

| Option | Description | Default |
|--------|-------------|---------|
| `--places <places...>` | Locations (required) | - |
| `--output <filename>` | Output video file (required) | - |
| `--duration <seconds>` | Video duration | 10 |
| `--fps <fps>` | Frames per second | 30 |
| `--width <pixels>` | Video width | 1920 |
| `--height <pixels>` | Video height | 1080 |
| `--frames-dir <directory>` | Frame storage | ./frames |
| `--keep-frames` | Preserve frames | false |

## Troubleshooting

**"Could not geocode place"**
- Use fallback city names: Paris, London, Tokyo, New York, etc.
- Or use coordinates: "lat,lon" format

**"Could not launch browser"**
- Install Chromium or Chrome
- Or set: `export PUPPETEER_EXECUTABLE_PATH=/path/to/chrome`

**"FFmpeg failed"**
- Install FFmpeg: `sudo apt-get install ffmpeg`

## Next Steps

- See `README.md` for detailed documentation
- Check `examples.sh` for more examples
- Read `IMPLEMENTATION.md` for technical details
