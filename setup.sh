#!/bin/bash

# CheatLock AI - Quick Setup Script
# This script helps you set up the project quickly

echo "🔐 CheatLock AI - Quick Setup"
echo "================================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Navigate to client directory
cd client || exit

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Setup environment file
echo "⚙️  Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local with your Supabase credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
else
    echo "ℹ️  .env.local already exists"
    echo ""
fi

# Instructions
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Edit client/.env.local with your Supabase credentials"
echo "3. Run the database schema:"
echo "   - Open Supabase SQL Editor"
echo "   - Copy contents of supabase/schema.sql"
echo "   - Execute the SQL"
echo "4. Create storage bucket 'violation-snapshots' (public)"
echo "5. Run the development server:"
echo "   cd client && npm run dev"
echo ""
echo "📚 For detailed instructions, see INSTALLATION.md"
echo ""
