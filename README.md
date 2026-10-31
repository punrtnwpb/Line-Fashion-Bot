# LINE Fashion Recommender Bot

แชทบอท LINE OA แนะนำเสื้อผ้าตามความต้องการ (ประเภท สี สไตล์ โอกาส งบ)
ใช้ n8n + Hugging Face + Orange — ฟรีทั้งหมดและรันบนเครื่องตัวเองได้

## โครงสร้าง

| โฟลเดอร์ | เนื้อหา |
|---|---|
| `data/products.csv` | ข้อมูลสินค้า (Orange export มาแทนไฟล์นี้) |
| `data/synonyms.csv` | พจนานุกรมคำ → label |
| `workflows/` | ไฟล์ workflow ของ n8n (import ได้เลย) |
| `n8n-code/` | โค้ดใน Code node สำรองไว้อ่าน/แก้ |
| `hf-service/` | FastAPI สำหรับโมเดล Hugging Face (ทำภายหลัง) |
| `orange/` | ไฟล์ workflow ของ Orange (.ows) |

## Flow

```
LINE → cloudflared → n8n
  Webhook → Extract Event → Load Synonyms → Rule Parser
  → search_products (อ่าน products.csv → Filter & Score → Top 3)
  → Format Reply → LINE Reply
```

---

## สำหรับสมาชิก: แก้ข้อมูลโดยไม่ต้องใช้ Git

1. เปิดไฟล์ใน GitHub เช่น `data/synonyms.csv`
2. กดไอคอนดินสอ (Edit) มุมขวาบน
3. แก้หรือเพิ่มบรรทัด เช่น `โอเวอร์ไซส์,style,street`
4. กด **Commit changes** แล้วใส่คำอธิบายสั้นๆ
5. รอประมาณ 5 นาที บอทจะใช้ข้อมูลใหม่อัตโนมัติ

**กติกา synonyms.csv:** ห้ามมีช่องว่างหน้า/หลังคำ, `group` ต้องเป็น category / color / style / occasion,
`label` ต้องตรงกับค่าที่ใช้ใน `products.csv`

---

## สำหรับคนที่จะรันบอทบนเครื่องตัวเอง (Windows)

### ติดตั้งครั้งแรก
1. ติดตั้ง [Node.js LTS](https://nodejs.org)
2. เปิด PowerShell:
   ```powershell
   npm install -g n8n
   winget install --id Cloudflare.cloudflared
   ```
3. สร้าง LINE OA + เปิด Messaging API (ฟรี) แล้วไปเอา **Channel access token (long-lived)**
   ที่ LINE Developers Console → Channel → แท็บ Messaging API → ล่างสุด

### รันทุกครั้ง (ลำดับสำคัญ)
1. **PowerShell หน้าต่างที่ 1** (เปิดทิ้งไว้)
   ```powershell
   cloudflared tunnel --url http://localhost:5678
   ```
   คัดลอก URL `https://....trycloudflare.com`
2. **PowerShell หน้าต่างที่ 2** (เปิดทิ้งไว้)
   ```powershell
   $env:WEBHOOK_URL="https://....trycloudflare.com/"
   n8n start
   ```
3. เปิด `http://localhost:5678`
4. LINE Developers Console → Webhook URL = `https://....trycloudflare.com/webhook/line` → Verify

### Import workflow
1. n8n → มุมขวาบน **…** → **Import from File** → เลือกไฟล์ใน `workflows/`
   (import `search_products.json` ก่อน แล้วค่อย `main.json`)
2. เปิด node **HTTP Request (LINE Reply)** → สร้าง credential **Header Auth**
   - Name: `Authorization`
   - Value: `Bearer <channel access token ของคุณ>`
3. ใน node **Execute Workflow** เลือก `search_products` ใหม่อีกครั้ง
4. กด **Publish** ทั้งสอง workflow

### ปัญหาที่เจอบ่อย
| อาการ | วิธีแก้ |
|---|---|
| `port 5678 is already in use` | มี n8n เปิดค้าง → `netstat -ano \| findstr :5678` แล้ว `taskkill /PID <เลข> /F` |
| Cloudflare Error 1033 | cloudflared ปิดไปแล้ว → รันใหม่ และอัปเดต URL ทั้งใน n8n และ LINE |
| `Authorization failed` | token ผิด / ลืม `Bearer ` / ใช้ Channel secret แทน token |
| บอทไม่ตอบ | เช็ก URL ใน LINE ว่าเป็น `/webhook/line` (ตัวพิมพ์เล็ก) และ workflow ถูก Publish แล้ว |
| `Invalid reply token` | ส่งข้อความใหม่ใน LINE (token ใช้ได้ครั้งเดียว) |

## ความปลอดภัย
- **ห้าม** commit token / secret / ไฟล์ `.env` ขึ้น repo
- export workflow จาก n8n จะไม่มีค่า credential ติดไป — ปลอดภัยที่จะ commit
