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
DATABASE_URL="postgresql://dreamseed:WSX2rFv67890%21@5.161.248.184:5432/dreamseed?schema=public"
NUXT_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE"
NUXT_GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET_HERE"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
NUXT_NEXTAUTH_SECRET_VALUE="YOUR_NEXTAUTH_SECRET_HERE"
EOF

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  IMPORTANT: You need to replace the placeholder values with actual secrets:"
echo "   - NUXT_GOOGLE_CLIENT_ID"
echo "   - NUXT_GOOGLE_CLIENT_SECRET"
echo "   - GEMINI_API_KEY"
echo "   - NUXT_NEXTAUTH_SECRET_VALUE"
echo ""
echo "Edit the file with: nano /var/www/dreamseed/.env"
echo "Then restart PM2 with: pm2 restart ecosystem.config.cjs --env prod"
echo ""
echo "Current .env file content (partial):"
while IFS='=' read -r key value; do
    if [[ $key && $value && ! $key =~ ^# ]]; then
        echo "- $key: ${value:0:15}..."
    fi
done < .env 