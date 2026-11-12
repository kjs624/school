import ExcelJS from "exceljs";
import { COMPETENCIES, KEYWORD_AREAS, VACATION_AREAS, newId, type ActivityItem, type Data, type Sem } from "./schema";

// 원본 엑셀 양식의 칸 위치
const KW_ROWS: Record<Sem, number[]> = { "1": [7, 8, 9], "2": [13, 14, 15] };
const SCHOOL_ROWS = [31, 32, 33, 34];
const CAREER_ACT_ROWS = [42, 43, 44, 45, 46, 47];
const CMP_CELLS: Record<string, string[]> = {
  curiosity: ["B54", "B55", "B56"],
  attitude: ["B59", "B60"],
  care: ["B63", "B64", "B65"],
  responsibility: ["B68", "B69", "B70"],
  collab: ["B73", "B74", "B75"],
  community: ["B78", "B79"],
};
const VAC_ROWS = { summer: [84, 85, 86], winter: [91, 92, 93] };
const TOP_ROWS = [99, 100, 101, 102, 103];

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v && Array.isArray(v.richText)) return v.richText.map((r) => r.text).join("");
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("result" in v && v.result != null) return cellText(v.result as ExcelJS.CellValue);
  }
  return "";
}

/** "예) ..." 안내 문구와 "1." 같은 빈 번호 줄을 지웁니다. */
function stripTemplate(s: string): string {
  return s
    .split(/\r?\n/)
    .filter((line) => !/^\s*예\)/.test(line) && !/^\s*\d+\.\s*$/.test(line))
    .join("\n")
    .trim();
}

export async function parsePortfolio(buffer: ArrayBuffer): Promise<Data> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet("성장 포트폴리오") ?? wb.worksheets[0];
  if (!ws) throw new Error("시트를 찾을 수 없습니다.");

  const t = (addr: string) => stripTemplate(cellText(ws.getCell(addr).value));
  const data: Data = {};

  // 1. 키워드
  (Object.keys(KW_ROWS) as Sem[]).forEach((sem) => {
    KW_ROWS[sem].forEach((row, i) => {
      const tags = t(`B${row}`)
        .split(/[,，、\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const text = t(`C${row}`);
      if (tags.length || text) data[`kw:${sem}:${KEYWORD_AREAS[i].id}`] = { tags, text };
    });
  });

  // 2. 진로 설계
  const career = { career: t("C19"), motivation: t("C20"), interest: t("C23"), effort: t("C24") };
  if (Object.values(career).some(Boolean)) {
    const exploring = !career.career && !career.motivation && (career.interest || career.effort);
    data["career"] = { mode: exploring ? "exploring" : "decided", ...career };
  }

  // 3. 학교·학급 활동
  const toItems = (rows: number[]): ActivityItem[] =>
    rows
      .map((row) => ({ name: t(`A${row}`), detail: t(`B${row}`), text: t(`C${row}`) }))
      .filter((r) => r.name || r.detail || r.text)
      .map((r) => ({ id: newId(), sem: "1" as Sem, name: r.name.replace(/\s*\n\s*/g, " "), period: "", detail: r.detail, text: r.text }));

  const school = toItems(SCHOOL_ROWS);
  if (school.length) data["school:items"] = school;
  if (t("A36")) data["school:pledge"] = { text: t("A36") };

  // 4. 진로활동
  const careerAct = toItems(CAREER_ACT_ROWS);
  if (careerAct.length) data["careerAct:items"] = careerAct;
  if (t("A49")) data["careerAct:plan"] = { text: t("A49") };

  // 5. 역량 (원본 양식은 한 학기 분량이므로 1학기로 가져옵니다)
  COMPETENCIES.forEach((c) => {
    const cells = CMP_CELLS[c.id];
    const m: Record<string, string> = {};
    c.fields.forEach((f, i) => {
      const v = cells[i] ? t(cells[i]) : "";
      if (v) m[f.id] = v;
    });
    if (Object.keys(m).length) data[`cmp:1:${c.id}`] = m;
  });

  // 6. 방학 계획
  (Object.keys(VAC_ROWS) as (keyof typeof VAC_ROWS)[]).forEach((k) => {
    const m: Record<string, string> = {};
    VAC_ROWS[k].forEach((row, i) => {
      const v = t(`B${row}`);
      if (v) m[VACATION_AREAS[i].id] = v;
    });
    if (Object.keys(m).length) data[`vac:${k}`] = m;
  });

  // 7. Top 5
  const top = TOP_ROWS.map((row) => ({ cat: t(`B${row}`), name: t(`C${row}`) }));
  if (top.some((r) => r.cat || r.name)) data["top5"] = top;

  return data;
}
