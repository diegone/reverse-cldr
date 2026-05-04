const availableLocales = require('cldr-core/availableLocales.json');
const {effectiveCoverageLevels} = require('cldr-core/coverageLevels.json');
const defaultContent = require('cldr-core/defaultContent.json');
const availableLocaleSet = new Set(availableLocales.availableLocales.full);
const fs = require('fs');
const path = require('path');

function findDataLocale(locale) {
    const parts = locale.split('-');
    while (parts.length > 0) {
        const candidate = parts.join('-');
        if (availableLocaleSet.has(candidate)) {
            return candidate;
        }
        parts.pop();
    }
    return null;
}

const localeDataEntries = defaultContent.defaultContent
    .map(locale => ({locale, dataLocale: findDataLocale(locale)}))
    .filter(({dataLocale}) => dataLocale && effectiveCoverageLevels[dataLocale] === 'modern');

const locales = localeDataEntries.map(({locale}) => locale);
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
    
    function appendLocaleData(locale, dataLocale, module, file) {
        const modulePath = path.dirname(require.resolve(`${module}/package.json`));
        const dataFilePath = path.join(modulePath, 'main', dataLocale, file);
        if (fs.existsSync(dataFilePath)) {
            const localeData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8')).main[dataLocale];
            delete localeData.identity;
            appendObject(reverseCLDR, localeData, String.fromCharCode(32 + localeIdx[locale]));
        } else {
            console.log(`File ${file} in module ${module} is missing in locale ${locale} (${dataLocale})`);
        }
    }
    
    for (const {locale, dataLocale} of localeDataEntries) {
        appendLocaleData(locale, dataLocale, packageName, `${dataFileName}.json`);
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

generateReverseCLDR('cldr-numbers-full', 'numbers');
generateReverseCLDR('cldr-numbers-full', 'currencies');
generateReverseCLDR('cldr-dates-full', 'ca-generic');
generateReverseCLDR('cldr-dates-full', 'ca-gregorian');
generateReverseCLDR('cldr-dates-full', 'dateFields');
generateReverseCLDR('cldr-dates-full', 'timeZoneNames');
