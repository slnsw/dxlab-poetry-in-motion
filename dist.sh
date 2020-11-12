#!/bin/sh

rollup app/js/app.js --file bundle.js --format=iife
minify bundle.js > app/js/slnsw.ocr.min.js
rm bundle.js

mkdir -p dist/js
cp -r app/assets dist/
cp -r app/css dist/
cp -r app/img dist/
cp -r app/js/slnsw.ocr.min.js dist/js
cp app/dist.html dist/index.html
