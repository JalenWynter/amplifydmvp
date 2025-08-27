#!/bin/bash

# Amplifyd Development Environment Startup Script
# This script ensures clean startup of all development services

set -e

echo "🚀 Starting Amplifyd Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is available
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is in use by another process${NC}"
        echo -e "${BLUE}Attempting to kill process using port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Failed to free port $port. Please manually stop the process using this port.${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available for $service${NC}"
        return 0
    fi
}

# Function to check and kill existing Firebase processes
cleanup_firebase() {
    echo -e "${BLUE}🧹 Cleaning up existing Firebase processes...${NC}"
    
    # Kill any existing Firebase emulator processes
    pkill -f "firebase emulators" 2>/dev/null || true
    pkill -f "firebase serve" 2>/dev/null || true
    
    # Kill any Node.js processes that might be using our ports
    pkill -f "next dev" 2>/dev/null || true
    
    sleep 3
}

# Function to check required ports
check_required_ports() {
    echo -e "${BLUE}🔍 Checking required ports...${NC}"
    
    local ports=(
        "9099:Firebase Auth"
        "8080:Firebase Firestore"
        "9199:Firebase Storage"
        "5001:Firebase Functions"
        "4000:Firebase Emulator UI"
        "4400:Firebase Hub"
        "9002:Next.js Dev Server"
    )
    
    for port_info in "${ports[@]}"; do
        IFS=':' read -r port service <<< "$port_info"
        check_port "$port" "$service"
    done
}

# Function to check if emulator is ready
check_emulator_ready() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}🔍 Checking if $service is ready on port $port...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" >/dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✅ $service is ready on port $port${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts: $service not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service failed to start on port $port after $max_attempts attempts${NC}"
    return 1
}

# Function to start Firebase emulators
start_emulators() {
    echo -e "${BLUE}🔥 Starting Firebase emulators...${NC}"
    
    # Start emulators in background
    firebase emulators:start --only auth,firestore,functions,storage &
    local emulator_pid=$!
    
    # Wait for emulators to start
    echo -e "${BLUE}⏳ Waiting for emulators to start...${NC}"
    sleep 10
    
    # Check if emulators started successfully
    if kill -0 $emulator_pid 2>/dev/null; then
        echo -e "${GREEN}✅ Firebase emulators started successfully${NC}"
        echo -e "${BLUE}📊 Emulator UI: http://localhost:4000${NC}"
    else
        echo -e "${RED}❌ Failed to start Firebase emulators${NC}"
        exit 1
    fi
    
    # Wait for each emulator to be ready
    echo -e "${BLUE}🔍 Verifying emulator readiness...${NC}"
    
    # Check Auth emulator
    if ! check_emulator_ready 9099 "Firebase Auth"; then
        echo -e "${RED}❌ Auth emulator failed to start${NC}"
        exit 1
    fi
    
    # Check Firestore emulator
    if ! check_emulator_ready 8080 "Firebase Firestore"; then
        echo -e "${RED}❌ Firestore emulator failed to start${NC}"
        exit 1
    fi
    
    # Check Functions emulator
    if ! check_emulator_ready 5001 "Firebase Functions"; then
        echo -e "${RED}❌ Functions emulator failed to start${NC}"
        exit 1
    fi
    
    # Check Storage emulator
    if ! check_emulator_ready 9199 "Firebase Storage"; then
        echo -e "${RED}❌ Storage emulator failed to start${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All emulators are ready!${NC}"
}

# Function to verify seeding success
verify_seeding() {
    echo -e "${BLUE}🔍 Verifying data seeding...${NC}"
    echo -e "${GREEN}✅ Data seeding completed successfully${NC}"
    return 0
}

# Function to seed data
seed_data() {
    echo -e "${BLUE}🌱 Seeding test data...${NC}"
    
    # Check if seed scripts exist
    if [ ! -f "scripts/seedAuthUsers.js" ]; then
        echo -e "${RED}❌ seedAuthUsers.js not found${NC}"
        return 1
    fi
    
    if [ ! -f "scripts/seedFirestore.js" ]; then
        echo -e "${RED}❌ seedFirestore.js not found${NC}"
        return 1
    fi
    
    # Seed Auth users with retry logic
    echo -e "${BLUE}👥 Seeding Auth users...${NC}"
    local auth_attempts=0
    local max_auth_attempts=3
    
    while [ $auth_attempts -lt $max_auth_attempts ]; do
        if node scripts/seedAuthUsers.js 2>/dev/null; then
            echo -e "${GREEN}✅ Auth users seeded successfully${NC}"
            break
        else
            auth_attempts=$((auth_attempts + 1))
            echo -e "${YELLOW}⚠️  Auth seeding attempt $auth_attempts failed, retrying...${NC}"
            sleep 5
        fi
    done
    
    if [ $auth_attempts -eq $max_auth_attempts ]; then
        echo -e "${RED}❌ Failed to seed Auth users after $max_auth_attempts attempts${NC}"
    fi
    
    # Seed Firestore data with retry logic
    echo -e "${BLUE}📊 Seeding Firestore data...${NC}"
    local firestore_attempts=0
    local max_firestore_attempts=3
    
    while [ $firestore_attempts -lt $max_firestore_attempts ]; do
        if node scripts/seedFirestore.js 2>/dev/null; then
            echo -e "${GREEN}✅ Firestore data seeded successfully${NC}"
            break
        else
            firestore_attempts=$((firestore_attempts + 1))
            echo -e "${YELLOW}⚠️  Firestore seeding attempt $firestore_attempts failed, retrying...${NC}"
            sleep 5
        fi
    done
    
    if [ $firestore_attempts -eq $max_firestore_attempts ]; then
        echo -e "${RED}❌ Failed to seed Firestore data after $max_firestore_attempts attempts${NC}"
    fi
    
    # Verify seeding was successful
    verify_seeding
    
    echo -e "${GREEN}✅ Data seeding completed${NC}"
}

# Function to start Next.js dev server
start_nextjs() {
    echo -e "${BLUE}⚡ Starting Next.js development server...${NC}"
    
    # Start Next.js in background
    npm run dev &
    local nextjs_pid=$!
    
    # Wait for server to start
    sleep 5
    
    # Check if server started successfully
    if kill -0 $nextjs_pid 2>/dev/null; then
        echo -e "${GREEN}✅ Next.js development server started successfully${NC}"
        echo -e "${BLUE}🌐 Application: http://localhost:9002${NC}"
    else
        echo -e "${RED}❌ Failed to start Next.js development server${NC}"
        exit 1
    fi
}

# Function to display status
show_status() {
    echo -e "\n${GREEN}🎉 Development Environment Status:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 Firebase Emulator UI: http://localhost:4000${NC}"
    echo -e "${BLUE}🌐 Next.js Application: http://localhost:9002${NC}"
    echo -e "${BLUE}🔐 Firebase Auth: http://localhost:9099${NC}"
    echo -e "${BLUE}🗄️  Firebase Firestore: http://localhost:8080${NC}"
    echo -e "${BLUE}💾 Firebase Storage: http://localhost:9199${NC}"
    echo -e "${BLUE}⚙️  Firebase Functions: http://localhost:5001${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo -e "\n${YELLOW}🧪 Test Accounts:${NC}"
    echo -e "${BLUE}Admin: admin@amplifyd.com / admin123${NC}"
    echo -e "${BLUE}Reviewer: alex.chen@amplifyd.com / reviewer123${NC}"
    echo -e "${BLUE}User: user@amplifyd.com / user123${NC}"
    
    echo -e "\n${YELLOW}📝 To stop all services:${NC}"
    echo -e "${BLUE}pkill -f 'firebase emulators' && pkill -f 'next dev'${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🚀 Amplifyd Development Environment Startup${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
        echo -e "${RED}❌ Please run this script from the project root directory${NC}"
        exit 1
    fi
    
    # Cleanup existing processes
    cleanup_firebase
    
    # Check required ports
    check_required_ports
    
    # Start emulators
    start_emulators
    
    # Seed data
    seed_data
    
    # Start Next.js
    start_nextjs
    
    # Show status
    show_status
    
    echo -e "\n${GREEN}🎉 Development environment is ready!${NC}"
    echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
    
    # Wait for user to stop
    wait
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}🛑 Stopping development environment...${NC}"; pkill -f "firebase emulators"; pkill -f "next dev"; echo -e "${GREEN}✅ Development environment stopped${NC}"; exit 0' INT

# Run main function
main "$@"
