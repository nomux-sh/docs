---
title: Yol haritası
description: nomux'ta işlerin sırası, her aşamanın hedefi, dokunduğu repolar ve durumu.
---

Bu sayfa nomux'ta işlerin hangi sırayla yapılacağını ve her aşamanın ne durumda olduğunu gösterir.
Tarih ya da süre tahmini vermez. Bir aşama, işi bitince biter.

## Sürüm politikası

- Her aşama, o aşamada değişen bileşenlerin `0.x` ön sürümüyle kapanır.
- Bir bileşen çalışır hâle gelir gelmez ilk kullanılabilir sürümü yayınlanır.
- `1.0.0` öncesindeki sürümler ön sürümdür: minor sürümler arasında API, CLI ve protokol değişebilir.
- Kapsamın tamamı bitip bütün performans hedefleri ölçüldüğünde bileşenler `1.0.0` olur.

Bu politika [ADR-0008](https://github.com/nomux-sh/docs/blob/main/adr/0008-release-early-pre-releases.md) ile kayıt altındadır.
Sürüm kuralları ve yayın adımları [sürüm rehberinde](https://github.com/nomux-sh/.github/blob/main/RELEASING.md) yazar. İkisi de İngilizcedir.

## Bugünkü durum

Beş repo açık, hepsinin CI'ı çalışıyor: [`.github`](https://github.com/nomux-sh/.github), [`nomux`](https://github.com/nomux-sh/nomux), [`proto`](https://github.com/nomux-sh/proto), [`extension-api`](https://github.com/nomux-sh/extension-api) ve [`docs`](https://github.com/nomux-sh/docs).

### Yayınlananlar

| Bileşen | Sürüm | İçerik |
|---|---|---|
| [`nomux`](https://github.com/nomux-sh/nomux/releases/tag/v0.1.0) | 0.1.0 | Attach'li local Session'lar. CLI ile Session açar, listeler, sonlandırır; terminalinizle bir Session'a attach ve detach olursunuz. İstemci detach olsa da daemon dursa da Session yaşar. Adımlar [kurulum sayfasında](/docs/tr/guides/install/). |
| [`nomux-proto`](https://crates.io/crates/nomux-proto) | 0.3.0 | `proto` reposunun protokol crate'i. |
| [`nomux-extension`](https://crates.io/crates/nomux-extension) | 0.1.0 | Extension SDK'sının ilk sürümü; `extension-api` reposundan. İçinde ne olduğunu [extension'lar sayfası](/docs/tr/concepts/extensions/) anlatır. |

### M1 aşaması: geriye kalanlar

M1 aşaması sürüyor. 0.1.0 sürümü aşamanın tamamını içermez: Host yeniden başladığında Session yaşamaz, attach de scrollback göstermez.
Kalan işler, `nomux` reposunun [0.2.0 milestone'undaki](https://github.com/nomux-sh/nomux/milestone/2) açık issue'lardır:

- Holder'ın journal'ı, checkpoint'i ve sıkıştırılmış scrollback'i ([#9](https://github.com/nomux-sh/nomux/issues/9)).
- Warm holder pool ([#11](https://github.com/nomux-sh/nomux/issues/11)).
- Host yeniden başladıktan sonra Session'ların ihtiyaç anında geri yüklenmesi ([#12](https://github.com/nomux-sh/nomux/issues/12)).
- Terminal doğruluğu: fuzz testleri, golden testler ve vttest ([#13](https://github.com/nomux-sh/nomux/issues/13)).
- CI'da performans bütçeleri ([#14](https://github.com/nomux-sh/nomux/issues/14)).
- 0.1.0 sürümünde bilinen altı hata: dördü ekran state'inde ve redraw dizisinde ([#24](https://github.com/nomux-sh/nomux/issues/24), [#25](https://github.com/nomux-sh/nomux/issues/25), [#27](https://github.com/nomux-sh/nomux/issues/27), [#29](https://github.com/nomux-sh/nomux/issues/29)), biri ring buffer okuyucusunda ([#26](https://github.com/nomux-sh/nomux/issues/26)), biri de macOS'te bazı çalıştırmalarda başarısız olan bir attach testi ([#33](https://github.com/nomux-sh/nomux/issues/33)).

Güncel liste milestone sayfasındadır.

### M2 ve M3 aşamaları: işe başlandı

- **M2.** Uzak Host'lar üzerindeki çalışma başladı. Yapılacak işler `nomux` reposunun [0.3.0 milestone'undaki](https://github.com/nomux-sh/nomux/milestone/3) issue'lardır. Henüz hiçbir sürümde uzak Host yok.
- **M3.** Extension SDK'sı üzerindeki çalışma başladı: `nomux-extension` 0.1.0 yayında. Daemon henüz extension başlatmıyor.

Diğer aşamalar planlama durumunda.

## Aşamalar

Aşamalar tablodaki sırayla ilerler. Diğer repolar bir aşamadan söz ederken kısa kodunu (M1 – M10) kullanır.

Durum sütununda şu değerlerden biri bulunur:

| Durum | Anlamı |
|---|---|
| `planlandı` | Aşamanın işine henüz başlanmadı. |
| `sürüyor` | Aşamanın işine başlandı. |
| `tamamlandı` | İş bitti ve aşamanın ön sürümü yayınlandı. |

| Aşama | Hedef | Ne zaman bitmiş sayılır | Repolar | Durum |
|---|---|---|---|---|
| **M1** Kalıcı terminal çekirdeği | İstemci kopsa, daemon dursa ya da Host yeniden başlasa bile terminal Session'ı Host'ta yaşamaya devam eder. Session'lar CLI ile açılır, CLI ile bağlanılır. | SSH ile bağlandığınız bir Host'ta Session açıp laptop'u kapatırsınız; açıp yeniden bağlandığınızda ekran bıraktığınız gibidir. `nomuxd`'yi `kill -9` ile öldürürsünüz, Session yaşar. Host yeniden başladıktan sonra ilk ekran 1 saniyede gelir. | `nomux`, `proto` | `sürüyor` |
| **M2** Uzak Host'lar | Tek komut, uzaktaki bir Host'u SSH üzerinden ekler ve binary'leri oraya kurar. Yavaş bağlantıda bile yazarken gecikme hissedilmez. | Yeni bir sunucuyu `nomux host add` ile eklersiniz; nomux binary'leri kurar ve bir Session açar. 100 ms gecikme ve %2 paket kaybında yazmak, local Host'ta yazmaktan farksızdır. | `nomux`, `proto` | `sürüyor` |
| **M3** Extension host'u, git ve dosyalar | Daemon, extension'ları ayrı process'ler olarak çalıştırır. İlk resmi extension'lar git durumunu ve dosya erişimini getirir. Proje ve Worktree veri modeli yerine oturur. | Bir extension'ı bir dizinden kurarsınız. Daemon, extension'ın daemon parçasını ilk kullanımda başlatır, boşta kalınca durdurur. Extension çökerse daemon durmaz, hiçbir Session sonlanmaz. Git extension'ı, bir dosya değiştiğinde Worktree'nin yeni durumunu polling yapmadan bildirir. | `nomux`, `extension-api`, `extensions` | `sürüyor` |
| **M4** Agent durum motoru ve Takımlar | nomux her Agent çalışmasının ve her Alt işin durumunu, o durumun kaynağıyla birlikte gösterir. Farklı araçların agent'ları aynı Takımda birlikte çalışır. | Tanımlanmadı. | `nomux`, `proto`, `extensions` | `planlandı` |
| **M5** Desktop istemcisi | Native desktop istemcisi Pane ağacını, Tab'ları ve terminali gösterir. Tema motoru ve arayüz dili motoru bu aşamada gelir. | Tanımlanmadı. | `desktop`, `themes`, `locales` | `planlandı` |
| **M6** Agent ve extension arayüzleri | Desktop istemcisi agent'ları, Takımları ve onay isteklerini gösterir. Resmi extension'lar arayüzlerine kavuşur: diff'li git, editörlü dosya gezgini, process'ler ve browser. | Tanımlanmadı. | `desktop`, `extensions` | `planlandı` |
| **M7** Diller, registry ve skill'ler | Programlama dili extension'ları dil desteğini getirir. Registry; extension'ları, temaları ve dil paketlerini listeler. Agent skill'leri, agent'a nomux CLI'ını kullanmayı öğretir. Extension API'si son hâlini alır. | Tanımlanmadı. | `languages`, `registry`, `skills`, `extension-api`, `desktop` | `planlandı` |
| **M8** Doğrudan bağlantı ve port yönlendirme | İki cihaz eşleştirildikten sonra istemci Host'a SSH olmadan, doğrudan bağlanır. Uzak Host'taki bir port istemciden erişilebilir olur. | Tanımlanmadı. | `nomux`, `proto`, `relay`, `desktop` | `planlandı` |
| **M9** Mobil | iOS ve Android istemcileri Session'ları, agent'ları ve Takımları gösterir. Onay verebilir, tam bir terminal kullanabilir, değişiklikleri commit'leyebilirsiniz. | Tanımlanmadı. | `mobile`, `nomux` | `planlandı` |
| **M10** 1.0.0 sürüm hazırlığı | Güvenlik denetimi, bütün performans hedeflerinin son ölçümü, installer'lar, otomatik güncelleme ve kod imzalama. Bu aşama `1.0.0` sürümüyle kapanır. | Tanımlanmadı. | Bütün repolar | `planlandı` |

"Tanımlanmadı", aşamanın şu an bir kabul testi olmadığı anlamına gelir. Test, aşamanın işine başlanmadan önce bu sayfaya eklenir.

Henüz açılmamış bir repo, ona ihtiyaç duyan ilk aşama başlarken açılır.
Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
