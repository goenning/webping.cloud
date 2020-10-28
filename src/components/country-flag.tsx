import { getCountryName } from '@app/fns/country'
import Image from 'next/image'

export interface CountryFlagProps {
  countryCode: string
  className?: string
  width: string
}

export function CountryFlag(props: CountryFlagProps): JSX.Element {
  const countryName = getCountryName(props.countryCode)
  return (
    <Image
      width={props.width}
      height={props.width}
      className={`inline ${props.className}`}
      src={`/images/country/${props.countryCode.toLowerCase()}.svg`}
      title={countryName}
      alt={countryName}
    />
  )
}
