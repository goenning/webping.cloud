import Image from 'next/image'

export interface CloudProviderLogoProps {
  providerKey: string
  providerName: string
  className?: string
  width: string
}

export function CloudProviderLogo(props: CloudProviderLogoProps): JSX.Element {
  return (
    <Image
      width={props.width}
      height={props.width}
      className={`inline ${props.className}`}
      src={`/images/provider/${props.providerKey}.svg`}
      title={props.providerName}
      alt={props.providerName}
    />
  )
}
