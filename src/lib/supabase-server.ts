import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase の環境変数が設定されていません");
  return { url, key };
}

/** ログイン中のユーザーとして読み書きするクライアント（サーバー側） */
export async function createServerSupabase() {
  const store = await cookies(); // 先に呼んで、このページを毎回描画（動的）にする
  const { url, key } = env();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component から呼ばれたときは書き込めないが、proxy が更新するので問題ない
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return { sb, user };
}
