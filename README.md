# Reverse CLDR

The CLDR is available as [JSON files](https://github.com/unicode-org/cldr-json) and published into several npm modules. It's organized by locale and split into functional areas, making it easy to access one locale at a time. However, when trying to access it by functional area across all locales, it requires reading hundreds of files. Also, some properties have low cardinality and result in highly duplicated data.

This module consolidates data of a functional area into a single file for all locales (only *modern* locales actually). Every property becomes an object that contains all possible values as keys and a list of associated locales as values. The output is both in the form of a JS file that can be imported (and optimized so that only used properties are retained) or a JSON file that can be read in its entirety (with a simple de-duping mechanism to optimize memory consumption -- see `scripts/expandLocales.js`).

For example, the `defaultNumberingSystem` property in the `cldr-numbers-modern/main/af/numbers.json` file:

```json
{
  "main": {
    "af": {
      "numbers": {
        "defaultNumberingSystem": "latn",
        ...
```

Aggregated with the other 300+ locale files, becomes a single `numbers.json` file like (after expansion):

```json
{
    "numbers": {
        "defaultNumberingSystem": {
            "latn": [
                "af",
                "af-NA",
                "am",
                "ar-DZ",
                ...
                "zu"
            ],
            "arab": [
                "ar",
                ...
                "sd",
                "sd-Arab"
            ],
            "beng": [
                "as",
                "bn",
                "bn-IN"
            ],
            "arabext": [
                "fa",
                "fa-AF",
                "ps",
                "ps-PK",
                "ur-IN"
            ],
            "deva": [
                "mr",
                "ne",
                "ne-IN"
            ],
            "mymr": [
                "my"
            ]
        },
        ...
        }
    }
```

or `numbers.js` file like:

```js
export function numbers_defaultNumberingSystem() { return {"latn":["af","af-NA","am","ar-DZ","ar-EH","ar-LY","ar-MA","ar-TN","az","az-Latn","be","bg","bs","bs-Latn","ca","ca-AD","ca-ES-VALENCIA","ca-FR","ca-IT","cs","cy","da","da-GL","de","de-AT","de-BE","de-CH","de-IT","de-LI","de-LU","el","el-CY","en","en-001","en-150","en-AE","en-AG","en-AI","en-AS","en-AT","en-AU","en-BB","en-BE","en-BI","en-BM","en-BS","en-BW","en-BZ","en-CA","en-CC","en-CH","en-CK","en-CM","en-CX","en-CY","en-DE","en-DG","en-DK","en-DM","en-ER","en-FI","en-FJ","en-FK","en-FM","en-GB","en-GD","en-GG","en-GH","en-GI","en-GM","en-GU","en-GY","en-HK","en-IE","en-IL","en-IM","en-IN","en-IO","en-JE","en-JM","en-KE","en-KI","en-KN","en-KY","en-LC","en-LR","en-LS","en-MG","en-MH","en-MO","en-MP","en-MS","en-MT","en-MU","en-MW","en-MY","en-NA","en-NF","en-NG","en-NL","en-NR","en-NU","en-NZ","en-PG","en-PH","en-PK","en-PN","en-PR","en-PW","en-RW","en-SB","en-SC","en-SD","en-SE","en-SG","en-SH","en-SI","en-SL","en-SS","en-SX","en-SZ","en-TC","en-TK","en-TO","en-TT","en-TV","en-TZ","en-UG","en-UM","en-US-POSIX","en-VC","en-VG","en-VI","en-VU","en-WS","en-ZA","en-ZM","en-ZW","es","es-419","es-AR","es-BO","es-BR","es-BZ","es-CL","es-CO","es-CR","es-CU","es-DO","es-EA","es-EC","es-GQ","es-GT","es-HN","es-IC","es-MX","es-NI","es-PA","es-PE","es-PH","es-PR","es-PY","es-SV","es-US","es-UY","es-VE","et","eu","fi","fil","fr","fr-BE","fr-BF","fr-BI","fr-BJ","fr-BL","fr-CA","fr-CD","fr-CF","fr-CG","fr-CH","fr-CI","fr-CM","fr-DJ","fr-DZ","fr-GA","fr-GF","fr-GN","fr-GP","fr-GQ","fr-HT","fr-KM","fr-LU","fr-MA","fr-MC","fr-MF","fr-MG","fr-ML","fr-MQ","fr-MR","fr-MU","fr-NC","fr-NE","fr-PF","fr-PM","fr-RE","fr-RW","fr-SC","fr-SN","fr-SY","fr-TD","fr-TG","fr-TN","fr-VU","fr-WF","fr-YT","ga","ga-GB","gl","gu","he","hi","hr","hr-BA","hu","hy","id","is","it","it-CH","it-SM","it-VA","ja","jv","ka","kk","km","kn","ko","ko-KP","ky","lo","lt","lv","mk","ml","mn","ms","ms-BN","ms-ID","ms-SG","nb","nb-SJ","nl","nl-AW","nl-BE","nl-BQ","nl-CW","nl-SR","nl-SX","nn","no","or","pa","pa-Guru","pl","pt","pt-AO","pt-CH","pt-CV","pt-GQ","pt-GW","pt-LU","pt-MO","pt-MZ","pt-PT","pt-ST","pt-TL","ro","ro-MD","root","ru","ru-BY","ru-KG","ru-KZ","ru-MD","ru-UA","si","sk","sl","so","so-DJ","so-ET","so-KE","sq","sq-MK","sq-XK","sr","sr-Cyrl","sr-Cyrl-BA","sr-Cyrl-ME","sr-Cyrl-XK","sr-Latn","sr-Latn-BA","sr-Latn-ME","sr-Latn-XK","sv","sv-AX","sv-FI","sw","sw-CD","sw-KE","sw-UG","ta","ta-LK","ta-MY","ta-SG","te","th","tk","tr","tr-CY","uk","ur","uz","uz-Latn","vi","yue","yue-Hant","zh","zh-Hans","zh-Hans-HK","zh-Hans-MO","zh-Hans-SG","zh-Hant","zh-Hant-HK","zh-Hant-MO","zu"],"arab":["ar","ar-AE","ar-BH","ar-DJ","ar-EG","ar-ER","ar-IL","ar-IQ","ar-JO","ar-KM","ar-KW","ar-LB","ar-MR","ar-OM","ar-PS","ar-QA","ar-SA","ar-SD","ar-SO","ar-SS","ar-SY","ar-TD","ar-YE","sd","sd-Arab"],"beng":["as","bn","bn-IN"],"arabext":["fa","fa-AF","ps","ps-PK","ur-IN"],"deva":["mr","ne","ne-IN"],"mymr":["my"]} }
```
