// Geometry-only projection. Semantic node and relationship fields are generated from LikeC4.
const desktopNodes = {
  "enterprise-business-architecture": [250, 58, 180, 58],
  "b2b-product-architecture": [108, 148, 180, 58],
  "data-architecture": [534, 148, 180, 58],
  "technical-architecture": [322, 304, 180, 54],
  engineering: [322, 392, 180, 54],
  "enterprise-digital-system": [322, 480, 180, 54],
  "enterprise-reality-operation": [108, 640, 180, 58],
  "digital-facts-results": [322, 640, 180, 58],
  "digital-decision": [534, 640, 180, 58],
};

const mobileNodes = {
  "enterprise-business-architecture": [70, 54, 260, 60],
  "b2b-product-architecture": [30, 208, 160, 62],
  "data-architecture": [210, 208, 160, 62],
  "technical-architecture": [100, 420, 200, 62], engineering: [100, 560, 200, 62], "enterprise-digital-system": [100, 700, 200, 62],
  "enterprise-reality-operation": [100, 870, 200, 70], "digital-facts-results": [100, 1040, 200, 62], "digital-decision": [100, 1180, 200, 62],
};

const routes = {
  "di-business-product": { points: [[340,116],[340,132],[198,132],[198,148]], label: [268,126] },
  "di-business-data": { points: [[340,116],[340,132],[624,132],[624,148]], label: [482,126] },
  "di-product-data": { points: [[288,170],[534,170]], label: [411,160] },
  "di-data-product": { points: [[534,188],[288,188]], label: [411,199] },
  "di-product-tech": { points: [[198,206],[198,250],[412,250],[412,304]], label: [290,241] },
  "di-data-tech": { points: [[624,206],[624,250],[412,250],[412,304]], label: [534,241] },
  "di-tech-engineering": { points: [[412,358],[412,392]], label: [432,376] },
  "di-engineering-system": { points: [[412,446],[412,480]], label: [432,464] },
  "di-system-reality": { points: [[352,534],[352,590],[198,590],[198,640]], label: [274,579] },
  "di-reality-facts": { points: [[288,669],[322,669]], label: [305,659] },
  "di-system-facts": { points: [[472,534],[472,590],[412,590],[412,640]], label: [492,579] },
  "di-facts-decision": { points: [[502,669],[534,669]], label: [518,659] },
  "di-decision-business": { points: [[624,698],[624,746],[42,746],[42,87],[250,87]], label: [74,419] },
};

const mobileRoutes = {
  "di-business-product": { points: [[200,114],[200,156],[110,156],[110,208]], label: [125,175] },
  "di-business-data": { points: [[200,114],[200,156],[290,156],[290,208]], label: [275,175] },
  "di-product-data": { points: [[190,230],[210,230]], label: [200,292] },
  "di-data-product": { points: [[210,248],[190,248]], label: [200,322] },
  "di-product-tech": { points: [[110,270],[110,370],[200,370],[200,420]], label: [128,352] },
  "di-data-tech": { points: [[290,270],[290,370],[200,370],[200,420]], label: [272,352] },
  "di-tech-engineering": { points: [[200,482],[200,560]], label: [226,535] },
  "di-engineering-system": { points: [[200,622],[200,700]], label: [225,675] },
  "di-system-reality": { points: [[145,762],[145,825],[200,825],[200,870]], label: [150,790] },
  "di-reality-facts": { points: [[200,940],[200,1040]], label: [225,992] },
  "di-system-facts": { points: [[255,762],[255,1008],[300,1008],[300,1040]], label: [300,994] },
  "di-facts-decision": { points: [[200,1102],[200,1180]], label: [225,1155] },
  "di-decision-business": { points: [[100,1242],[45,1242],[45,84],[70,84]], label: [68,650] },
};

export const architectureExplorerProjection = {
  desktop: { width: 820, height: 780, safety: { boundary: 32, layer: 16 }, nodes: desktopNodes, routes, layers: { "business-design": [22, 24, 776, 216], "engineering-implementation": [88, 272, 648, 286], "operating-feedback": [88, 608, 648, 114] } },
  mobile: { width: 400, height: 1290, safety: { boundary: 14, layer: 14 }, nodes: mobileNodes, routes: mobileRoutes, layers: { "business-design": [14, 24, 372, 324], "engineering-implementation": [14, 380, 372, 420], "operating-feedback": [14, 830, 372, 436] } },
};
