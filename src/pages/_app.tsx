import theme from '@chakra-ui/theme'
import { AppProps } from 'next/app'
import { ChakraProvider, CSSReset, Box } from '@chakra-ui/core'
import React from 'react'

export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Box>
        <Box maxW="100%" mb={20}>
          <Box as="main" minH="72vh" pt={8} px={5} mt="4rem">
            <Component {...pageProps} />
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  )
}
