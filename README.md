# Reverse CLDR

CLDR data is published as locale-oriented JSON files across several npm packages. That works well when reading one locale at a time, but it is inefficient when you need one functional area across many locales.

Reverse CLDR generates reverse lookup tables for low-cardinality CLDR data. Each generated file groups a functional area into objects where each possible CLDR value points back to the default-content locales that use it.

The generated files are created during package installation and are intentionally not checked into git.

## Generated Data

The generator currently emits these root-level files:

- `numbers.json` and `numbers.js`
- `currencies.json` and `currencies.js`
- `ca-generic.json` and `ca-generic.js`
- `ca-gregorian.json` and `ca-gregorian.js`
- `dateFields.json` and `dateFields.js`
- `timeZoneNames.json` and `timeZoneNames.js`

Only default-content locales with `modern` effective CLDR coverage are included. The locale labels come from `cldr-core/defaultContent.json`; the backing data locale is resolved from `cldr-core/availableLocales.json`; and the coverage filter comes from `cldr-core/coverageLevels.json`.

For CLDR 48.2.0, this produces 105 locales, starting with:

```json
[
  "af-ZA",
  "ak-GH",
  "am-ET",
  "ar-001",
  "as-IN",
  "az-Latn-AZ",
  "ba-RU",
  "be-BY",
  "bg-BG",
  "bn-BD",
  "bs-Latn-BA",
  "ca-ES"
]
```

## Example

For example, the CLDR `defaultNumberingSystem` value is stored per locale in `cldr-numbers-full`, such as `cldr-numbers-full/main/en/numbers.json`.

Reverse CLDR aggregates that property across the supported default-content locales. In expanded form, part of `numbers.json` looks like this:

```json
{
  "numbers": {
    "defaultNumberingSystem": {
      "latn": [
        "af-ZA",
        "ak-GH",
        "am-ET",
        "ar-001",
        "...",
        "zh-Hant-TW",
        "zu-ZA"
      ],
      "beng": [
        "as-IN",
        "bn-BD"
      ],
      "arabext": [
        "fa-IR",
        "ps-AF"
      ],
      "deva": [
        "mr-IN",
        "ne-NP"
      ],
      "mymr": [
        "my-MM"
      ],
      "arab": [
        "sd-Arab-PK"
      ]
    }
  }
}
```

The checked-in JSON format stores locale sets in a compact de-duplicated form. To expand one of those JSON files for inspection:

```sh
node scripts/expandLocales.js numbers.json
```

The generated JS files expose one function per leaf property. For example:

```js
import { numbers_defaultNumberingSystem } from "reverse-cldr/numbers.js";

const numberingSystems = numbers_defaultNumberingSystem();
```

## Installation And Regeneration

Installing the package runs the generator automatically:

```sh
npm install
```

The install lifecycle calls:

```sh
npm run regenerate
```

You can also run that command manually while developing. It regenerates the root-level `.json` and `.js` data files from the installed `cldr-*` dependencies.

Generated files are listed in `.gitignore`, so local regeneration does not add data artifacts to source control. If npm scripts are disabled with `--ignore-scripts`, run `npm run regenerate` before using the generated lookup files.
