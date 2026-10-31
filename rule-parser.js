// Rule Parser v2 — อ่านคำศัพท์จาก data/synonyms.csv (ไม่ hard code)
// Code node | Mode: Run Once for All Items
// Input: แถวจาก synonyms.csv (ผ่าน Load Synonyms → Extract from File)

const ev = $('Extract Event').first().json;
const text = ev.text.toLowerCase();

// เรียงคำยาวก่อน เพื่อให้ "เสื้อยืด" ถูกจับก่อน "เสื้อ" โดยไม่ต้องเรียงในไฟล์เอง
const syn = $input.all()
  .map(i => i.json)
  .filter(r => r.word && r.group && r.label)
  .sort((a, b) => b.word.length - a.word.length);

const slots = { category: null, color: null, style: null, occasion: null, budget: null };

for (const r of syn) {
  if (slots[r.group] === null && text.includes(String(r.word).toLowerCase())) {
    slots[r.group] = r.label;
  }
}

// งบประมาณ
const m =
  text.match(/(?:งบ|ไม่เกิน|ต่ำกว่า|ราคา|under|budget)\s*(?:ไม่เกิน)?\s*(\d[\d,]*)/) ||
  text.match(/(\d[\d,]*)\s*(?:บาท|฿|thb)/);
if (m) slots.budget = Number(m[1].replace(/,/g, ''));

const missing = Object.keys(slots).filter(k => slots[k] === null);

return [{
  json: {
    ...ev,
    ...slots,
    missing,
    debug: `เข้าใจว่า:\n${JSON.stringify(slots, null, 1)}\nยังขาด: ${missing.join(', ') || '-'}`,
  },
}];
