const IMMUTABLE_FIELD = "localSubmission";
const DEPRECATED_EVENT_FIELDS = ["productVisualAcceptance", "publishAuthorization", "onlineRelease"];

export function parseVersionState(currentText = "") {
  const match = currentText.match(/^localSubmission:\s*(pending|complete)\s*$/m);
  const fields = match ? { localSubmission: match[1] } : {};
  const errors = [];
  if (!match) errors.push("current.md must contain localSubmission: pending | complete");
  for (const field of DEPRECATED_EVENT_FIELDS) {
    if (new RegExp(`^${field}:`, "m").test(currentText)) {
      errors.push(`${field} is a post-commit event and cannot be stored in current.md`);
    }
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
  staged = false,
} = {}) {
  const parsed = parseVersionState(currentText);
  const blockers = [...parsed.errors];
  const { fields } = parsed;
  if (!parsed.valid) return { ready: false, blockers, fields };

  if (fields.localSubmission === "complete") {
    if (hasPendingLocalLanguage(currentText)) blockers.push("localSubmission=complete conflicts with pending local commit/tag language");
    if (phase === "preflight" && (!headTagged || !clean)) blockers.push("localSubmission=complete requires clean HEAD with matching annotated tag");
    if (phase === "closeout" && !headTagged && !staged) blockers.push("localSubmission=complete requires a staged version closeout before tag creation");
  } else {
    if (hasCompleteLocalLanguage(currentText)) blockers.push("localSubmission=pending conflicts with completed local commit/tag language");
    if (phase === "preflight" && headTagged && clean) blockers.push("localSubmission=pending conflicts with an already tagged clean HEAD");
  }

  return { ready: blockers.length === 0, blockers, fields };
}

export function assertVersionState(options = {}) {
  const result = evaluateVersionState(options);
  if (!result.ready) throw new Error(`current.md immutable state inconsistent: ${result.blockers.join("; ")}`);
  return result;
}

export { IMMUTABLE_FIELD, DEPRECATED_EVENT_FIELDS };
