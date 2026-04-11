import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    // 1. ここで箱を「予約」します
    const cookiePromise = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // 2. 使う直前で await して中身を取り出します
          async getAll() {
            return (await cookiePromise).getAll()
          },
          async setAll(cookiesToSet) {
            try {
              const cookieStore = await cookiePromise
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // サーバー側リダイレクト時はエラーを無視してOK
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}`)
    }
  }

  return NextResponse.redirect(`${origin}`)
}