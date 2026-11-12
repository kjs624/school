import { NextResponse, type NextRequest } from "next/server";
import { parsePortfolio } from "@/lib/importExcel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 원본 엑셀 파일을 읽어서 화면에 넣을 데이터로 바꿔 돌려줍니다. 저장은 화면에서 확인 후 합니다.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "10MB 이하 파일만 가능합니다." }, { status: 400 });

  try {
    const data = await parsePortfolio(await file.arrayBuffer());
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: "엑셀을 읽지 못했습니다. 원본 양식 파일인지 확인해 주세요." }, { status: 400 });
  }
}
