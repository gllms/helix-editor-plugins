// Keyed by SPDX identifier as GitHub reports them, e.g. "GPL-3.0" rather than "GPL-3.0-only"
const allowedLicenses: Record<string, string> = {
  "0BSD": "BSD Zero Clause License",
  "AGPL-3.0": "GNU Affero General Public License v3.0",
  "Apache-2.0": "Apache License 2.0",
  "BSD-2-Clause": 'BSD 2-Clause "Simplified" License',
  "BSD-3-Clause": 'BSD 3-Clause "New" or "Revised" License',
  "BSL-1.0": "Boost Software License 1.0",
  "CC0-1.0": "Creative Commons Zero v1.0 Universal",
  "EPL-2.0": "Eclipse Public License 2.0",
  "EUPL-1.2": "European Union Public License 1.2",
  "GPL-2.0": "GNU General Public License v2.0",
  "GPL-3.0": "GNU General Public License v3.0",
  ISC: "ISC License",
  "LGPL-2.1": "GNU Lesser General Public License v2.1",
  "LGPL-3.0": "GNU Lesser General Public License v3.0",
  MIT: "MIT License",
  "MIT-0": "MIT No Attribution",
  "MPL-2.0": "Mozilla Public License 2.0",
  Unlicense: "The Unlicense",
  Zlib: "zlib License",
};

export function getAllowedLicenseName(spdxId: string): string | undefined {
  return Object.hasOwn(allowedLicenses, spdxId) ? allowedLicenses[spdxId] : undefined;
}

// Checked in order, so licenses that mention another license (like the AGPL mentioning the GPL)
// have to come before it
const licensePhrases: [spdxId: string, phrase: RegExp][] = [
  ["AGPL-3.0", /gnu affero general public license version 3/],
  ["LGPL-3.0", /gnu lesser general public license version 3/],
  ["LGPL-2.1", /gnu lesser general public license version 2\.1/],
  ["GPL-3.0", /gnu general public license version 3/],
  ["GPL-2.0", /gnu general public license version 2/],
  ["MPL-2.0", /mozilla public license,? version 2\.0/],
  ["Apache-2.0", /apache license,? version 2\.0/],
  [
    "MIT",
    /permission is hereby granted, free of charge.*the above copyright notice and this permission notice shall be included/,
  ],
  ["MIT-0", /permission is hereby granted, free of charge/],
  ["BSD-3-Clause", /redistribution and use in source and binary forms.*neither the name/],
  ["BSD-2-Clause", /redistribution and use in source and binary forms/],
  [
    "ISC",
    /permission to use, copy, modify, and\/or distribute this software for any purpose with or without fee is hereby granted, provided that/,
  ],
  [
    "0BSD",
    /permission to use, copy, modify, and\/or distribute this software for any purpose with or without fee is hereby granted/,
  ],
  ["Unlicense", /this is free and unencumbered software released into the public domain/],
];

export function detectLicense(text: string): string | null {
  const normalized = text
    .toLowerCase()
    .replace(/[#*_>`]/g, " ")
    .replace(/\s+/g, " ");

  return licensePhrases.find(([, phrase]) => phrase.test(normalized))?.[0] ?? null;
}
