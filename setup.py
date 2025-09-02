#!/usr/bin/env python3
"""
Setup script for AI Support Widget
Handles environment configuration and initial setup
"""

import os
import shutil
import sys
from pathlib import Path

def create_env_file():
    """Create .env file from template if it doesn't exist"""
    env_example = Path("env.example")
    env_file = Path(".env")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return
    
    if not env_example.exists():
        print("❌ env.example file not found")
        return
    
    try:
        shutil.copy(env_example, env_file)
        print("✅ Created .env file from template")
        print("⚠️  Please edit .env with your actual API keys")
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")

def check_requirements():
    """Check if required dependencies are available"""
    print("🔍 Checking requirements...")
    
    # Check Python packages
    required_packages = [
        "fastapi",
        "uvicorn", 
        "openai",
        "pinecone-client",
        "python-dotenv"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing Python packages: {', '.join(missing_packages)}")
        print("📦 Install with: pip install -r backend/requirements.txt")
    else:
        print("✅ All Python packages are installed")
    
    # Check Node.js dependencies
    widget_node_modules = Path("widget/node_modules")
    if not widget_node_modules.exists():
        print("❌ Widget dependencies not installed")
        print("📦 Install with: cd widget && npm install")
    else:
        print("✅ Widget dependencies are installed")

def main():
    """Main setup function"""
    print("🚀 Setting up AI Support Widget...")
    print("=" * 50)
    
    create_env_file()
    check_requirements()
    
    print("\n" + "=" * 50)
    print("🎉 Setup complete!")
    print("\n📋 Next steps:")
    print("1. Edit .env with your actual API keys")
    print("2. Install backend dependencies: pip install -r backend/requirements.txt")
    print("3. Install frontend dependencies: cd widget && npm install")
    print("4. Start backend: cd backend && python main.py")
    print("5. Start frontend: cd widget && npm run dev")

if __name__ == "__main__":
    main()
