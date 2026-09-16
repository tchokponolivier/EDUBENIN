const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

const setSettingsTarget = `setSettings({
        name: data.name,
        address: data.locality,
        contact: data.contacts,`;

const setSettingsReplace = `setSettings({
        name: data.name,
        address: data.locality,
        contact: data.contacts,`;

// Wait, where is it fetched? Let's check where setSettings is called.
