import React from 'react'
import Document, { Html, Main, NextScript, DocumentInitialProps, DocumentContext, Head } from 'next/document'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head />
        <body className="bg-gray-200 text-gray-900">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
