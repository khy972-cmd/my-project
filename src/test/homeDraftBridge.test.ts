import { describe, expect, it } from "vitest";
import { parseHomeDraftRaw, parseHomeDraftToWorklogInput } from "@/lib/homeDraftBridge";

describe("homeDraftBridge", () => {
  it("parses the committed iframe draft shape into a shared canonical draft", () => {
    const raw = JSON.stringify({
      selectedSite: "11111111-1111-4111-8111-111111111111",
      siteSearch: "판교 A현장",
      dept: "직영",
      workDate: "2026-03-23",
      manpowerList: [{ id: 1, worker: "홍길동", workHours: 1.5, isCustom: false, locked: false }],
      workSets: [
        {
          id: 11,
          member: "슬라브",
          process: "타설",
          type: "기본",
          location: { block: "101", dong: "1", floor: "3" },
          customMemberValue: "",
          customProcessValue: "",
          customTypeValue: "",
        },
      ],
      materials: [{ id: 21, name: "NPC-1000", qty: 2, receiptFile: "receipt-a.jpg" }],
      photos: [{ img: "https://example.com/photo-a.jpg", desc: "보수후", fileName: "photo-a.jpg" }],
      drawings: ["https://example.com/drawing-a.jpg"],
    });

    const parsed = parseHomeDraftRaw(raw, "2026-03-23");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.selectedSite).toBe("11111111-1111-4111-8111-111111111111");
    expect(parsed.value.siteSearch).toBe("판교 A현장");
    expect(parsed.value.manpowerList[0]?.worker).toBe("홍길동");
    expect(parsed.value.workSets[0]?.location.floor).toBe("3");
    expect(parsed.value.materials[0]?.receiptFile).toBe("receipt-a.jpg");
    expect(parsed.value.photos[0]?.url).toBe("https://example.com/photo-a.jpg");
    expect(parsed.value.photos[0]?.status).toBe("after");
    expect(parsed.value.drawings[0]?.url).toBe("https://example.com/drawing-a.jpg");
    expect(parsed.value.drawings[0]?.status).toBe("progress");
  });

  it("returns a typed validation error when the canonical draft misses the site name", () => {
    const raw = JSON.stringify({
      selectedSite: "11111111-1111-4111-8111-111111111111",
      siteSearch: "",
      workDate: "2026-03-23",
      manpowerList: [{ id: 1, worker: "홍길동", workHours: 1 }],
      workSets: [{ id: 11, member: "슬라브", process: "타설", type: "", location: {} }],
      materials: [],
      photos: [],
      drawings: [],
    });

    const parsed = parseHomeDraftToWorklogInput(raw, "2026-03-23");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;

    expect(parsed.code).toBe("missing-site");
  });

  it("returns an invalid-json error for malformed drafts", () => {
    const parsed = parseHomeDraftToWorklogInput("{broken", "2026-03-23");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;

    expect(parsed.code).toBe("invalid-json");
  });
});
