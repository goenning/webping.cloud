import { getCountryName } from '@app/fns/country'

export interface CountryNameProps {
  countryCode: string
}

export function CountryName(props: CountryNameProps): JSX.Element {
  return <span>{getCountryName(props.countryCode)}</span>
}
