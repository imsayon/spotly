#!/bin/bash

# 🎫 Spotly Consumer System - Quick Start Script

echo "╔═══════════════════════════════════════════════════════╗"
echo "║    🎫 Spotly Consumer System - Quick Setup          ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ or higher."
    exit 1
fi
echo "✅ Node.js $(node -v)"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$(dirname "$0")/server/consumer-api"
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$(dirname "$0")/client/consumer"
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed"
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                 Setup Complete! ✅              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣ Start the backend (in a new terminal):"
echo "   cd server/consumer-api"
echo "   npm run dev"
echo ""
echo "2️⃣ Start the frontend (in another terminal):"
echo "   cd client/consumer"
echo "   npm start"
echo ""
echo "3️⃣ Open the app on your device/emulator and test!"
echo ""
