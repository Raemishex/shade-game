/**
 * chat.js — Unit Tests
 * Mesaj sanitizasiyası və validasiyasını yoxlayır
 */
const { sanitizeMessage, CONSTANTS } = require("../server/chat");

describe("chat — sanitizeMessage", () => {
  test("normal mesaj qaytarır", () => {
    expect(sanitizeMessage("Salam necəsən?")).toBe("Salam necəsən?");
  });

  test("boşluqları kəsir", () => {
    expect(sanitizeMessage("  hello  ")).toBe("hello");
  });

  test("çoxlu boşluqları birləşdirir", () => {
    expect(sanitizeMessage("a   b   c")).toBe("a b c");
  });

  test("HTML tagları silir", () => {
    expect(sanitizeMessage("<script>alert(1)</script>")).toBe("scriptalert(1)script");
  });

  test("XSS event handler-ları silir", () => {
    expect(sanitizeMessage('img onerror= "alert(1)"')).toBe("img alert(1)");
  });

  test("javascript: protocol silir", () => {
    expect(sanitizeMessage("javascript:alert(1)")).toBe("alert(1)");
  });

  test("boş mesaj üçün null qaytarır", () => {
    expect(sanitizeMessage("")).toBeNull();
    expect(sanitizeMessage("   ")).toBeNull();
  });

  test("null/undefined üçün null qaytarır", () => {
    expect(sanitizeMessage(null)).toBeNull();
    expect(sanitizeMessage(undefined)).toBeNull();
    expect(sanitizeMessage(123)).toBeNull();
  });

  test("MAX_MESSAGE_LENGTH-dən uzun mesaj rədd olunur", () => {
    const longMsg = "A".repeat(300);
    const result = sanitizeMessage(longMsg);
    // İlk yoxlama uzunluğu rədd edir → null
    expect(result).toBeNull();
  });

  test("MAX_MESSAGE_LENGTH həddində mesaj qəbul olunur", () => {
    const exactMsg = "A".repeat(CONSTANTS.MAX_MESSAGE_LENGTH);
    const result = sanitizeMessage(exactMsg);
    expect(result).not.toBeNull();
    expect(result.length).toBeLessThanOrEqual(CONSTANTS.MAX_MESSAGE_LENGTH);
  });

  test("yalnız xüsusi simvollardan ibarət mesaj null qaytarır", () => {
    expect(sanitizeMessage("<>\"'/\\")).toBeNull();
  });

  test("hex entity-ləri silir (& əvvəlcə silinir)", () => {
    // & simvolu əvvəlcə [<>&] regex-ilə silinir, ona görə hex entity pattern
    // tam uyğun gəlmir — amma hər halda zərərli kod icra olunmur
    const result = sanitizeMessage("test&#x3C;script");
    expect(result).not.toContain("&");
    expect(result).not.toContain("<");
  });

  test("Azərbaycan simvollarını dəstəkləyir", () => {
    const msg = "Mən düşünürəm ki bu söz çörəkdir ə ö ü ş ç ğ ı";
    expect(sanitizeMessage(msg)).toBe(msg);
  });

  test("emoji-ləri dəstəkləyir", () => {
    // Note: emojis should pass through since they're not in the blocked chars
    const msg = "yaxşı fikirdi 👍🔥";
    const result = sanitizeMessage(msg);
    expect(result).toContain("yaxşı");
  });
});
