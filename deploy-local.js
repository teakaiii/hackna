// Local Deployment Preparation Script
// Run this locally to prepare files for InfinityFree deployment

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== ConcernTracker PRO - Deployment Preparation ===\n');

// Step 1: Clean up files
console.log('🧹 Cleaning up unnecessary files...');
const filesToRemove = [
    'debug-email.js',
    'test-email.js',
    'concerntracker.db',
    'server.log'
];

filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✓ Removed: ${file}`);
    }
});

// Step 2: Verify package.json
console.log('\n📦 Verifying package.json...');
const packageJson = require('./package.json');
if (!packageJson.engines) {
    packageJson.engines = { node: '>=14.0.0' };
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✓ Added Node.js engine requirement');
}

// Step 3: Create production .env template
console.log('\n⚙️  Creating production .env template...');
const envTemplate = `# Production Configuration for InfinityFree
NODE_ENV=production
PORT=3000

# MySQL Database (Get from InfinityFree Dashboard)
DB_HOST=your_mysql_host.infinityfree.com
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name

# Gmail Email Service
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your_16_char_app_password
FROM_EMAIL=noreply@concerntrack.app

# Base URL
PUBLIC_URL=https://if0_41647799.infinityfreeapp.com
SESSION_SECRET=your_random_secret_key_here
`;

fs.writeFileSync('.env.production', envTemplate);
console.log('✓ Created .env.production template');

// Step 4: Create deployment manifest
console.log('\n📋 Creating deployment manifest...');
const manifest = {
    deploymentDate: new Date().toISOString(),
    version: packageJson.version,
    files: fs.readdirSync('.').filter(f => 
        !f.startsWith('.') && 
        f !== 'node_modules' && 
        f !== '.git'
    ),
    requirements: {
        node: '>=14.0.0',
        mysql: '5.7+',
        ftp: 'required',
        ssh: 'recommended'
    },
    instructions: [
        '1. Upload all files to InfinityFree via FTP to htdocs/',
        '2. Run: npm install --production',
        '3. Copy .env.production to .env and fill in your credentials',
        '4. Run: npm start or use PM2 for persistent running'
    ]
};

fs.writeFileSync('deployment-manifest.json', JSON.stringify(manifest, null, 2));
console.log('✓ Created deployment-manifest.json');

// Step 5: Verify critical files exist
console.log('\n🔍 Verifying critical files...');
const criticalFiles = [
    'server-enhanced.js',
    'mysql-database-service.js',
    'real-email-service.js',
    'nlp-service.js',
    'ai-service.js',
    'database-notification-service.js',
    'package.json',
    '.htaccess'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✓ ${file} exists`);
    } else {
        console.log(`✗ ${file} MISSING`);
    }
});

console.log('\n✅ Deployment preparation complete!');
console.log('\n📝 Next steps:');
console.log('1. Review .env.production and fill in your InfinityFree credentials');
console.log('2. Upload files to InfinityFree via FTP');
console.log('3. Follow the instructions in DEPLOYMENT.md');
console.log('4. Use DEPLOYMENT-CHECKLIST.md to track progress');
console.log('\n📖 For detailed instructions, see DEPLOYMENT.md');
