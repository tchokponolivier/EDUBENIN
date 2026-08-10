const fs = require('fs');
let authContent = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

const MOCK_SCHOOL_ID = '11111111-1111-4111-8111-111111111111';

authContent = authContent.replace(/"school_1"/g, `"${MOCK_SCHOOL_ID}"`);
authContent = authContent.replace(/"school_mock_1"/g, `"${MOCK_SCHOOL_ID}"`);
fs.writeFileSync('src/lib/auth.tsx', authContent);
