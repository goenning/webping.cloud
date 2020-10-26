import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { CloudProvider, CloudRegion, getAllCloudRegions, getAllProviders } from '../../data'
import { GetStaticPropsResult } from 'next'
import { Checkbox, Heading, Image, Stack, Text } from '@chakra-ui/core'

interface CloudPingProps {
  providers: CloudProvider[]
  regions: Record<string, CloudRegion[]>
  continents: Record<string, string[]>
  countries: string[]
}

interface RegionLatency {
  key: string
  provider: CloudProvider
  region: CloudRegion
  medianLatency: number
  latencies: number[]
}

function median(values: number[]): number {
  const copy = [...values]
  copy.sort()

  if (copy.length === 0) {
    return 0
  }

  const half = Math.floor(copy.length / 2)
  if (copy.length % 2) {
    return copy[half]
  }
  return (copy[half - 1] + copy[half]) / 2.0
}

export async function getStaticProps(): Promise<GetStaticPropsResult<HomeProps>> {
  const providers = getAllProviders()
  const regions = getAllCloudRegions()

  return {
    props: {
      providers,
      regions,
      continents: Object.values(regions).reduce((prev, curr) => {
        for (const region of curr) {
          if (!prev[region.continent]) {
            prev[region.continent] = []
          }
          if (!prev[region.continent].includes(region.country)) {
            prev[region.continent] = [...prev[region.continent], region.country]
          }
        }
        return prev
      }, {} as Record<string, string[]>),
      countries: Object.values(regions).reduce((prev, curr) => {
        for (const region of curr) {
          if (!prev.includes(region.country)) {
            prev = [...prev, region.country]
          }
        }
        return prev
      }, [] as string[]),
    },
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ping(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = document.getElementById('url-ping') as HTMLImageElement
    const timeout = setTimeout(() => {
      img.src = ''
      reject()
    }, 2000)
    const start = new Date().getTime()
    const cb = () => {
      clearTimeout(timeout)
      resolve(new Date().getTime() - start)
    }
    img.onerror = img.onload = cb
    img.src = url.startsWith('http://dynamodb') ? url : `${url}?${start}`
  })
}

export default function CloudPing(props: CloudPingProps): JSX.Element {
  const [selectedProviders, setSelectedProviders] = useState(props.providers.map((x) => x.key))
  const [selectedCountries, setSelectedCountries] = useState(props.countries)
  const [latencyState, setLatencyState] = useState<{ [key: string]: RegionLatency }>({})

  async function pingAll(cancelToken: { cancel: boolean }) {
    await delay(500)

    for (const provider of props.providers) {
      for (const region of props.regions[provider.key]) {
        if (cancelToken.cancel) {
          return
        }

        if (!region.ping_url || !selectedCountries.includes(region.country) || !selectedProviders.includes(provider.key)) {
          continue
        }

        const start = new Date().getTime()

        try {
          await ping(`${region.ping_url}`)
          // eslint-disable-next-line no-empty
        } catch {
        } finally {
          setLatencyState((x) => {
            const key = `${provider.key}-${region.key}`
            const latencies = [...(x[key]?.latencies || []), new Date().getTime() - start]
            const latest: RegionLatency = {
              key,
              provider,
              region,
              medianLatency: median(latencies),
              latencies,
            }
            return { ...x, ...{ [key]: latest } }
          })
        }
      }
    }

    if (!cancelToken.cancel) {
      await delay(500)
      await pingAll(cancelToken)
    }
  }

  useEffect(() => {
    const cancelToken = { cancel: false }
    if (selectedProviders.length >= 1 && selectedCountries.length >= 1) {
      pingAll(cancelToken)
    }
    return () => {
      cancelToken.cancel = true
      return
    }
  }, [selectedProviders, selectedCountries])

  const sortedRegions = Object.values(latencyState)
    .filter((x) => selectedProviders.includes(x.provider.key) && selectedCountries.includes(x.region.country))
    .sort((a, b) => a.medianLatency - b.medianLatency)
  const maxLatency = sortedRegions.length >= 1 ? sortedRegions[sortedRegions.length - 1].medianLatency : 0

  const toggleProviderFilter = (providerKey: string) => () => {
    setSelectedProviders((values) => {
      if (values.includes(providerKey)) {
        return values.filter((x) => x !== providerKey)
      } else {
        return [...values, providerKey]
      }
    })
  }

  const toggleCountryFilter = (countryCode: string) => () => {
    setSelectedCountries((values) => {
      if (values.includes(countryCode)) {
        return values.filter((x) => x !== countryCode)
      } else {
        return [...values, countryCode]
      }
    })
  }

  const toggleContinentFilter = (continent: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCountries((values) => {
      if (event.target.checked) {
        return [...new Set([...values, ...props.continents[continent]])]
      } else {
        return values.filter((x) => !props.continents[continent].includes(x))
      }
    })
  }

  return (
    <>
      <Head>
        <title>Sumbit</title>
      </Head>

      <img src="" id="url-ping" alt="Ping" style={{ display: 'none' }} />

      <Stack isInline spacing={12}>
        <Stack marginBottom={6}>
          <Heading as="h4" size="md">
            Providers
          </Heading>
          {props.providers.map((provider) => (
            <Checkbox key={provider.key} isChecked={selectedProviders.includes(provider.key)} onChange={toggleProviderFilter(provider.key)}>
              {provider.display_name}
            </Checkbox>
          ))}
        </Stack>

        <Stack>
          <Heading as="h4" size="md">
            Locations
          </Heading>

          <Stack isInline spacing={12}>
            {Object.keys(props.continents).map((continent) => {
              const allSelected = props.continents[continent].some((x) => selectedCountries.includes(x))
              return (
                <Stack key={continent}>
                  <Checkbox isChecked={allSelected} onChange={toggleContinentFilter(continent)}>
                    <Heading as="h6" size="sm">
                      {continent}
                    </Heading>
                  </Checkbox>
                  <Stack key={continent}>
                    {props.continents[continent].map((country) => (
                      <Checkbox key={country} isChecked={selectedCountries.includes(country)} onChange={toggleCountryFilter(country)}>
                        <Image htmlWidth="20px" src={`/images/country/${country.toLowerCase()}.svg`} title={country} alt={country} />
                      </Checkbox>
                    ))}
                  </Stack>
                </Stack>
              )
            })}
          </Stack>
        </Stack>
      </Stack>

      <table style={{ width: '100%', borderSpacing: '5px', borderCollapse: 'separate' }}>
        <tbody>
          {sortedRegions.map((x) => {
            const relative = ((x.medianLatency || 0) / maxLatency) * 100
            const color = x.medianLatency < 80 ? 'ddffdd' : x.medianLatency < 200 ? 'fff0cc' : 'ffdddd'
            return (
              <tr
                key={x.key}
                style={{
                  backgroundImage: `linear-gradient(to right, #${color} ${relative}%, #fff ${relative}%)`,
                }}
              >
                <td>
                  <Stack margin={2} isInline spacing={4}>
                    <Image htmlWidth="30px" src={`/images/provider/${x.provider.key}.svg`} title={x.provider.display_name} alt={x.provider.display_name} />
                    <Stack>
                      <Text>{x.region.key}</Text>
                      <Stack isInline>
                        <Image htmlWidth="20px" src={`/images/country/${x.region.country.toLowerCase()}.svg`} title={x.region.country} alt={x.region.country} />
                        <Text>&middot;</Text>
                        <Text>
                          {x.region.location}, {x.region.country}
                        </Text>
                        <Text>&middot;</Text>
                        <Text>{x.medianLatency}ms</Text>
                      </Stack>
                    </Stack>
                  </Stack>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
