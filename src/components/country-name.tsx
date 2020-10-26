import { getCountryName } from '@app/fns/country'

export interface CountryNameProps {
  countryCode: string
  className?: string
}

export function CountryName(props: CountryNameProps): JSX.Element {
  return <span className={props.className}>{getCountryName(props.countryCode)}</span>
}
