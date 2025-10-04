#!/bin/bash

# Example 1: Simple journey between two cities
echo "Example 1: Paris to London"
node src/cli.js --places "Paris" "London" --output paris-london.mp4 --duration 5 --fps 30

# Example 2: Multi-city European tour
echo ""
echo "Example 2: European tour"
node src/cli.js --places "Rome" "Paris" "Berlin" "London" --output europe.mp4 --duration 12

# Example 3: World tour with custom resolution
echo ""
echo "Example 3: World tour"
node src/cli.js \
  --places "Tokyo" "Singapore" "Dubai" "Rome" "Paris" "New York" \
  --output world-tour.mp4 \
  --duration 15 \
  --fps 30 \
  --width 1280 \
  --height 720

# Example 4: Using coordinates
echo ""
echo "Example 4: Custom coordinates"
node src/cli.js \
  --places "48.8566,2.3522" "51.5074,-0.1278" "52.5200,13.4050" \
  --output custom.mp4 \
  --duration 8

echo ""
echo "All examples completed!"
