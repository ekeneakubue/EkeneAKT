const { execSync } = require('child_process');
try {
    const output = execSync('npx prisma validate', { stdio: 'pipe', encoding: 'utf8' });
    console.log('SUCCESS:');
    console.log(output);
} catch (err) {
    console.log('ERROR:');
    console.log(err.stdout);
    console.log(err.stderr);
}
