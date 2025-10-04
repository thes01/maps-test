# maps-test

CLI 3D Travel Journey Video Generator - Create stunning 3D animated videos of your travel routes using CesiumJS.

## Features

- **Geocoding**: Automatically convert place names to coordinates using Nominatim API
- **3D Visualization**: Render beautiful 3D globe animations with CesiumJS
- **Smooth Camera Paths**: Great-circle interpolation for realistic camera movement
- **Video Export**: Generate MP4 videos using FFmpeg
- **Customizable**: Control duration, FPS, resolution, and more

## Prerequisites

Before using this tool, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **FFmpeg** - For video encoding
  ```bash
  # Ubuntu/Debian
  sudo apt-get install ffmpeg
  
  # macOS
  brew install ffmpeg
  ```
- **Chrome or Chromium** - For headless rendering
  ```bash
  # Ubuntu/Debian
  sudo apt-get install chromium-browser
  
  # macOS
  brew install --cask chromium
  ```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/thes01/maps-test.git
cd maps-test
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Link the CLI globally:
```bash
npm link
```

## Usage

### Basic Usage

Generate a journey video between multiple locations:

```bash
node src/cli.js --places "Paris" "London" "Berlin" --output journey.mp4
```

### Using Coordinates

You can also use latitude,longitude coordinates:

```bash
node src/cli.js --places "48.8566,2.3522" "51.5074,-0.1278" --output journey.mp4
```

### Advanced Options

```bash
node src/cli.js \
  --places "New York" "Los Angeles" "Chicago" "Miami" \
  --output usa-tour.mp4 \
  --duration 20 \
  --fps 30 \
  --width 1920 \
  --height 1080 \
  --keep-frames
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--places <places...>` | List of locations (names or lat,lon) | **Required** |
| `--output <filename>` | Output video filename (e.g. journey.mp4) | **Required** |
| `--duration <seconds>` | Total animation duration in seconds | `10` |
| `--fps <fps>` | Frames per second | `30` |
| `--width <pixels>` | Video width in pixels | `1920` |
| `--height <pixels>` | Video height in pixels | `1080` |
| `--frames-dir <directory>` | Directory to save frames | `./frames` |
| `--keep-frames` | Keep frame files after video generation | `false` |

### Examples

**Quick city tour:**
```bash
node src/cli.js --places "Tokyo" "Singapore" "Dubai" --output asia-tour.mp4 --duration 15
```

**High-quality long journey:**
```bash
node src/cli.js \
  --places "Sydney" "Bangkok" "Mumbai" "Cairo" "Rome" "Paris" "New York" \
  --output world-tour.mp4 \
  --duration 30 \
  --fps 60 \
  --width 3840 \
  --height 2160
```

**Using the global command (after npm link):**
```bash
journey --places "Madrid" "Barcelona" "Valencia" --output spain.mp4
```

## How It Works

1. **Geocoding**: Place names are converted to coordinates using the Nominatim API
2. **Camera Path**: A smooth camera path is generated using great-circle interpolation
3. **Rendering**: CesiumJS renders each frame in a headless browser (Puppeteer)
4. **Video Export**: FFmpeg combines the frames into a video file

## Architecture

```
CLI → Geocode → Camera Path → CesiumJS Render → PNG Frames → FFmpeg → MP4
```

### Project Structure

```
maps-test/
├── src/
│   ├── cli.js          # Main CLI application
│   ├── geocode.js      # Geocoding service (Nominatim)
│   ├── cameraPath.js   # Camera path computation
│   ├── renderer.js     # CesiumJS renderer (Puppeteer)
│   └── video.js        # Video export (FFmpeg)
├── frames/             # Temporary frame storage
├── package.json
└── README.md
```

## Configuration

### Environment Variables

- `PUPPETEER_EXECUTABLE_PATH`: Path to Chrome/Chromium executable (optional)

Example:
```bash
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Troubleshooting

### Browser Not Found

If you get an error about browser not being found, make sure Chrome or Chromium is installed, or set the executable path:

```bash
export PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
```

### FFmpeg Not Found

Install FFmpeg using your package manager:
- Ubuntu/Debian: `sudo apt-get install ffmpeg`
- macOS: `brew install ffmpeg`

### Geocoding Rate Limits

The Nominatim API has usage limits. The tool includes a 1-second delay between requests to respect these limits. For production use, consider using an API key or self-hosted Nominatim instance.

## License

ISC

## Credits

- **CesiumJS**: 3D globe rendering (Apache 2.0 License)
- **OpenStreetMap**: Map data via Nominatim geocoding
- **FFmpeg**: Video encoding

## Contributing

Issues and pull requests are welcome!
