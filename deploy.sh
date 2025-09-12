#!/bin/bash
# Script to deploy John Dough's Pizzeria Dashboard to Google Cloud

echo "Building the React application..."
rm -rf build  # Ensure we start with a fresh build
npm run build

echo "Adding cache-busting to the build..."
TIMESTAMP=$(date +%s)
cd build

# Find the actual main JS and CSS files
MAIN_JS=$(ls static/js/main.*.js 2>/dev/null | head -1 | xargs basename)
MAIN_CSS=$(ls static/css/main.*.css 2>/dev/null | head -1 | xargs basename)

if [ -n "$MAIN_JS" ] && [ -n "$MAIN_CSS" ]; then
  echo "Found JS file: $MAIN_JS"
  echo "Found CSS file: $MAIN_CSS"
  
  # Replace main.*.js and main.*.css references in index.html with cache-busting parameters
  sed -i.bak "s|/static/js/main\.[a-z0-9]\+\.js|/static/js/${MAIN_JS}?v=${TIMESTAMP}|g" index.html
  sed -i.bak "s|/static/css/main\.[a-z0-9]\+\.css|/static/css/${MAIN_CSS}?v=${TIMESTAMP}|g" index.html
  rm index.html.bak
else
  echo "Warning: Could not find main JS or CSS files. Skipping cache-busting."
fi

echo "Creating app.yaml with aggressive cache control..."
# Create a temporary app.yaml in the build directory with strong cache-control headers
cat > app.yaml << EOL
runtime: nodejs20

handlers:
# Serve static assets with no-cache for JS/CSS to ensure latest version
- url: /static/js/.*\.js
  static_dir: static/js
  secure: always
  http_headers:
    Cache-Control: "no-cache, no-store, must-revalidate"
    Pragma: "no-cache"
    Expires: "0"

- url: /static/css/.*\.css
  static_dir: static/css
  secure: always
  http_headers:
    Cache-Control: "no-cache, no-store, must-revalidate"
    Pragma: "no-cache"
    Expires: "0"

# Other static assets
- url: /static
  static_dir: static
  secure: always

# Serve other assets like favicon, manifest, etc.
- url: /(.*\.(json|ico|png|jpg|svg))
  static_files: \1
  upload: .*\.(json|ico|png|jpg|svg)
  secure: always

# Must be last - serves index.html for all other routes (SPA support)
- url: /.*
  static_files: index.html
  upload: index.html
  secure: always
  http_headers:
    Cache-Control: "no-cache, no-store, must-revalidate"
    Pragma: "no-cache"
    Expires: "0"
EOL

echo "App.yaml created with aggressive cache-busting settings"

# Deploy the application
../google-cloud-sdk/bin/gcloud app deploy --quiet --version=v$(date +%Y%m%d%H%M%S) --stop-previous-version

# Clean up
rm app.yaml
cd ..

echo "Deployment completed! New version is now live."
echo "Visit: https://pizza-inventory-system.nw.r.appspot.com?nocache=$(date +%s)"
echo "(The ?nocache parameter helps bypass browser cache)"
