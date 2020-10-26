import React from 'react'
import Document, { Html, Main, NextScript, DocumentInitialProps, DocumentContext, Head } from 'next/document'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render(): JSX.Element {
    const googleAnalyticsScripts = process.env.NEXT_PUBLIC_GA_TRACKING_ID && (
      <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}');
          `,
          }}
        />
      </>
    )

    return (
      <Html lang="en">
        <Head>
          {googleAnalyticsScripts}
          <meta name="referrer" content="same-origin" />
          <link rel="icon" href="favicon.ico" type="image/x-icon" />
          <link rel="icon" href="favicon-16x16.png" sizes="16x16" type="image/png" />
          <link rel="icon" href="favicon-32x32.png" sizes="32x32" type="image/png" />
        </Head>
        <body className="bg-gray-200 text-gray-900">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
