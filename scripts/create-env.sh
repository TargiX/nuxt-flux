#!/bin/bash

# Script to manually create .env file on production server
# Run this if the GitHub Actions deployment fails to create the .env file

set -e

echo "Creating .env file for production server..."

# Navigate to the project directory
cd /var/www/dreamseed

# Backup existing .env if it exists
if [ -f .env ]; then
    echo "Backing up existing .env file..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Create the .env file with production values
cat > .env << 'EOF'
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE?schema=public"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET_HERE"
NEXTAUTH_URL="http://5.161.248.184:3000"
NUXT_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE"
NUXT_GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET_HERE"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
EOF

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  IMPORTANT: You need to replace the placeholder values with actual secrets:"
echo "   - NEXTAUTH_SECRET"
echo "   - NUXT_GOOGLE_CLIENT_ID"
echo "   - NUXT_GOOGLE_CLIENT_SECRET"
echo "   - GEMINI_API_KEY"
echo ""
echo "Edit the file with: nano /var/www/dreamseed/.env"
echo "Then restart PM2 with: pm2 restart ecosystem.config.cjs --env production --update-env"
echo ""
echo "Current .env file content (partial):"
while IFS='=' read -r key value; do
    if [[ $key && $value && ! $key =~ ^# ]]; then
        echo "- $key: ${value:0:15}..."
    fi
done < .env 