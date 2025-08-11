import '../styles/globals.css'
import { ThemeProvider } from 'next-themes'

export default function MyApp({ Component, pageProps }) {
  return (
   <ThemeProvider attribute="class" enableSystem={true} storageKey="certificate-gallery-theme">
     <Component {...pageProps} />
   </ThemeProvider>
  )
}
