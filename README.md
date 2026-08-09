# Toptancı Projesi

B2B toptancı web sitesi. Anlaşmalı firmalar kayıt olur, admin onayı sonrası ürünleri görüntüler, sepete ekler ve sipariş oluşturur. **Online ödeme yoktur** — ödeme site dışında toptancı ile firma arasında yapılır.

## Teknolojiler

- Next.js (App Router) + TypeScript + React
- Tailwind CSS + shadcn/ui + Lucide + Embla Carousel + Sonner
- Microsoft SQL Server (`mssql` + `msnodesqlv8` Windows Authentication)
- Auth.js (NextAuth) Credentials Provider + bcryptjs
- Zod + React Hook Form
- Cloudinary (ürün görselleri)
- ESLint

## Kurulum

```bash
cd toptanci-projesi
npm install
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin (aşağıya bakın).

## Ortam değişkenleri (`.env.local`)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=guclu-rastgele-bir-deger

MSSQL_CONNECTION_STRING=Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\MSSQLLocalDB;Database=toptanciProj;Trusted_Connection=Yes;Encrypt=No;

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=toptanci-projesi

ADMIN_EMAIL=admin@ornek.com
ADMIN_PASSWORD=GucluSifre123
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=Kullanici
```

- `.env.local` **asla** Git’e eklenmemelidir.
- `CLOUDINARY_API_SECRET` yalnızca sunucu tarafında kullanılır; `NEXT_PUBLIC_` öneki **kullanılmamalıdır**.

### AUTH_SECRET üretme

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## MSSQL LocalDB bağlantısı

Yerel geliştirmede SQL Server LocalDB + Windows Authentication kullanılır.

Önerilen ODBC bağlantı dizesi (`msnodesqlv8` için):

```
Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\MSSQLLocalDB;Database=toptanciProj;Trusted_Connection=Yes;Encrypt=No;
```

Alternatif (bazı ortamlarda):

```
Data Source=(localdb)\MSSQLLocalDB;Initial Catalog=toptanciProj;Integrated Security=True;Encrypt=False;
```

### ODBC Driver gereksinimi

`msnodesqlv8` için bilgisayarda **ODBC Driver for SQL Server** kurulu olmalıdır (ör. ODBC Driver 17 veya 18).

Kurulum sonrası LocalDB örneğinin çalıştığını doğrulayın:

```bash
sqllocaldb start MSSQLLocalDB
sqllocaldb info MSSQLLocalDB
```

## Migration

```bash
npm run db:migrate
```

Bu komut veritabanını yoksa oluşturur ve `database/migrations/` altındaki SQL dosyalarını uygular.

## Admin hesabı oluşturma

`.env.local` içindeki `ADMIN_*` değerleriyle:

```bash
npm run db:seed-admin
```

Aynı e-posta varsa ikinci admin oluşturulmaz.

## Cloudinary kurulumu

1. [Cloudinary](https://cloudinary.com) hesabı açın.
2. Cloud name, API Key ve API Secret değerlerini `.env.local` dosyasına yazın.
3. `CLOUDINARY_FOLDER=toptanci-projesi` bırakabilirsiniz.
4. Bağlantıyı test edin: `npm run cloudinary:check`

Ürün görselleri şu klasöre yüklenir: `toptanci-projesi/products/{productId}`

## Development

```bash
npm run dev
```

Uygulama: [http://localhost:3000](http://localhost:3000)

## Diğer komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run build` | Production build |
| `npm run start` | Production sunucusu |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run db:check` | MSSQL bağlantı testi |
| `npm run cloudinary:check` | Cloudinary bağlantı testi |

## Production / Vercel notu

**LocalDB yalnızca kullanıcının Windows bilgisayarında çalışır.** Vercel veya başka bir bulut ortamında LocalDB kullanılamaz.

Üretimde şunlardan biri gerekir:

- **Azure SQL Database**, veya
- İnternetten erişilebilen bir **SQL Server** örneği

Bağlantı dizesini üretim ortam değişkenlerinde güncelleyin. Windows Authentication yerine genelde SQL Authentication (kullanıcı/şifre) kullanılır.

Cloudinary secret’larını yalnızca sunucu ortam değişkenlerinde tutun; istemciye sızdırmayın.

## Kullanıcı rolleri

- **ADMIN** — ürün, kategori, firma, sipariş yönetimi
- **COMPANY_USER** — onay sonrası katalog, sepet, sipariş, hesap

Firma durumları: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`

## Ödeme

Bu projede kredi kartı, sanal POS, Stripe veya iyzico **yoktur**. Sipariş admin onayına gider; ödeme site dışında yapılır.
