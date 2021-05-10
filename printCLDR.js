const fs = require('fs');

const {locales, localeSets, reverseCLDR} = JSON.parse(fs.readFileSync(process.argv[2]));

const expandedLocaleSets = localeSets.map(str => Array.from(str).map(localeChar => locales[localeChar.charCodeAt(0) - 32]));

function expandLS(obj) {
    for (const k of Object.keys(obj)) {
        if (typeof Object.values(obj[k])[0] === 'object') {
            expandLS(obj[k]);
        } else {
            Object.entries(obj[k]).forEach(([v, ls]) => obj[k][v] = expandedLocaleSets[ls]);
        }
    }
}
expandLS(reverseCLDR);
console.log(JSON.stringify(reverseCLDR, null, 2));
