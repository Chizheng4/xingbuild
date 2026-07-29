export const FRAMEWORK_OVERVIEW_VIEW = "overview";
export const DIGITAL_IMPLEMENTATION_VIEW = "digital-implementation";
export const FRAMEWORK_BASE_PATH = "/business-observations";

export function resolveFrameworkView(search) {
  return new URLSearchParams(search).get("view") === DIGITAL_IMPLEMENTATION_VIEW
    ? DIGITAL_IMPLEMENTATION_VIEW
    : FRAMEWORK_OVERVIEW_VIEW;
}

export function frameworkViewPath(viewId) {
  return viewId === DIGITAL_IMPLEMENTATION_VIEW
    ? `${FRAMEWORK_BASE_PATH}?view=${DIGITAL_IMPLEMENTATION_VIEW}`
    : FRAMEWORK_BASE_PATH;
}
