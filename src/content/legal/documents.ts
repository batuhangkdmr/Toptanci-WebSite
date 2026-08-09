import { siteConfig } from "@/lib/site-config";

export type LegalDocumentSlug =
  | "teslimat-kosullari"
  | "gizlilik-ve-guvenlik"
  | "uyelik-sozlesmesi"
  | "satis-sozlesmesi"
  | "kisisel-verilerin-korunmasi"
  | "garanti-ve-iade-kosullari"
  | "cerez-politikasi"
  | "ticari-elektronik-ileti";

export type LegalDocumentType =
  | "DELIVERY_TERMS"
  | "PRIVACY_SECURITY"
  | "MEMBERSHIP_AGREEMENT"
  | "SALES_AGREEMENT"
  | "KVKK_NOTICE"
  | "WARRANTY_RETURNS"
  | "COOKIE_POLICY"
  | "COMMERCIAL_COMMUNICATION";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  docType: LegalDocumentType;
  version: string;
  lastUpdated: string;
  /** Taslak — avukat incelemesi gereklidir */
  isDraft: true;
  sections: LegalSection[];
};

const contact = siteConfig.contact;
const DEFAULT_VERSION = "1.0";
const LAST_UPDATED = "2026-08-09";

const VERSIONED_TYPES = siteConfig.legalVersions;

export function getLegalVersion(docType: LegalDocumentType): string {
  if (docType in VERSIONED_TYPES) {
    return VERSIONED_TYPES[docType as keyof typeof VERSIONED_TYPES];
  }
  return DEFAULT_VERSION;
}

const documents: LegalDocument[] = [
  {
    slug: "teslimat-kosullari",
    title: "Teslimat Koşulları",
    docType: "DELIVERY_TERMS",
    version: getLegalVersion("DELIVERY_TERMS"),
    lastUpdated: LAST_UPDATED,
    isDraft: true,
    sections: [
      {
        heading: "1. Genel Bilgiler",
        paragraphs: [
          `Bu Teslimat Koşulları, ${siteConfig.name} ("Platform") üzerinden verilen B2B toptan siparişlerin sevkiyat ve teslim süreçlerini düzenler.`,
          "Metin taslak niteliğindedir; yürürlüğe alınmadan önce hukuki incelemeden geçirilmelidir.",
          `İletişim: ${contact.email} | ${contact.phone} | ${contact.address}`,
        ],
      },
      {
        heading: "2. Teslimat Bölgesi ve Yöntemi",
        paragraphs: [
          "Teslimatlar, Platform üzerinden onaylanan siparişlere bağlı olarak Türkiye sınırları içinde, satıcı veya anlaşmalı kargo/lojistik firmaları aracılığıyla gerçekleştirilir.",
          "Teslimat adresi, sipariş sırasında firmanın beyan ettiği işyeri veya depo adresidir. Adres hatalarından doğan gecikme ve ek maliyetlerden Platform sorumlu tutulamaz.",
        ],
      },
      {
        heading: "3. Süreler",
        paragraphs: [
          "Tahmini teslimat süreleri ürün, stok ve lojistik koşullarına göre değişiklik gösterebilir. Platform üzerinden paylaşılan süreler kesin taahhüt değildir; mücbir sebep ve lojistik aksaklıklar süreleri etkileyebilir.",
          "Sipariş onayından sonra sevkiyat planı satıcı tarafından belirlenir; firma, sevkiyat bilgisini sipariş ekranından takip edebilir.",
        ],
      },
      {
        heading: "4. Teslim Alma ve Kontrol",
        paragraphs: [
          "Teslim sırasında ürünlerin ambalaj bütünlüğü ve miktarı kontrol edilmelidir. Görünür hasar veya eksiklik halinde durum, teslim tutanağına veya kargo belgesine işlenmeli ve derhal Platform üzerinden bildirilmelidir.",
          "Teslim alındıktan sonra makul süre içinde bildirilmeyen görünür ayıplardan Platform ve satıcı sorumlu tutulamaz.",
        ],
      },
      {
        heading: "5. Masraflar",
        paragraphs: [
          "Kargo, navlun ve benzeri teslimat masraflarının kim tarafından karşılanacağı sipariş veya teklif aşamasında belirtilir. Aksi kararlaştırılmadıkça masraflar sipariş özetinde gösterilen şekilde uygulanır.",
        ],
      },
      {
        heading: "6. İletişim",
        paragraphs: [
          `Teslimat ile ilgili talepleriniz için: ${contact.email}, ${contact.phone}. Adres: ${contact.address}.`,
          "Şirket unvanı, [Vergi No], [MERSİS No] ve diğer resmi kimlik bilgileri güncellenerek bu metne eklenecektir.",
        ],
      },
    ],
  },
  {
    slug: "gizlilik-ve-guvenlik",
    title: "Gizlilik ve Güvenlik",
    docType: "PRIVACY_SECURITY",
    version: getLegalVersion("PRIVACY_SECURITY"),
    lastUpdated: LAST_UPDATED,
    isDraft: true,
    sections: [
      {
        heading: "1. Amaç",
        paragraphs: [
          `Bu metin, ${siteConfig.name} Platformu'nda kullanıcı hesapları, siparişler ve teknik altyapıya ilişkin gizlilik ile bilgi güvenliği yaklaşımlarını özetler.`,
          "Taslak metindir; KVKK aydınlatma metni ve çerez politikası ile birlikte değerlendirilmelidir.",
        ],
      },
      {
        heading: "2. Toplanan Bilgiler",
        paragraphs: [
          "Platform; üyelik, sipariş ve destek süreçleri için firma unvanı, yetkili kişi bilgileri, iletişim verileri, sipariş geçmişi ve oturum/teknik günlük kayıtları gibi bilgileri işleyebilir.",
          "Ödeme kartı bilgisi Platform üzerinde tutulmaz; Platform sipariş odaklıdır ve ödeme tahsilatı bu sürümde yapılmamaktadır.",
        ],
      },
      {
        heading: "3. Güvenlik Önlemleri",
        paragraphs: [
          "Hesap erişimi kimlik doğrulama ile korunur. Yetkisiz erişimi önlemek için şifrelerin gizli tutulması kullanıcının sorumluluğundadır.",
          "İletişim ve veri aktarımında mümkün olduğunca güvenli protokoller (ör. HTTPS) kullanılır. Sistem güncellemeleri ve erişim kontrolü ile riskler azaltılmaya çalışılır.",
        ],
      },
      {
        heading: "4. Üçüncü Taraflar",
        paragraphs: [
          "Barındırma, e-posta, analitik veya lojistik gibi hizmet sağlayıcılarla yalnızca hizmetin gerektirdiği ölçüde veri paylaşılabilir. Bu tarafların kendi gizlilik politikaları ayrıca geçerlidir.",
        ],
      },
      {
        heading: "5. İhlal Bildirimi",
        paragraphs: [
          `Güvenlik veya gizlilik ile ilgili bildirimler için: ${contact.email}. Telefon: ${contact.phone}. Adres: ${contact.address}.`,
          "Resmi şirket kimlik bilgileri ([Vergi No], [MERSİS No]) sonradan eklenecektir.",
        ],
      },
    ],
  },
  {
    slug: "uyelik-sozlesmesi",
    title: "Üyelik Sözleşmesi",
    docType: "MEMBERSHIP_AGREEMENT",
    version: getLegalVersion("MEMBERSHIP_AGREEMENT"),
    lastUpdated: LAST_UPDATED,
    isDraft: true,
    sections: [
      {
        heading: "1. Taraflar",
        paragraphs: [
          `İşbu Üyelik Sözleşmesi, ${siteConfig.name} Platformu'nu işleten şirket ("Platform İşletmecisi") ile Platform'a üye olan tüzel kişi firma ("Üye") arasında akdedilir.`,
          "Platform İşletmecisi'nin unvanı, adresi, [Vergi No] ve [MERSİS No] bilgileri güncellenerek bu metne işlenecektir.",
          `İletişim: ${contact.email} | ${contact.phone} | ${contact.address}`,
        ],
      },
      {
        heading: "2. Konu",
        paragraphs: [
          "Sözleşme; Üye'nin Platform üzerinden ürünleri incelemesi, sepet oluşturması, sipariş vermesi ve ilgili hesap işlevlerini kullanmasına ilişkin koşulları düzenler.",
          "Platform, B2B toptan sipariş amaçlıdır; tüketici (B2C) satışları bu sözleşmenin konusu dışındadır.",
        ],
      },
      {
        heading: "3. Üyelik Başvurusu ve Onay",
        paragraphs: [
          "Üyelik için firmanın doğru ve güncel bilgileri beyan etmesi gerekir. Platform, başvuruyu değerlendirme ve onaylama/reddetme hakkını saklı tutar.",
          "Onaylanmayan hesaplar sipariş ve kısıtlı işlevlere erişemez. Yanlış beyan, üyelik askıya alma veya sona erdirme sebebi olabilir.",
        ],
      },
      {
        heading: "4. Üye Yükümlülükleri",
        paragraphs: [
          "Üye; hesap güvenliğini korur, Platform'u hukuka aykırı amaçlarla kullanmaz, üçüncü kişilerin haklarını ihlal etmez ve sipariş/iletişim süreçlerinde dürüst davranır.",
          "Yetkili kullanıcıların işlemleri Üye adına yapılmış sayılır.",
        ],
      },
      {
        heading: "5. Platform'un Hak ve Yükümlülükleri",
        paragraphs: [
          "Platform, hizmetin sürekliliğini makul ölçüde sağlamaya çalışır; bakım, güncelleme veya mücbir sebepler nedeniyle kesintiler oluşabilir.",
          "Ürün bilgileri, fiyatlar ve stok durumları değişebilir; sipariş onayı nihai bağlayıcılık için esas alınır.",
        ],
      },
      {
        heading: "6. Süre ve Fesih",
        paragraphs: [
          "Sözleşme üyelik devam ettiği sürece yürürlüktedir. Taraflar, yürürlükteki mevzuata ve Platform kurallarına aykırılık halinde üyeliği sona erdirebilir.",
          "Fesih, tamamlanmış siparişlerden doğan hak ve borçları ortadan kaldırmaz.",
        ],
      },
      {
        heading: "7. Uygulanacak Hukuk",
        paragraphs: [
          "Bu sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda yetkili mahkemeler ve icra daireleri, Platform İşletmecisi'nin yerleşim yerine göre belirlenecek olup kesin yetki bilgisi hukuki inceleme sonrası güncellenecektir.",
        ],
      },
    ],
  },
  {
    slug: "satis-sozlesmesi",
    title: "Satış Sözleşmesi",
    docType: "SALES_AGREEMENT",
    version: getLegalVersion("SALES_AGREEMENT"),
    lastUpdated: LAST_UPDATED,
    isDraft: true,
    sections: [
      {
        heading: "1. Taraflar ve Konu",
        paragraphs: [
          `Bu Satış Sözleşmesi taslağı, ${siteConfig.name} Platformu üzerinden verilen B2B toptan siparişlerde satıcı ile alıcı firma arasındaki temel satış koşullarını çerçeveler.`,
          "Kesin sözleşme metni, fatura/irsaliye ve sipariş onayı ile birlikte değerlendirilir. Metin avukat incelemesine tabidir.",
        ],
      },
      {
        heading: "2. Sipariş ve Kabul",
        paragraphs: [
          "Sipariş, Platform üzerinden iletilir. Satış ilişkisi, siparişin satıcı veya Platform süreçleri uyarınca onaylanması ile oluşur.",
          "Stok yetersizliği, fiyat güncellemesi veya operasyonel nedenlerle sipariş kısmen veya tamamen kabul edilmeyebilir; bu durumda Üye bilgilendirilir.",
        ],
      },
      {
        heading: "3. Bedel ve Ödeme",
        paragraphs: [
          "Ürün bedelleri sipariş anında görünen veya ayrıca teklif edilen fiyatlara göredir. Platform bu sürümde ödeme tahsilatı yapmayabilir; ödeme şekli ve vadesi taraflar arasında ayrıca kararlaştırılır.",
          "KDV ve yasal yükümlülükler fatura üzerinde gösterilir.",
        ],
      },
      {
        heading: "4. Teslim ve Risk",
        paragraphs: [
          "Teslimat, Teslimat Koşulları ve sipariş özetine göre yapılır. Hasar ve kayıp riskinin ne zaman geçeceği, teslim şekline ve tarafların anlaşmasına bağlıdır.",
        ],
      },
      {
        heading: "5. Ayıp ve İade",
        paragraphs: [
          "Ayıplı mal, garanti ve iade süreçleri Garanti ve İade Koşulları ile mevzuata tabidir. Ticari satışlarda cayma hakkı tüketici mevzuatındaki gibi otomatik uygulanmayabilir.",
        ],
      },
      {
        heading: "6. İletişim ve Kimlik",
        paragraphs: [
          `Satış ile ilgili bildirimler: ${contact.email}, ${contact.phone}. Adres: ${contact.address}.`,
          "Satıcı/Platform İşletmecisi kimlik bilgileri: [Şirket Unvanı], [Vergi No], [MERSİS No] — sonradan doldurulacaktır.",
        ],
      },
    ],
  },
  {
    slug: "kisisel-verilerin-korunmasi",
    title: "Kişisel Verilerin Korunması (KVKK Aydınlatma)",
    docType: "KVKK_NOTICE",
    version: getLegalVersion("KVKK_NOTICE"),
    lastUpdated: LAST_UPDATED,
    isDraft: true,
    sections: [
      {
        heading: "1. Veri Sorumlusu",
        paragraphs: [
          `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla Platform İşletmecisi tarafından işlenebilir.`,
          `İletişim: ${contact.email} | ${contact.phone} | ${contact.address}`,
          "Veri sorumlusunun unvanı, [Vergi No] ve [MERSİS No] bilgileri kesinleştirilerek güncellenecektir. Bu metin taslaktır.",
        ],
      },
      {
        heading: "2. İşlenen Veri Kategorileri",
        paragraphs: [
          "Kimlik ve iletişim bilgileri, firma ve yetkili kişi bilgileri, işlem güvenliği verileri, sipariş ve talep kayıtları, gerektiğinde hukuki işlem bilgileri işlenebilir.",
        ],
      },
      {
        heading: "3. İşleme Amaçları ve Hukuki Sebepler",
        paragraphs: [
          "Veriler; üyelik ve hesap yönetimi, sipariş süreçlerinin yürütülmesi, destek hizmetleri, güvenlik, yasal yükümlülüklerin yerine getirilmesi ve açık rıza bulunan hallerde iletişim faaliyetleri için işlenir.",
          "Hukuki sebepler; sözleşmenin kurulması/ifası, hukuki yükümlülük, meşru menfaat ve gerektiğinde açık rızadır.",
        ],
      },
      {
        heading: "4. Aktarım",
        paragraphs: [
          "Veriler; barındırma, iletişim, lojistik ve benzeri hizmet sağlayıcılarına, yetkili kamu kurumlarına ve yasal zorunluluk halinde ilgili taraflara aktarılabilir.",
          "Yurt dışı aktarım söz konusu olursa KVKK'daki usuller uygulanır.",
        ],
      },
      {
        heading: "5. Saklama Süresi",
        paragraphs: [
          "Veriler, işleme amacının gerektirdiği süre ve ilgili mevzuattaki zamanaşımı/saklama süreleri boyunca muhafaza edilir; süre sonunda silinir, yok edilir veya anonim hale getirilir.",
        ],
      },
      {
        heading: "6. Haklarınız",
        paragraphs: [
          "KVKK m.11 kapsamındaki haklarınızı (bilgi talep etme, düzeltme, silme, itiraz vb.) veri sorumlusuna başvurarak kullanabilirsiniz.",
          `Başvurular için: ${contact.email}. Adres: ${contact.address}.`,
        ],
      },
    ],
  },
  {
    slug: "garanti-ve-iade-kosullari",
    title: "Garanti ve İade Koşulları",
    docType: "WARRANTY_RETURNS",
    version: getLegalVersion("WARRANTY_RETURNS"),
    lastUpdated: LAST_UPDATED,
    isDraft: true,
    sections: [
      {
        heading: "1. Kapsam",
        paragraphs: [
          `Bu koşullar, ${siteConfig.name} Platformu üzerinden gerçekleşen B2B toptan satışlarda ayıp, garanti ve iade süreçlerine ilişkin taslak çerçevedir.`,
          "Ürüne özel üretici garantisi varsa ayrıca uygulanır.",
        ],
      },
      {
        heading: "2. Ayıplı Mal",
        paragraphs: [
          "Teslim edilen ürünün siparişe, etikete veya kararlaştırılan niteliklere aykırı olması halinde firma, durumu makul süre içinde Platform üzerinden bildirmelidir.",
          "Bildirimde sipariş numarası, ürün bilgisi, ayıp açıklaması ve mümkünse görsel kanıt sunulmalıdır.",
        ],
      },
      {
        heading: "3. İnceleme ve Sonuç",
        paragraphs: [
          "Bildirimler incelenir; haklı görülen taleplerde değişim, tamamlayıcı sevkiyat veya tarafların anlaştığı başka bir çözüm uygulanabilir.",
          "Kullanım hatası, yanlış depolama veya üçüncü kişi müdahalesinden kaynaklanan durumlar garanti/iade kapsamı dışında kalabilir.",
        ],
      },
      {
        heading: "4. İade Şartları",
        paragraphs: [
          "Ticari satışlarda cayma hakkı, mesafeli tüketici satışlarındaki gibi otomatik olmayabilir. İade, satıcının onayı ve ürünün yeniden satılabilir durumda olması şartına bağlanabilir.",
          "İade kargo masraflarının kime ait olacağı talep sonucuna ve anlaşmaya göre belirlenir.",
        ],
      },
      {
        heading: "5. İletişim",
        paragraphs: [
          `Garanti ve iade talepleri: ${contact.email}, ${contact.phone}. Adres: ${contact.address}.`,
          "[Vergi No], [MERSİS No] ve şirket unvanı güncellenecektir.",
        ],
      },
    ],
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    docType: "COOKIE_POLICY",
    version: getLegalVersion("COOKIE_POLICY"),
    lastUpdated: LAST_UPDATED,
    isDraft: true,
    sections: [
      {
        heading: "1. Çerez Nedir?",
        paragraphs: [
          `Çerezler, ${siteConfig.name} web sitesini ziyaretiniz sırasında tarayıcınıza yerleştirilebilen küçük metin dosyalarıdır. Oturum yönetimi, güvenlik ve site performansına yardımcı olabilirler.`,
        ],
      },
      {
        heading: "2. Kullanılan Çerez Türleri",
        paragraphs: [
          "Zorunlu çerezler: oturum açma, güvenlik ve temel site işlevleri için gereklidir.",
          "İşlevsel/analitik çerezler: site kullanımını anlamak ve deneyimi iyileştirmek için kullanılabilir. Bunlar mümkün olduğunca anonim veya toplu istatistik düzeyinde tutulur.",
          "Pazarlama çerezleri yalnızca açık rıza varsa kullanılabilir.",
        ],
      },
      {
        heading: "3. Yönetim",
        paragraphs: [
          "Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezlerin engellenmesi sitenin bazı işlevlerinin çalışmamasına yol açabilir.",
        ],
      },
      {
        heading: "4. Güncellemeler ve İletişim",
        paragraphs: [
          "Bu politika taslaktır; çerez uygulamaları değiştikçe güncellenir.",
          `Sorularınız için: ${contact.email} | ${contact.phone} | ${contact.address}. [Vergi No], [MERSİS No] sonradan eklenecektir.`,
        ],
      },
    ],
  },
  {
    slug: "ticari-elektronik-ileti",
    title: "Ticari Elektronik İleti Bilgilendirmesi",
    docType: "COMMERCIAL_COMMUNICATION",
    version: getLegalVersion("COMMERCIAL_COMMUNICATION"),
    lastUpdated: LAST_UPDATED,
    isDraft: true,
    sections: [
      {
        heading: "1. Konu",
        paragraphs: [
          `6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat kapsamında, ${siteConfig.name} Platformu ticari elektronik ileti (SMS, e-posta, arama vb.) gönderebilir.`,
          "Bu metin taslak bilgilendirmedir; onay süreçleri hukuki incelemeye tabidir.",
        ],
      },
      {
        heading: "2. İleti İçeriği",
        paragraphs: [
          "Kampanya, ürün, sipariş durumu, duyuru ve benzeri ticari içerikler ile işlem bildirimleri gönderilebilir.",
          "İşlem bildirimleri (ör. sipariş onayı) hizmetin ifası için gerekli olabilir ve pazarlama izninden ayrı değerlendirilir.",
        ],
      },
      {
        heading: "3. Onay ve Ret",
        paragraphs: [
          siteConfig.requireCommercialConsent
            ? "Platform ayarlarına göre pazarlama amaçlı ticari elektronik ileti için üyelik sırasında açık onay istenebilir."
            : "Pazarlama amaçlı ticari elektronik ileti, varsayılan olarak üyelik şartı değildir; onay vermeniz halinde gönderilir.",
          "Onayınızı dilediğiniz zaman iletideki ret imkânı veya hesap ayarları üzerinden geri alabilirsiniz. Ret işlemi makul süre içinde uygulanır.",
        ],
      },
      {
        heading: "4. Veri ve İletişim",
        paragraphs: [
          "İleti süreçlerinde kullanılan veriler KVKK Aydınlatma Metni kapsamında işlenir.",
          `İletişim: ${contact.email}, ${contact.phone}. Adres: ${contact.address}.`,
          "Gönderici kimliği: [Şirket Unvanı], [Vergi No], [MERSİS No] — kesin bilgiler eklenecektir.",
        ],
      },
    ],
  },
];

const bySlug = new Map(documents.map((doc) => [doc.slug, doc]));

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return bySlug.get(slug as LegalDocumentSlug);
}

export function listLegalDocuments(): LegalDocument[] {
  return [...documents];
}
