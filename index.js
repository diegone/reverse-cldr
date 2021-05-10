const availableLocales = require('cldr-core/availableLocales.json');
const locales = availableLocales.availableLocales.modern;
const fs = require('fs');
const path = require('path');

const localeIdx = {};
locales.forEach((l, idx) => localeIdx[l] = idx);

function generateReverseCLDR(packageName, dataFileName) {
    const reverseCLDR = {};

    function appendObject(cldrParent, obj, localeChar) {
        if (typeof obj === 'object') {
            for (const k of Object.keys(obj)) {
                cldrParent[k] = cldrParent[k] || {};
                appendObject(cldrParent[k], obj[k], localeChar);
            }
        } else { // in this case `obj` is actually a leaf
            cldrParent[obj] = (cldrParent[obj] || '') + localeChar;
        }
    }
    
    function appendLocaleData(locale, module, file) {
        const modulePath = path.dirname(require.resolve(`${module}/package.json`));
        const dataFilePath = path.join(modulePath, 'main', locale, file);
        if (fs.existsSync(dataFilePath)) {
            const localeData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8')).main[locale];
            delete localeData.identity;
            appendObject(reverseCLDR, localeData, String.fromCharCode(32 + localeIdx[locale]));
        } else {
            console.log(`File ${file} in module ${module} is missing in locale ${locale}`);
        }
    }
    
    for (const locale of locales) {
        appendLocaleData(locale, packageName, `${dataFileName}.json`);
    }
    
    function traverseCLDR(cb, node, parent, slug) {
        const obj = node || reverseCLDR;
        for (const k of Object.keys(obj)) {
            if (typeof Object.values(obj[k])[0] === 'object') {
                traverseCLDR(cb, obj[k], obj, slug ? slug + '_' + k : k);
            } else {
                cb(obj, k, parent, slug);
            }
        }
    }
    
    // Trim high cardinality values at an arbitrary 12 threshold
    // traverseCLDR((obj, k) => (Object.keys(obj[k]).length > 12 && delete obj[k]));
    
    // Collect all used locale sets
    let localeSetStats = {};
    traverseCLDR((obj, k) => Object.values(obj[k]).forEach(ls => localeSetStats[ls] = (localeSetStats[ls] || 0) + 1));
    
    // Create indexes of each locale set, most frequent first
    let localeSets = Object.keys(localeSetStats).sort((a, b) => localeSetStats[b] - localeSetStats[a]);
    localeSets.forEach((ls, idx) => localeSetStats[ls] = idx);
    
    // Replace locale sets with corresponding index
    traverseCLDR((obj, k) => Object.entries(obj[k]).forEach(([v, ls]) => obj[k][v] = localeSetStats[ls]));
    
    fs.writeFileSync(`${dataFileName}.json`, JSON.stringify({locales, localeSets, reverseCLDR}, null, 2));
    
    // Create verbose locale lists
    const expandedLocaleSets = localeSets.map(str => Array.from(str).map(localeChar => locales[localeChar.charCodeAt(0) - 32]));
    // traverseCLDR((obj, k) => Object.entries(obj[k]).forEach(([v, ls]) => obj[k][v] = expandedLocaleSets[ls]));
    
    const moduleSource = [];
    traverseCLDR((obj, k, parent, slug) => {
        Object.entries(obj[k]).forEach(([v, ls]) => obj[k][v] = expandedLocaleSets[ls]);
        moduleSource.push(`export function ${slug.replace(/-/g, '_')}_${k.replace(/-/g, '_')}() { return ${JSON.stringify(obj[k])} }`);
    });
    fs.writeFileSync(`${dataFileName}.js`, moduleSource.join('\n'));    
}

generateReverseCLDR('cldr-numbers-modern', 'numbers');
generateReverseCLDR('cldr-numbers-modern', 'currencies');
generateReverseCLDR('cldr-dates-modern', 'ca-generic');
generateReverseCLDR('cldr-dates-modern', 'ca-gregorian');
generateReverseCLDR('cldr-dates-modern', 'dateFields');
generateReverseCLDR('cldr-dates-modern', 'timeZoneNames');
