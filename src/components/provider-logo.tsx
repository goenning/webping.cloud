export interface CloudProviderLogoProps {
  providerKey: string
  providerName: string
  className?: string
}

export function CloudProviderLogo(props: CloudProviderLogoProps): JSX.Element {
  return <img className={`inline ${props.className}`} src={`/images/provider/${props.providerKey}.svg`} title={props.providerName} alt={props.providerName} />
}
