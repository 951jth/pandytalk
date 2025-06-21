#!/bin/bash

echo "🧹 Cleaning..."
rm -rf node_modules
rm -rf android/app/build
rm -rf .metro-cache
rm -rf .gradle
rm -f yarn.lock

echo "📦 Reinstalling..."
yarn cache clean
yarn install

echo "🛑 Killing Metro/Node..."
taskkill //F //IM node.exe
