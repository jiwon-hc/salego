import type { Lang } from "./types"

export type Copy = {
  title: string
  kicker: string
  navHome: string
  navMap: string
  mapTitle: string
  mapLede: string
  mapPlatform: string
  mapCheaper: string
  mapDearer: string
  mapEven: string
  mapNoPrice: string
  mapPromo: string
  mapCheapest: string
  mapDearest: string
  mapTable: string
  navCompare: string
  navPromos: string
  navMethod: string
  langKo: string
  langEn: string
  curLocal: string
  curUsd: string
  curKrw: string
  show: string
  activeCampaigns: string
  homeLede: string
  countryLink: string
  compareLink: string
  sideLink: string
  sideLede: string
  addCountry: string
  removeCountry: string
  rankTitle: string
  cheapest: string
  sideLimit: string
  tier: string
  month: string
  annual: string
  perMonth: string
  promo: string
  source: string
  tax: string
  fetched: string
  openStore: string
  usStore: string
  noStorefront: string
  unfetched: string
  fetchFailed: string
  unavailable: string
  notListed: string
  stale: string
  storeActive: string
  storeNone: string
  storeUnknown: string
  campaignNone: string
  campaignIneligible: string
  campaignUnlisted: string
  campaignEnded: string
  campaignMismatch: string
  campaignLive: string
  audience: Record<string, string>
  campaignUnverified: string
  suspect: string
  until: string
  taxIncluded: string
  taxExcluded: string
  taxVaries: string
  taxUnknown: string
  noUsd: string
  noKrw: string
  emptyTitle: string
  emptyBody: string
  missingCountry: string
  missingPlatform: string
  footer: string
  bandEntry: string
  bandPlus: string
  bandPro: string
  bandUltra: string
  country: string
  vsUs: string
  gridCaption: string
  sortHint: string
  noPriceGrey: string
  storefrontYes: string
  storefrontNo: string
  evidence: string
  eligibleCount: string
  excluded: string
  unlistedRest: string
  allowRest: string
  generated: string
  fx: string
  changes: string
  from: string
  to: string
  pagesOk: string
  pagesUnavailable: string
  pagesFailed: string
  pagesUnfetched: string
  pageCheck: string
  usMissing: string
  sortBasis: string
  periodMonth: string
  periodYear: string
  recheck: (when: string) => string
}

export const copy: Record<Lang, Copy> = {
  ko: {
    title: "AI 구독 가격 지도",
    kicker: "App Store 표시가",
    navHome: "국가",
    navMap: "지도",
    mapTitle: "세계 가격 지도",
    mapLede: "플랫폼과 단계를 고르면 국가별 App Store 월 가격을 미국 가격과 비교해 칠합니다. 국가를 누르면 상세 가격으로 갑니다.",
    mapPlatform: "플랫폼",
    mapCheaper: "미국보다 저렴",
    mapDearer: "미국보다 비쌈",
    mapEven: "미국과 비슷 (±2%)",
    mapNoPrice: "가격 없음",
    mapPromo: "공식 프로모션 대상",
    mapCheapest: "가장 저렴한 5개국",
    mapDearest: "가장 비싼 5개국",
    mapTable: "전체 국가 표로 보기",
    navCompare: "비교",
    navPromos: "프로모션",
    navMethod: "기준",
    langKo: "한국어",
    langEn: "English",
    curLocal: "현지 통화",
    curUsd: "USD",
    curKrw: "KRW",
    show: "보기",
    activeCampaigns: "진행 중인 공식 캠페인",
    homeLede: "선택한 국가의 App Store 상품 페이지에 표시된 구독 가격입니다.",
    countryLink: "이 국가의 전체 기록",
    compareLink: "Plus 가격대 비교",
    sideLink: "여러 국가 나란히",
    sideLede: "고른 국가를 같은 단계끼리 나란히 봅니다. 한 줄에서 USD 표시가가 가장 낮은 칸을 표시합니다.",
    addCountry: "국가 추가",
    removeCountry: "빼기",
    rankTitle: "전체 순위",
    cheapest: "가장 낮음",
    sideLimit: "한 번에 8개 국가까지 나란히 둡니다.",
    tier: "단계",
    month: "월 가격",
    annual: "연간 결제 (상시)",
    perMonth: "월할",
    promo: "프로모션",
    source: "출처",
    tax: "세금",
    fetched: "수집",
    openStore: "App Store에서 보기",
    usStore: "미국 App Store 상품 페이지",
    noStorefront: "해당 스토어프론트 없음",
    unfetched: "미수집",
    fetchFailed: "수집 실패",
    unavailable: "미판매",
    notListed: "페이지에 없음",
    stale: "오래됨",
    storeActive: "스토어 소개 혜택 진행 중",
    storeNone: "스토어 페이지 기준 없음",
    storeUnknown: "스토어 혜택 미확인",
    campaignNone: "공식 캠페인 없음",
    campaignIneligible: "공식 캠페인 대상 아님",
    campaignUnlisted: "개별 등재 미확인",
    campaignEnded: "종료",
    campaignMismatch: "페이지와 불일치",
    campaignLive: "진행 중",
    audience: { student: "학생", trial: "무료 체험", carrier: "통신사 제휴", partner: "제휴사", intro: "신규 가입 할인", everyone: "누구나" },
    campaignUnverified: "재확인 필요",
    suspect: "확인 필요",
    until: "까지",
    taxIncluded: "세금 포함",
    taxExcluded: "세금 별도",
    taxVaries: "세금이 경우에 따라 다름",
    taxUnknown: "세금 미확인",
    noUsd: "USD 환산 없음",
    noKrw: "KRW 환산 없음",
    emptyTitle: "스냅샷이 없습니다",
    emptyBody: "저장소 루트에서 python collector/run.py 를 실행하면 이 화면에 가격이 채워집니다.",
    missingCountry: "이 코드의 국가 기록이 없습니다.",
    missingPlatform: "이 플랫폼 기록이 없습니다.",
    footer: "표시 가격은 공개된 App Store 상품 페이지의 가격입니다. 세금, 자격, 결제 수단에 따라 실제 청구액이 달라질 수 있습니다. 프로모션에는 자격 조건이 있습니다.",
    bandEntry: "엔트리",
    bandPlus: "Plus",
    bandPro: "Pro",
    bandUltra: "Ultra",
    country: "국가",
    vsUs: "미국 대비",
    gridCaption: "스토어프론트 코드입니다. 지리 경계 지도가 아닙니다.",
    sortHint: "선택한 단계의 USD 표시가가 낮은 순입니다.",
    noPriceGrey: "가격이 없는 코드는 회색입니다.",
    storefrontYes: "App Store 스토어프론트 있음",
    storefrontNo: "App Store 스토어프론트 없음",
    evidence: "근거",
    eligibleCount: "확인된 대상 국가",
    excluded: "제외",
    unlistedRest: "그 밖 국가는 개별 등재 미확인입니다.",
    allowRest: "목록에 없는 국가는 대상이 아닙니다.",
    generated: "스냅샷",
    fx: "환율 기준일",
    changes: "이번 수집에서 바뀐 가격",
    from: "이전",
    to: "이후",
    pagesOk: "페이지를 읽음",
    pagesUnavailable: "미판매",
    pagesFailed: "수집 실패",
    pagesUnfetched: "아직 미수집",
    pageCheck: "페이지 확인",
    usMissing: "미국 표시가가 없어 비율을 계산하지 않습니다.",
    sortBasis: "정렬 기준",
    periodMonth: "월",
    periodYear: "연",
    recheck: (when) => `자동 재확인이 막혀 ${when}에 읽은 공식 글을 유지합니다.`,
  },
  en: {
    title: "AI subscription price map",
    kicker: "App Store display prices",
    navHome: "Country",
    navMap: "Map",
    mapTitle: "World price map",
    mapLede: "Pick a platform and a tier. Each country is shaded by its App Store monthly price against the US price. Click a country for its full prices.",
    mapPlatform: "Platform",
    mapCheaper: "Cheaper than US",
    mapDearer: "Dearer than US",
    mapEven: "About the US price (±2%)",
    mapNoPrice: "No price",
    mapPromo: "Official promotion",
    mapCheapest: "Five cheapest",
    mapDearest: "Five dearest",
    mapTable: "See every country in a table",
    navCompare: "Compare",
    navPromos: "Promotions",
    navMethod: "Method",
    langKo: "한국어",
    langEn: "English",
    curLocal: "Local",
    curUsd: "USD",
    curKrw: "KRW",
    show: "Show",
    activeCampaigns: "Official campaigns in progress",
    homeLede: "Subscription prices shown on the selected country's App Store product page.",
    countryLink: "Full record for this country",
    compareLink: "Compare the Plus band",
    sideLink: "Countries side by side",
    sideLede: "Chosen countries sit on the same tier. The lowest USD display price in each row is marked.",
    addCountry: "Add a country",
    removeCountry: "Remove",
    rankTitle: "Full ranking",
    cheapest: "Lowest",
    sideLimit: "Up to 8 countries sit side by side.",
    tier: "Tier",
    month: "Monthly price",
    annual: "Annual billing (standing)",
    perMonth: "per month",
    promo: "Promotion",
    source: "Source",
    tax: "Tax",
    fetched: "Fetched",
    openStore: "View on the App Store",
    usStore: "United States App Store product page",
    noStorefront: "No storefront for this code",
    unfetched: "Not fetched yet",
    fetchFailed: "Fetch failed",
    unavailable: "Not sold",
    notListed: "Not on the page",
    stale: "Stale",
    storeActive: "Store introductory offer in progress",
    storeNone: "Nothing on the store page",
    storeUnknown: "Store offer unknown",
    campaignNone: "No official campaign",
    campaignIneligible: "Not an official-campaign country",
    campaignUnlisted: "Not individually listed",
    campaignEnded: "Ended",
    campaignMismatch: "Page mismatch",
    campaignLive: "In progress",
    audience: { student: "Student", trial: "Free trial", carrier: "Carrier bundle", partner: "Partner", intro: "New-subscriber discount", everyone: "Everyone" },
    campaignUnverified: "Needs recheck",
    suspect: "Needs review",
    until: "through",
    taxIncluded: "Tax included",
    taxExcluded: "Tax excluded",
    taxVaries: "Tax varies",
    taxUnknown: "Tax unknown",
    noUsd: "No USD conversion",
    noKrw: "No KRW conversion",
    emptyTitle: "No snapshot yet",
    emptyBody: "Run python collector/run.py from the repository root to fill this page.",
    missingCountry: "No country record for this code.",
    missingPlatform: "No platform record.",
    footer: "Displayed prices are public App Store product-page prices. Tax, eligibility, and payment method can change the charge. Promotions have eligibility rules.",
    bandEntry: "Entry",
    bandPlus: "Plus",
    bandPro: "Pro",
    bandUltra: "Ultra",
    country: "Country",
    vsUs: "Versus the US",
    gridCaption: "These are storefront codes. This is not a geographic map.",
    sortHint: "Sorted by the selected tier's USD display price, lowest first.",
    noPriceGrey: "Codes with no price are grey.",
    storefrontYes: "Apple App Store storefront exists",
    storefrontNo: "No Apple App Store storefront",
    evidence: "Evidence",
    eligibleCount: "Confirmed eligible countries",
    excluded: "Excluded",
    unlistedRest: "Every other country is not individually listed.",
    allowRest: "Countries off this list are not eligible.",
    generated: "Snapshot",
    fx: "FX date",
    changes: "Prices that changed in this collection",
    from: "Previous",
    to: "Current",
    pagesOk: "Pages read",
    pagesUnavailable: "Not sold",
    pagesFailed: "Fetch failed",
    pagesUnfetched: "Not fetched yet",
    pageCheck: "Page checked",
    usMissing: "The US display price is missing, so no percentage is calculated.",
    sortBasis: "Sort key",
    periodMonth: "month",
    periodYear: "year",
    recheck: (when) => `Automatic recheck was blocked. The official page read on ${when} is kept.`,
  },
}

export function methodParagraphs(
  lang: Lang,
  facts: { storefronts: number; countries: number; fx: string },
): string[] {
  if (lang === "en") {
    return [
      "This version collects the subscription prices displayed on Apple App Store product pages. A web checkout price stays off the country rows.",
      `The probe found ${facts.storefronts} storefronts. The page lists ${facts.countries} ISO codes. A code with no storefront keeps an empty price and the label “No storefront for this code.”`,
      "An empty cell is never filled with another country's price. Not sold, not on the page, not fetched yet, and fetch failed are different states. If the app is on sale and a tier is missing from the product-page list, that tier is not on the page.",
      "Annual billing is a standing price. It does not get a promotion badge. The per-month figure divides the annual amount by 12.",
      "A store offer badge appears only when the product page shows a trial or an introductory price. No badge is not a claim that no promotion exists anywhere.",
      "A price below 0.2x or above 3x the US price for the same tier is held back as “Needs review” and left out of rankings. This catches parser slips such as an annual price read as monthly.",
      "Official campaigns are judged only from the registry. Only a country on an allowlist receives an in-progress badge. The Google AI Plus student offer says “140+ markets” and does not publish the full list, so every country outside the named exclusions stays “Not individually listed.” The confirmed country for the ChatGPT student offer is the United States.",
      "Student offers carry an audience and an end date. They are not the price everyone in that country pays. They are account offers, separate from the App Store list price.",
      "The Japanese version of the OpenAI help page says subscriptions billed through the App Store or Google Play can stay ineligible while that billing continues. The English page text that was checked does not contain that exclusion.",
      "App Store prices include tax in every storefront except the United States and Canada, where tax is added at checkout. No tax is invented by adjusting a US web price.",
      `USD and KRW use the daily open.er-api.com rate (166 currencies). The snapshot FX date is ${facts.fx}. A currency missing from that table keeps its local amount only.`,
      "A cell is stale when its fetch time is more than 48 hours before the snapshot time. A failed fetch keeps the previous successful row and does not overwrite it with a bad parse.",
      "The iTunes Lookup app price is not used as the subscription price. Lookup only checks whether a storefront exists.",
      "There is no account, payment, alert, or admin screen. Region switching, gift cards, stand-in billing addresses, and VPN checkout are not described.",
    ]
  }
  return [
    "이 버전은 Apple App Store 상품 페이지에 표시된 구독 가격을 모읍니다. 웹 결제 가격은 국가 칸에 넣지 않습니다.",
    `확인한 스토어프론트는 ${facts.storefronts}개입니다. 화면에 있는 ISO 코드는 ${facts.countries}개입니다. 스토어프론트가 없는 코드는 가격 없이 해당 스토어프론트 없음으로 남깁니다.`,
    "빈 칸에는 다른 나라의 가격을 채우지 않습니다. 미판매, 페이지에 없음, 미수집, 수집 실패는 서로 다른 상태입니다. 앱은 판매 중인데 그 단계가 상품 페이지 목록에 없으면 페이지에 없음입니다.",
    "연간 결제는 상시 가격입니다. 프로모션이 아닙니다. 월할은 연간 금액을 12로 나눈 참고값입니다.",
    "스토어 혜택 배지는 상품 페이지에 체험이나 도입 가격이 적혀 있을 때만 붙습니다. 배지가 없다고 프로모션이 전혀 없다는 뜻은 아닙니다.",
    "같은 단계의 미국 가격보다 0.2배 낮거나 3배 높은 값은 확인 필요로 보류하고 순위에서 뺍니다. 연간 가격을 월 가격으로 읽는 것 같은 파싱 실수를 막기 위한 장치입니다.",
    "공식 캠페인은 등록부에 있는 공지만 판정합니다. 허용 목록에 오른 국가만 진행 중 배지를 받습니다. Google AI Plus 학생 혜택은 140개 이상의 시장이라고만 되어 있고 전체 명단이 없어, 제외 국가를 뺀 나머지는 개별 등재 미확인입니다. ChatGPT 학생 혜택의 확인된 대상은 미국입니다.",
    "학생 혜택에는 자격과 종료일이 있습니다. 그 나라 모든 이용자의 가격이 아닙니다. App Store에 표시된 가격과 별개인 계정 혜택입니다.",
    "OpenAI 도움말의 일본어판은 App Store나 Google Play로 결제 중인 구독이, 그 결제가 이어지는 동안 학생 혜택 대상에서 빠질 수 있다고 적습니다. 영어 페이지에서 확인한 문장에는 그 제외가 없습니다.",
    "App Store 가격은 미국과 캐나다를 빼면 모두 세금 포함가입니다. 미국과 캐나다는 결제할 때 세금이 붙습니다. 미국 웹 가격으로 세금을 계산해 넣지 않습니다.",
    `USD와 KRW는 open.er-api.com의 일간 환율(166개 통화)입니다. 스냅샷의 환율 기준일은 ${facts.fx}입니다. 환율표에 없는 통화는 현지 금액만 보여 줍니다.`,
    "수집 시각이 스냅샷을 만든 시각보다 48시간을 넘기면 오래됨으로 표시합니다. 새로 읽기에 실패하면 잘못 파싱한 가격으로 덮어쓰지 않고, 이전에 읽은 성공 기록을 유지합니다.",
    "iTunes Lookup이 알려 주는 앱 가격은 구독료로 쓰지 않습니다. Lookup은 스토어프론트 존재 확인에만 씁니다.",
    "계정, 결제, 알림, 관리 화면은 없습니다. 지역 전환, 기프트 카드, 가상 청구 주소, VPN으로 결제하는 방법은 안내하지 않습니다.",
  ]
}
