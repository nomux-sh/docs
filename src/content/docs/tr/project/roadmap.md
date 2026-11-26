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

Sekiz repo açık, hepsinin CI'ı çalışıyor: [`.github`](https://github.com/nomux-sh/.github), [`nomux`](https://github.com/nomux-sh/nomux), [`proto`](https://github.com/nomux-sh/proto), [`extension-api`](https://github.com/nomux-sh/extension-api), [`extensions`](https://github.com/nomux-sh/extensions), [`themes`](https://github.com/nomux-sh/themes), [`homebrew-tap`](https://github.com/nomux-sh/homebrew-tap) ve [`docs`](https://github.com/nomux-sh/docs).

### Yayınlananlar

| Bileşen | Sürüm | İçerik |
|---|---|---|
| [`nomux`](https://github.com/nomux-sh/nomux/releases/tag/v0.3.0) | 0.3.0 | Attach'li local Session'lar; her Session'ın journal'ı ve `nomux capture`; Host yeniden başladıktan sonra uykudaki Session'lar ve geri yüklemeleri; daemon'u oturum açılışında başlatan servis dosyası; SSH ile uzak Host'lar; extension host ve `ext` komutları. Adımlar [kurulum sayfasında](/docs/tr/guides/install/). |
| [Homebrew formula'sı](https://github.com/nomux-sh/homebrew-tap) | 0.3.0 | `brew install nomux-sh/tap/nomux`, `nomux` sürümünün binary'lerini macOS'e ve Linux'a kurar. |
| [`nomux-proto`](https://crates.io/crates/nomux-proto) | 0.7.0 | `proto` reposunun protokol crate'i. nomux 0.3.0, 0.5.0 sürümünü kullanır. |
| [`nomux-extension`](https://crates.io/crates/nomux-extension) | 0.1.0 | Extension SDK'sı; `extension-api` reposundan. İçinde ne olduğunu [extension'lar sayfası](/docs/tr/concepts/extensions/) anlatır. |
| [`nomux-theme`](https://crates.io/crates/nomux-theme) | 0.1.0 | Temayı yükleyip denetleyen crate; `themes` reposundan. Her temayı [önizleme sayfası](https://nomux-sh.github.io/themes/) gösterir. |

Resmi extension'ların hiçbiri henüz yayınlanmadı. Git extension'ı (`nomux.git`), arayüz parçası olmadan, `extensions` reposunun `main` branch'inde duruyor.

### M1 aşaması: bitmek üzere

M1'in büyük kısmı nomux 0.3.0'da var: istemci kopsa da daemon dursa da Session yaşar; Host yeniden başladığında Session uykuya geçer ve istendiğinde önceki çıktısıyla birlikte yeniden başlar.
Yeniden başlatmadan sonraki ilk ekran ölçülmedi. Ölçülen değer, 50 uykudaki Session'ın listesinin 25,3 ms'de (medyan) gelmesi. Ayrıntılar [performans sayfasında](/docs/tr/reference/performance/).

Kalan işler, `nomux` reposunun [0.4.0 milestone'undaki](https://github.com/nomux-sh/nomux/milestone/5) açık issue'lardır:

- Warm holder pool ([#11](https://github.com/nomux-sh/nomux/issues/11)).
- Terminal doğruluğu: fuzz testleri, golden testler ve vttest ([#13](https://github.com/nomux-sh/nomux/issues/13)); bir de ekran state'indeki bir hata ([#29](https://github.com/nomux-sh/nomux/issues/29)).
- CI'da performans bütçeleri ([#14](https://github.com/nomux-sh/nomux/issues/14)).

Aynı milestone'da şunlar da var:

- Her Session'ın belleği ([#38](https://github.com/nomux-sh/nomux/issues/38)), boşta duran agent'ların hazırda bekletilmesi ([#36](https://github.com/nomux-sh/nomux/issues/36)) ve Worktree'lerin yaşam döngüsü ([#37](https://github.com/nomux-sh/nomux/issues/37)).
- Her Session'ın durumu ([#60](https://github.com/nomux-sh/nomux/issues/60)); bu iş M4 aşamasına ait.
- SSH istemcisiyle büyüyen `nomux` binary'si ([#47](https://github.com/nomux-sh/nomux/issues/47)), uzak Host testlerinin geride bıraktığı process'ler ([#55](https://github.com/nomux-sh/nomux/issues/55)) ve `docs/cli.md`'deki bir düzeltme ([#39](https://github.com/nomux-sh/nomux/issues/39)).

Güncel liste milestone sayfasındadır.

### M2 aşaması: tamamlandı, istisnalarıyla

Uzak Host'lar nomux 0.3.0'da var: `nomux host add` SSH ile bağlanır, binary'leri kurar ve Host'u kaydeder; `--host` o Host'un daemon'unu kullanır; bağlantı koparsa attach çıktı kaybetmeden yeniden bağlanır. Ayrıntılar [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfasında.
Şunlar yapılmadı. Kaynak, nomux 0.3.0'ın [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md#open-points-for-the-next-versions) belgesi:

- Streamlocal forwarding'e izin vermeyen sunucular için ikinci yol olarak köprü komutu.
- İstemcinin desteklemediği yapılandırmalar için `ControlMaster` ile `ssh` programına geri düşme.
- Uzun gidiş-dönüş süreli bağlantılarda, Host cevap vermeden önce yerel echo. Bu yüzden "100 ms gecikmede yazmak local Host'takinden farksızdır" testi karşılanmıyor: her tuş bir gidiş-dönüş bekler.
- Host sertifikaları ve kullanıcı sertifikaları (`CertificateFile`).
- `~/.nomux/bin` altındaki eski sürümlerin silinmesi.
- Uzak Host'taki bir Session'ın ortamı.
- `/etc/ssh/ssh_config`.
- QUIC, port yönlendirme ve dosya aktarımı.

Aynı belgeye göre gerçek paket kaybıyla bir ölçüm yapılmadı: ölçümlerdeki kayıp, bir relay programındaki modelden geliyor.

### M3 aşaması: sürüyor

- `nomuxd` 0.3.0'da extension host var. Bir extension'ı, kullanıcının onayladığı izinlerle bir dizinden kurar; daemon parçasını ilk çağrıda başlatır, boşta kalınca durdurur. Komutlar [Extension'lar](/docs/tr/guides/extensions/) rehberinde.
- Git extension'ı `extensions` reposunun `main` branch'inde. Yayınlanmış bir sürümü yok.
- Yapılmayanlar: dosya erişimi için bir extension, extension olaylarının istemcilere iletilmesi, yeni host servisleri (daemon yalnızca `sessions.list` sunuyor), bir extension'ın dosyalarının, programlarının ve ağ erişiminin kısıtlanması, Proje ve Worktree veri modeli.

### Diğer aşamalar

- **M5.** `themes` reposunda token seti, temel temalar ve `nomux-theme` crate'i var. Desktop istemcisi henüz yok.

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
| **M2** Uzak Host'lar | Tek komut, uzaktaki bir Host'u SSH üzerinden ekler ve binary'leri oraya kurar. Yavaş bağlantıda bile yazarken gecikme hissedilmez. | Yeni bir sunucuyu `nomux host add` ile eklersiniz; nomux binary'leri kurar ve bir Session açar. 100 ms gecikme ve %2 paket kaybında yazmak, local Host'ta yazmaktan farksızdır. | `nomux`, `proto` | `tamamlandı` |
| **M3** Extension host'u, git ve dosyalar | Daemon, extension'ları ayrı process'ler olarak çalıştırır. İlk resmi extension'lar git durumunu ve dosya erişimini getirir. Proje ve Worktree veri modeli yerine oturur. | Bir extension'ı bir dizinden kurarsınız. Daemon, extension'ın daemon parçasını ilk kullanımda başlatır, boşta kalınca durdurur. Extension çökerse daemon durmaz, hiçbir Session sonlanmaz. Git extension'ı, bir dosya değiştiğinde Worktree'nin yeni durumunu polling yapmadan bildirir. | `nomux`, `extension-api`, `extensions` | `sürüyor` |
| **M4** Agent durum motoru ve Takımlar | nomux her Agent çalışmasının ve her Alt işin durumunu, o durumun kaynağıyla birlikte gösterir. Farklı araçların agent'ları aynı Takımda birlikte çalışır. | Tanımlanmadı. | `nomux`, `proto`, `extensions` | `planlandı` |
| **M5** Desktop istemcisi | Native desktop istemcisi Pane ağacını, Tab'ları ve terminali gösterir. Tema motoru ve arayüz dili motoru bu aşamada gelir. | Tanımlanmadı. | `desktop`, `themes`, `locales` | `sürüyor` |
| **M6** Agent ve extension arayüzleri | Desktop istemcisi agent'ları, Takımları ve onay isteklerini gösterir. Resmi extension'lar arayüzlerine kavuşur: diff'li git, editörlü dosya gezgini, process'ler ve browser. | Tanımlanmadı. | `desktop`, `extensions` | `planlandı` |
| **M7** Diller, registry ve skill'ler | Programlama dili extension'ları dil desteğini getirir. Registry; extension'ları, temaları ve dil paketlerini listeler. Agent skill'leri, agent'a nomux CLI'ını kullanmayı öğretir. Extension API'si son hâlini alır. | Tanımlanmadı. | `languages`, `registry`, `skills`, `extension-api`, `desktop` | `planlandı` |
| **M8** Doğrudan bağlantı ve port yönlendirme | İki cihaz eşleştirildikten sonra istemci Host'a SSH olmadan, doğrudan bağlanır. Uzak Host'taki bir port istemciden erişilebilir olur. | Tanımlanmadı. | `nomux`, `proto`, `relay`, `desktop` | `planlandı` |
| **M9** Mobil | iOS ve Android istemcileri Session'ları, agent'ları ve Takımları gösterir. Onay verebilir, tam bir terminal kullanabilir, değişiklikleri commit'leyebilirsiniz. | Tanımlanmadı. | `mobile`, `nomux` | `planlandı` |
| **M10** 1.0.0 sürüm hazırlığı | Güvenlik denetimi, bütün performans hedeflerinin son ölçümü, installer'lar, otomatik güncelleme ve kod imzalama. Bu aşama `1.0.0` sürümüyle kapanır. | Tanımlanmadı. | Bütün repolar | `planlandı` |

"Tanımlanmadı", aşamanın şu an bir kabul testi olmadığı anlamına gelir. Test, aşamanın işine başlanmadan önce bu sayfaya eklenir.

Henüz açılmamış bir repo, ona ihtiyaç duyan ilk aşama başlarken açılır.
Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
