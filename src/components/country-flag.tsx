import { getCountryName } from '@app/fns/country'

export interface CountryFlagProps {
  countryCode: string
  className?: string
}

export function CountryFlag(props: CountryFlagProps): JSX.Element {
  const countryName = getCountryName(props.countryCode)
  return <img className={`inline ${props.className}`} src={`/images/country/${props.countryCode.toLowerCase()}.svg`} title={countryName} alt={countryName} />
}
