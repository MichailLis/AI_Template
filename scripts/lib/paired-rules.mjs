const TOP_LEVEL_DECL_REGEX =
  /^(?:export\s+(?:default\s+|abstract\s+)?|abstract\s+)?(?:const\s+|(?:async\s+)?function(?:\s*\*|\s+)|class\s+)([a-zA-Z0-9_$]+)\b/;

export const isTestOrSpecPath = (path) =>
  path.endsWith('.test.ts') || path.endsWith('.test.tsx') || path.endsWith('.spec.ts');

export const isIgnoredClientPath = (path) => {
  const norm = path.replace(/\\/g, '/');
  return (
    norm.startsWith('client/src/shared/api/generated/') ||
    norm.startsWith('client/src/shared/api/model/')
  );
};

export const extractTopLevelDeclarations = (source) => {
  if (typeof source !== 'string') return [];
  const lines = source.split(/\r?\n/);
  const declarations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(TOP_LEVEL_DECL_REGEX);
    if (match) {
      declarations.push({
        name: match[1],
        line: i + 1,
        raw: line.trim(),
      });
    }
  }

  return declarations;
};

export const parseConstantLiteral = (source, name) => {
  if (typeof source !== 'string' || !name) return null;
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `^(?:export\\s+)?const\\s+${escapedName}\\b(?:\\s*:\\s*[^=]+)?\\s*=\\s*([^;\\r\\n]+);`,
    'm',
  );
  const match = source.match(pattern);
  if (!match) return null;

  const raw = match[1].trim();

  if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
    return Number(raw);
  }

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('`') && raw.endsWith('`'))
  ) {
    return raw.slice(1, -1);
  }

  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;

  return raw;
};

export const validateRegistryStructure = (registry) => {
  const errors = [];
  if (!registry || typeof registry !== 'object') {
    return { ok: false, errors: ['Registry must be a valid JSON object'] };
  }

  if (registry.version !== 1) {
    errors.push('Registry must declare "version": 1');
  }

  if (!Array.isArray(registry.rules)) {
    errors.push('Registry must contain a "rules" array');
    return { ok: false, errors };
  }

  const seenNames = new Set();

  for (const [index, rule] of registry.rules.entries()) {
    const ruleId = rule.name ?? `rule[${index}]`;

    if (!rule.name || typeof rule.name !== 'string') {
      errors.push(`Rule at index ${index} must have a non-empty "name" string`);
      continue;
    }

    if (seenNames.has(rule.name)) {
      errors.push(`Duplicate rule name "${rule.name}" in registry`);
    }
    seenNames.add(rule.name);

    if (!['constant', 'behaviour', 'unrelated'].includes(rule.type)) {
      errors.push(
        `Rule "${ruleId}" has invalid type "${rule.type}". Expected "constant", "behaviour", or "unrelated"`,
      );
    }

    if (!rule.client || typeof rule.client !== 'object' || !rule.client.file) {
      errors.push(`Rule "${ruleId}" must define client.file path`);
    }

    if (!rule.server || typeof rule.server !== 'object' || !rule.server.file) {
      errors.push(`Rule "${ruleId}" must define server.file path`);
    }

    if (rule.type === 'unrelated') {
      if (!rule.reason || typeof rule.reason !== 'string' || rule.reason.trim() === '') {
        errors.push(`Unrelated rule "${ruleId}" must provide a non-empty text reason`);
      }
    }

    if (rule.type === 'constant' || rule.type === 'behaviour') {
      if (!['server', 'client'].includes(rule.authority)) {
        errors.push(
          `Paired rule "${ruleId}" must declare authority as "server" or "client", got "${rule.authority}"`,
        );
      }
    }

    if (rule.type === 'behaviour') {
      if (!rule.client?.testFile) {
        errors.push(`Behaviour rule "${ruleId}" must define client.testFile`);
      }
      if (!rule.server?.testFile) {
        errors.push(`Behaviour rule "${ruleId}" must define server.testFile`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
};

export const scanTopLevelSymbols = ({ clientFiles = [], serverFiles = [] }) => {
  const clientDeclarations = new Map();
  const serverDeclarations = new Map();

  for (const file of clientFiles) {
    if (isTestOrSpecPath(file.relativePath) || isIgnoredClientPath(file.relativePath)) {
      continue;
    }
    const decls = extractTopLevelDeclarations(file.source);
    for (const decl of decls) {
      if (!clientDeclarations.has(decl.name)) {
        clientDeclarations.set(decl.name, []);
      }
      clientDeclarations.get(decl.name).push({
        relativePath: file.relativePath,
        line: decl.line,
        raw: decl.raw,
      });
    }
  }

  for (const file of serverFiles) {
    if (isTestOrSpecPath(file.relativePath)) {
      continue;
    }
    const decls = extractTopLevelDeclarations(file.source);
    for (const decl of decls) {
      if (!serverDeclarations.has(decl.name)) {
        serverDeclarations.set(decl.name, []);
      }
      serverDeclarations.get(decl.name).push({
        relativePath: file.relativePath,
        line: decl.line,
        raw: decl.raw,
      });
    }
  }

  const commonNames = Array.from(clientDeclarations.keys())
    .filter((name) => serverDeclarations.has(name))
    .sort();

  return {
    commonNames,
    clientDeclarations,
    serverDeclarations,
  };
};

export const verifyPairedRules = ({
  registry,
  vectorsDoc,
  clientFiles = [],
  serverFiles = [],
  readContent,
  fileExists,
}) => {
  const errors = [];

  // Check 1: Registry validity
  const structResult = validateRegistryStructure(registry);
  if (!structResult.ok) {
    errors.push(...structResult.errors);
    return { ok: false, errors, stats: null, commonSymbols: [] };
  }

  const rules = registry.rules;
  const registeredNames = new Set(rules.map((r) => r.name));

  for (const rule of rules) {
    const clientFile = rule.client.file;
    const serverFile = rule.server.file;

    if (!fileExists(clientFile)) {
      errors.push(`Rule "${rule.name}": client file "${clientFile}" does not exist`);
    } else {
      const clientContent = readContent(clientFile);
      const decls = extractTopLevelDeclarations(clientContent);
      if (!decls.some((d) => d.name === rule.name)) {
        errors.push(
          `Rule "${rule.name}": declaration "${rule.name}" not found at top level of client file "${clientFile}"`,
        );
      }
    }

    if (!fileExists(serverFile)) {
      errors.push(`Rule "${rule.name}": server file "${serverFile}" does not exist`);
    } else {
      const serverContent = readContent(serverFile);
      const decls = extractTopLevelDeclarations(serverContent);
      if (!decls.some((d) => d.name === rule.name)) {
        errors.push(
          `Rule "${rule.name}": declaration "${rule.name}" not found at top level of server file "${serverFile}"`,
        );
      }
    }
  }

  // Check 2: Constant values match
  const constantRules = rules.filter((r) => r.type === 'constant');
  for (const rule of constantRules) {
    if (fileExists(rule.client.file) && fileExists(rule.server.file)) {
      const clientContent = readContent(rule.client.file);
      const serverContent = readContent(rule.server.file);

      const clientValue = parseConstantLiteral(clientContent, rule.name);
      const serverValue = parseConstantLiteral(serverContent, rule.name);

      if (clientValue === null) {
        errors.push(
          `Constant "${rule.name}": failed to parse constant literal in client file "${rule.client.file}"`,
        );
      }
      if (serverValue === null) {
        errors.push(
          `Constant "${rule.name}": failed to parse constant literal in server file "${rule.server.file}"`,
        );
      }

      if (clientValue !== null && serverValue !== null && clientValue !== serverValue) {
        errors.push(
          `Constant "${rule.name}" value mismatch: client (${rule.client.file}) has ${JSON.stringify(
            clientValue,
          )}, server (${rule.server.file}) has ${JSON.stringify(serverValue)}`,
        );
      }
    }
  }

  // Check 3: Closing rule (intersection of client and server symbols must all be in registry)
  const { commonNames, clientDeclarations, serverDeclarations } = scanTopLevelSymbols({
    clientFiles,
    serverFiles,
  });

  for (const name of commonNames) {
    if (!registeredNames.has(name)) {
      const clientLocations = (clientDeclarations.get(name) ?? [])
        .map((d) => `${d.relativePath}:${d.line}`)
        .join(', ');
      const serverLocations = (serverDeclarations.get(name) ?? [])
        .map((d) => `${d.relativePath}:${d.line}`)
        .join(', ');
      errors.push(
        `Undeclared paired symbol "${name}" found in both trees: client [${clientLocations}], server [${serverLocations}]. ` +
          `Every symbol declared at top level in both trees must be registered in template/paired-rules.json ` +
          `as constant, behaviour, or unrelated.`,
      );
    }
  }

  // Check 4: Vectors connected for behaviour pairs
  const behaviourRules = rules.filter((r) => r.type === 'behaviour');
  if (behaviourRules.length > 0) {
    if (!vectorsDoc || typeof vectorsDoc !== 'object' || !vectorsDoc.vectors) {
      errors.push(
        'Vectors document template/paired-rules.vectors.json is missing or does not contain "vectors" object',
      );
    } else {
      for (const rule of behaviourRules) {
        const vectors = vectorsDoc.vectors[rule.name];
        if (!Array.isArray(vectors)) {
          errors.push(
            `Behaviour rule "${rule.name}" has no vector array in template/paired-rules.vectors.json`,
          );
        } else if (vectors.length < 6) {
          errors.push(
            `Behaviour rule "${rule.name}" has only ${vectors.length} vectors in template/paired-rules.vectors.json (minimum 6 required)`,
          );
        } else {
          for (const [vIdx, vec] of vectors.entries()) {
            if (!vec || typeof vec !== 'object' || !('input' in vec) || !('expected' in vec)) {
              errors.push(
                `Behaviour rule "${rule.name}" vector[${vIdx}] must contain both "input" and "expected" properties`,
              );
            }
          }
        }

        // Check client test file
        const clientTestFile = rule.client.testFile;
        if (!fileExists(clientTestFile)) {
          errors.push(
            `Behaviour rule "${rule.name}": client test file "${clientTestFile}" does not exist`,
          );
        } else {
          const content = readContent(clientTestFile);
          if (!content.includes('paired-rules.vectors.json')) {
            errors.push(
              `Behaviour rule "${rule.name}": client test file "${clientTestFile}" does not read or import template/paired-rules.vectors.json`,
            );
          }
          if (!content.includes(rule.name)) {
            errors.push(
              `Behaviour rule "${rule.name}": client test file "${clientTestFile}" does not reference symbol "${rule.name}"`,
            );
          }
        }

        // Check server test file
        const serverTestFile = rule.server.testFile;
        if (!fileExists(serverTestFile)) {
          errors.push(
            `Behaviour rule "${rule.name}": server test file "${serverTestFile}" does not exist`,
          );
        } else {
          const content = readContent(serverTestFile);
          if (!content.includes('paired-rules.vectors.json')) {
            errors.push(
              `Behaviour rule "${rule.name}": server test file "${serverTestFile}" does not read or import template/paired-rules.vectors.json`,
            );
          }
          if (!content.includes(rule.name)) {
            errors.push(
              `Behaviour rule "${rule.name}": server test file "${serverTestFile}" does not reference symbol "${rule.name}"`,
            );
          }
        }
      }
    }
  }

  const stats = {
    totalRules: rules.length,
    behaviourCount: behaviourRules.length,
    constantCount: constantRules.length,
    unrelatedCount: rules.filter((r) => r.type === 'unrelated').length,
    commonSymbolsCount: commonNames.length,
  };

  return {
    ok: errors.length === 0,
    errors,
    stats,
    commonSymbols: commonNames,
  };
};
