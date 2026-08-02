const FIELD_RULES = {
  localSubmission: new Set(["pending", "complete"]),
  productVisualAcceptance: new Set(["pending", "passed", "rejected"]),
  publishAuthorization: new Set(["pending", "confirmed"]),
  onlineRelease: new Set(["pending", "complete", "partial"]),
};

const FIELD_PATTERN = /^(localSubmission|productVisualAcceptance|publishAuthorization|onlineRelease):\s*(\w+)\s*$/gm;

export function parseVersionState(currentText = "") {
  const fields = {};
  for (const match of currentText.matchAll(FIELD_PATTERN)) fields[match[1]] = match[2];
  const errors = [];
  for (const [field, allowed] of Object.entries(FIELD_RULES)) {
    if (!Object.hasOwn(fields, field)) errors.push(`current.md missing ${field}`);
    else if (!allowed.has(fields[field])) errors.push(`${field} has invalid value ${fields[field]}`);
  }
  return { fields, errors, valid: errors.length === 0 };
}

function hasPendingLocalLanguage(text) {
  return /待本地\s*commit\/tag|等待 Engineering.*local commit|尚未提交、?tag/.test(text);
}

function hasCompleteLocalLanguage(text) {
  return /已完成[^\n]*(?:commit|tag)|本地提交版本/.test(text);
}

export function evaluateVersionState({
  currentText = "",
  phase = "preflight",
  headTagged = false,
  clean = false,
  onlineVersion,
  onlineCommit,
  expectedVersion,
  expectedCommit,
} = {}) {
  const parsed = parseVersionState(currentText);
  const blockers = [...parsed.errors];
  const { fields } = parsed;
  if (!parsed.valid) return { ready: false, blockers, fields };

  if (fields.localSubmission === "complete") {
    if (hasPendingLocalLanguage(currentText)) blockers.push("localSubmission=complete conflicts with pending local commit/tag language");
    if (phase === "preflight" && (!headTagged || !clean)) blockers.push("localSubmission=complete requires clean HEAD with matching annotated tag");
  } else if (hasCompleteLocalLanguage(currentText)) {
    blockers.push("localSubmission=pending conflicts with completed local commit/tag language");
  }
  if (fields.localSubmission === "pending" && phase === "preflight" && headTagged && clean) {
    blockers.push("localSubmission=pending conflicts with an already tagged clean HEAD");
  }

  if (fields.productVisualAcceptance === "passed" && /验收待确认|等待产品\/视觉验收/.test(currentText)) {
    blockers.push("productVisualAcceptance=passed conflicts with pending acceptance language");
  }
  if (fields.productVisualAcceptance === "pending" && /产品\/视觉验收通过|产品\/视觉已验收/.test(currentText)) {
    blockers.push("productVisualAcceptance=pending conflicts with passed acceptance language");
  }
  if (fields.publishAuthorization === "pending" && /发布授权：已确认|publish 授权已确认/.test(currentText)) {
    blockers.push("publishAuthorization=pending conflicts with confirmed authorization language");
  }
  if (fields.publishAuthorization === "confirmed" && /发布授权：未授权|尚未授权/.test(currentText)) {
    blockers.push("publishAuthorization=confirmed conflicts with unauthorized language");
  }

  const onlineMatches = onlineVersion === expectedVersion && onlineCommit === expectedCommit;
  if (fields.onlineRelease === "complete" && !onlineMatches) blockers.push("onlineRelease=complete requires matching online version and commit");
  if (fields.onlineRelease === "pending" && onlineMatches) blockers.push("onlineRelease=pending conflicts with matching online version and commit");
  if (fields.onlineRelease === "pending" && /公网验收完成|线上统一版本/.test(currentText)) blockers.push("onlineRelease=pending conflicts with completed online language");
  if (fields.onlineRelease === "complete" && /尚未 push、publish、部署|线上继续 v/.test(currentText)) blockers.push("onlineRelease=complete conflicts with not-published language");
  if (fields.onlineRelease === "partial" && !/部分完成|代码已同步|网站未上线/.test(currentText)) blockers.push("onlineRelease=partial requires partial-release language");

  return { ready: blockers.length === 0, blockers, fields };
}

export function assertVersionState(options = {}) {
  const result = evaluateVersionState(options);
  if (!result.ready) throw new Error(`current.md state inconsistent: ${result.blockers.join("; ")}`);
  return result;
}
