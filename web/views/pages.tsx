import { CompareView } from "./Compare"
import { CountryView } from "./Country"
import { HomeView } from "./Home"
import { MapView } from "./Map"
import { MethodView } from "./Method"
import { PlatformView } from "./Platform"
import { PromosView } from "./Promos"

type Props = { raw: Record<string, string>; slug: string }

export const HomePage = ({ raw }: Props) => <HomeView raw={raw} />
export const MapPage = ({ raw }: Props) => <MapView raw={raw} />
export const ComparePage = ({ raw }: Props) => <CompareView raw={raw} />
export const MethodPage = ({ raw }: Props) => <MethodView raw={raw} />
export const PromosPage = ({ raw }: Props) => <PromosView raw={raw} />
export const CountryPage = ({ raw, slug }: Props) => <CountryView iso={slug} raw={raw} />
export const PlatformPage = ({ raw, slug }: Props) => <PlatformView id={slug} raw={raw} />
