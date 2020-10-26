import { Header } from '@app/components'
import { AppProps } from 'next/app'
import React from 'react'
import './globals.css'

export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  )
}
