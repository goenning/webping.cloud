import { AppProps } from 'next/app'
import './global.css'

export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <div className="max-w-screen-xl mx-auto grid grid-cols-1 row-gap-16 px-4 py-4 sm:px-6 sm:py-12 lg:px-8">
      <Component {...pageProps} />
    </div>
  )
}
