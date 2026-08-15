type GoogleCredentialResponse = {
  credential?: string
}

type GoogleButtonContainer = HTMLElement

interface GoogleAccountsId {
  initialize(options: { client_id: string, callback: (response: GoogleCredentialResponse) => void }): void
  renderButton(
    element: GoogleButtonContainer,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      width?: number
    },
  ): void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId
      }
    }
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services-script'
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

async function loadGoogleIdentityServicesScript() {
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in is only available in the browser')
  }

  if (window.google?.accounts?.id) {
    return
  }

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID)
  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Google sign-in script load timed out')), 10000)
      const checkReady = () => {
        if (window.google?.accounts?.id) {
          clearTimeout(timeout)
          resolve()
        } else {
          requestAnimationFrame(checkReady)
        }
      }
      checkReady()
    })
    return
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google sign-in script'))
    document.head.appendChild(script)
  })

  if (!window.google?.accounts?.id) {
    throw new Error('Google sign-in script loaded but API is unavailable')
  }
}

export function useGoogleIdToken() {
  const config = useRuntimeConfig()

  const renderGoogleButton = async (
    element: GoogleButtonContainer,
    onCredential: (idToken: string) => void,
    buttonText: 'signin_with' | 'signup_with' | 'continue_with' | 'signin' = 'continue_with'
  ) => {
    const clientId = config.public.googleClientId
    if (!clientId) {
      throw new Error('Missing NUXT_PUBLIC_GOOGLE_CLIENT_ID runtime config')
    }

    await loadGoogleIdentityServicesScript()

    const googleId = window.google?.accounts?.id
    if (!googleId) {
      throw new Error('Google Identity Services is unavailable')
    }

    googleId.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        if (response.credential) {
          onCredential(response.credential)
        }
      }
    })

    googleId.renderButton(element, {
      theme: 'outline',
      size: 'large',
      text: buttonText,
      shape: 'pill',
      width: 320
    })
  }

  return {
    renderGoogleButton
  }
}
