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

Repo iskeletleri hazır: [`.github`](https://github.com/nomux-sh/.github), [`nomux`](https://github.com/nomux-sh/nomux), [`proto`](https://github.com/nomux-sh/proto) ve [`docs`](https://github.com/nomux-sh/docs) açıldı; CI'ları çalışıyor, ilk mimari kararlar yazıldı.
İlk protokol crate'i yayında: [`nomux-proto` 0.1.0](https://crates.io/crates/nomux-proto).
M1 aşaması başladı. Yapılacak işler `nomux` repo'sunun [0.1.0](https://github.com/nomux-sh/nomux/milestone/1) ve [0.2.0](https://github.com/nomux-sh/nomux/milestone/2) milestone'larındaki issue'lar. Diğer aşamalar planlama durumunda.

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
| **M2** Uzak Host'lar | Tek komut, uzaktaki bir Host'u SSH üzerinden ekler ve binary'leri oraya kurar. Yavaş bağlantıda bile yazarken gecikme hissedilmez. | Yeni bir sunucuyu `nomux host add` ile eklersiniz; nomux binary'leri kurar ve bir Session açar. 100 ms gecikme ve %2 paket kaybında yazmak, local Host'ta yazmaktan farksızdır. | `nomux`, `proto` | `planlandı` |
| **M3** Extension host'u, git ve dosyalar | Daemon, extension'ları ayrı process'ler olarak çalıştırır. İlk resmi extension'lar git durumunu ve dosya erişimini getirir. Proje ve Worktree veri modeli yerine oturur. | Tanımlanmadı. | `nomux`, `extension-api`, `extensions` | `planlandı` |
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
