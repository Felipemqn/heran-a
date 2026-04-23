import { redirect } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'
import { AUTH_DISABLED } from '@/lib/auth-mode'

export default function SignUpPage() {
  if (AUTH_DISABLED) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="font-serif text-4xl text-jera-mint">Jera Horizonte</h1>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#0b7a6e',
            colorBackground: '#052b38',
            colorText: '#f0ede6',
            colorInputBackground: '#0d1b22',
            colorInputText: '#f0ede6',
            borderRadius: '8px',
          },
        }}
      />
    </div>
  )
}
