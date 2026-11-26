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

Dokuz repo var. Sekizinde CI çalışıyor: [`.github`](https://github.com/nomux-sh/.github), [`nomux`](https://github.com/nomux-sh/nomux), [`proto`](https://github.com/nomux-sh/proto), [`extension-api`](https://github.com/nomux-sh/extension-api), [`extensions`](https://github.com/nomux-sh/extensions), [`themes`](https://github.com/nomux-sh/themes), [`homebrew-tap`](https://github.com/nomux-sh/homebrew-tap) ve [`docs`](https://github.com/nomux-sh/docs). Dokuzuncusu, [`desktop`](https://github.com/nomux-sh/desktop), geliştirme aşamasında.

### Yayınlananlar

| Bileşen | Sürüm | İçerik |
|---|---|---|
| [`nomux`](https://github.com/nomux-sh/nomux/releases/tag/v0.4.0) | 0.4.0 | Attach'li local Session'lar; her Session'ın journal'ı ve `nomux capture`; Host yeniden başladıktan sonra uykudaki Session'lar ve geri yüklemeleri; daemon'u oturum açılışında başlatan servis dosyası; SSH ile uzak Host'lar; extension host ve `ext` komutları. 0.4.0 ile gelenler: her Session'ın kaynağıyla birlikte agent durumu (`nomux status`, `nomux agent explain`, `nomux events`), adapter extension'lar ve hook'lar (`nomux hook`, `nomux hooks`), her Session'ın belleği (`nomux ls --memory`), holder havuzu, Session'ın ortamı ve uzun bir home dizini için kısa soket yolları. Adımlar [kurulum sayfasında](/docs/tr/guides/install/). |
| [Homebrew formula'sı](https://github.com/nomux-sh/homebrew-tap) | 0.4.0 | `brew install nomux-sh/tap/nomux`, `nomux` sürümünün binary'lerini macOS'e ve Linux'a kurar. |
| [`nomux-proto`](https://crates.io/crates/nomux-proto) | 0.12.0 | `proto` reposunun protokol crate'i. nomux 0.4.0, 0.8.0 sürümünü kullanır. |
| Extension SDK'ları | 0.1.3 | Rust için [`nomux-extension`](https://crates.io/crates/nomux-extension) crate'i, TypeScript için [`@nomux-sh/extension`](https://www.npmjs.com/package/@nomux-sh/extension) paketi ve Go için `github.com/nomux-sh/extension-api/sdk/go` modülü; `extension-api` reposundan. Üçünü birlikte denetleyen bir conformance suite'i de var. Nasıl kullanılacağı [Extension yazmak](/docs/tr/guides/write-an-extension/) sayfasında. nomux 0.4.0, `nomux-extension` 0.1.1 sürümünü kullanır. |
| [`nomux-theme`](https://crates.io/crates/nomux-theme) | 0.3.1 | Temayı yükleyip denetleyen crate; `themes` reposundan. Her temayı [önizleme sayfası](https://nomux-sh.github.io/themes/) gösterir. |

Resmi extension'ların ikisi de 0.1.0 sürümüyle yayında: Git extension'ı (`nomux.git`) ve Claude Code adapter'ı (`nomux.agent-claude`). İkisinde de arayüz parçası yok. Arşivi indirip [Yayınlanmış bir extension'ı kurma](https://github.com/nomux-sh/extensions#install-a-released-extension) bölümündeki adımlarla kurabilirsiniz.

### Süren işler

M1'den M5'e kadar olan aşamalar sürüyor. Hiçbir aşama bitmedi: her aşamanın ya karşılanmayan bir kabul testi ya da tamamlanmamış işi var. Aşağıdaki bölümler 0.4.0'da nelerin olduğunu ve nelerin eksik kaldığını anlatır.

#### M1 aşaması: sürüyor, kabul testi henüz sağlanmıyor

nomux 0.4.0'da M1'in çekirdeği var: istemci kopsa da daemon dursa da Session yaşar; Host yeniden başladığında Session uykuya geçer ve istendiğinde önceki çıktısıyla birlikte yeniden başlar. 0.4.0 ile yeni Session'lar için hazır holder'lar tutan [holder havuzu](/docs/tr/guides/holder-pool/) geldi.
"Host yeniden başladıktan sonra ilk ekran 1 saniyede gelir" testi ölçülmedi. Ölçülen değerler [performans sayfasında](/docs/tr/reference/performance/).

Kalan işler, `nomux` reposunun [0.5.0 milestone'undaki](https://github.com/nomux-sh/nomux/milestone/6) açık issue'lardır:

- Terminal doğruluğu: fuzz testleri, golden testler ve vttest ([#13](https://github.com/nomux-sh/nomux/issues/13)); bir de ekran state'indeki bir hata ([#29](https://github.com/nomux-sh/nomux/issues/29)).
- CI'da performans bütçeleri ([#14](https://github.com/nomux-sh/nomux/issues/14)).
- Holder havuzu, yeni bir Session'ın terminalinde dizin değişikliğini gösteriyor ([#74](https://github.com/nomux-sh/nomux/issues/74)).
- Session, kendisini isteyen istemcinin ortam değişkenlerini almıyor ([#75](https://github.com/nomux-sh/nomux/issues/75)).
- Session'ın bellek limiti ([#38](https://github.com/nomux-sh/nomux/issues/38)): 0.4.0 belleği gösterir, limit yalnızca bir tasarımdır. Boşta duran agent'ların hazırda bekletilmesi ([#36](https://github.com/nomux-sh/nomux/issues/36)) ve Worktree'lerin yaşam döngüsü ([#37](https://github.com/nomux-sh/nomux/issues/37)) henüz yapılmadı.
- SSH istemcisiyle büyüyen `nomux` binary'si ([#47](https://github.com/nomux-sh/nomux/issues/47)) ve macOS'te bazı çalıştırmalarda başarısız olan bir uzak Host testi ([#69](https://github.com/nomux-sh/nomux/issues/69)).

Güncel liste milestone sayfasındadır.

#### M2 aşaması: sürüyor, kabul testi henüz sağlanmıyor

Uzak Host'lar nomux 0.4.0'da var: `nomux host add` SSH ile bağlanır, binary'leri kurar ve Host'u kaydeder; `--host` o Host'un daemon'unu kullanır; bağlantı koparsa attach çıktı kaybetmeden yeniden bağlanır. Ayrıntılar [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfasında.
Şunlar yapılmadı. Kaynak, nomux 0.4.0'ın [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/remote.md#open-points-for-the-next-versions) belgesi:

- Streamlocal forwarding'e izin vermeyen sunucular için ikinci yol olarak köprü komutu.
- İstemcinin desteklemediği yapılandırmalar için `ControlMaster` ile `ssh` programına geri düşme.
- Uzun gidiş-dönüş süreli bağlantılarda, Host cevap vermeden önce yerel echo. Bu yüzden "100 ms gecikmede yazmak local Host'takinden farksızdır" testi karşılanmıyor: her tuş bir gidiş-dönüş bekler.
- Host sertifikaları ve kullanıcı sertifikaları (`CertificateFile`).
- `~/.nomux/bin` altındaki eski sürümlerin silinmesi.
- Uzak Host'taki bir Session'ın ortamı.
- `/etc/ssh/ssh_config`.
- QUIC, port yönlendirme ve dosya aktarımı.

Aynı belgeye göre gerçek paket kaybıyla bir ölçüm yapılmadı: ölçümlerdeki kayıp, bir relay programındaki modelden geliyor.

#### M3 aşaması: sürüyor

- `nomuxd` 0.4.0'da extension host var. Bir extension'ı, kullanıcının onayladığı izinlerle bir dizinden kurar; daemon parçasını ilk çağrıda başlatır, boşta kalınca durdurur. Extension istemcilere olay gönderebilir, adapter extension ise bir durum bildirebilir. Komutlar [Extension'lar](/docs/tr/guides/extensions/) rehberinde.
- Extension SDK'ları Rust, TypeScript ve Go için var. Python SDK'sı planlanıyor.
- Git extension'ı ile Claude Code adapter'ının sürümü 0.1.0. İkisi `extensions` reposunda yayında.
- Yapılmayanlar: dosya erişimi için bir extension, bir extension'ın dosyalarının, programlarının ve ağ erişiminin kısıtlanması, extension'ın arayüz parçası, Proje ve Worktree veri modeli.

#### M4 aşaması: sürüyor

nomux 0.4.0'da agent durum motoru var: her Session'ın kaynağıyla birlikte bir durumu vardır, bir Agent çalışmasının Alt iş ağacı vardır ve kaynakların sırası sabittir. Ayrıntılar [Agent durumu](/docs/tr/guides/agent-status/) sayfasında. Claude Code adapter'ı ([rehber](/docs/tr/guides/claude-code/)) ilk adapter'dır ve 0.1.0 sürümü yayında.
Yapılmayanlar: Takımlar, diğer agent araçları için adapter'lar ve hook'un araca verdiği cevap; onay kartları buna ihtiyaç duyar. M4'ün henüz bir kabul testi yok.

#### M5 aşaması: sürüyor, desktop istemcisi geliştiriliyor

`themes` reposunda token seti, temel temalar ve `nomux-theme` crate'i var. Desktop istemcisi [`desktop`](https://github.com/nomux-sh/desktop) reposunda geliştiriliyor; henüz bir sürümü yok. nomux 0.4.0'da desktop istemcisi yok: tek istemci CLI.

#### Proje grupları: main branch'inde, 0.5.0 ile gelecek

Bir grup, Projeleri ve başka grupları istenen derinlikte içerir; kapalı bir grup içindekilerin toplu durumunu gösterir. Bu, kapanmış olan [#71](https://github.com/nomux-sh/nomux/issues/71) issue'sudur. `nomux project` ve `nomux group` komutları, `nomux` reposunun main branch'ine [PR #80](https://github.com/nomux-sh/nomux/pull/80) ile merge edildi. 0.5.0 ile gelecekler; 0.5.0 henüz yayınlanmadı. nomux 0.4.0'da grup komutu, protokolde grup ve veri modelinde grup yok. `themes` reposunda sidebar'ın grup satırının şartnamesi var. [Sözlük](/docs/tr/reference/glossary/) bu terimi planlanıyor olarak listeler.

### Yapılmayanlar

Şunlar nomux 0.4.0'da yok:

- Desktop istemcisi (geliştiriliyor, sürümü yok) ve mobil istemciler.
- Proje grupları, Pane ağacı ve Tab'lar, Takımlar ve Görevler.
- Session adları ve tmux ile screen tarzı CLI komutları: geliştiriliyor, bkz. [#88](https://github.com/nomux-sh/nomux/issues/88).
- Session için bellek limiti, boşta duran agent'ların hazırda bekletilmesi ve Worktree'lerin yaşam döngüsü.
- SSH olmadan doğrudan bağlantı ve port yönlendirme.
- Bir registry.

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
| **M4** Agent durum motoru ve Takımlar | nomux her Agent çalışmasının ve her Alt işin durumunu, o durumun kaynağıyla birlikte gösterir. Farklı araçların agent'ları aynı Takımda birlikte çalışır. | Tanımlanmadı. | `nomux`, `proto`, `extensions` | `sürüyor` |
| **M5** Desktop istemcisi | Native desktop istemcisi Pane ağacını, Tab'ları ve terminali gösterir. Tema motoru ve arayüz dili motoru bu aşamada gelir. | Tanımlanmadı. | `desktop`, `themes`, `locales` | `sürüyor` |
| **M6** Agent ve extension arayüzleri | Desktop istemcisi agent'ları, Takımları ve onay isteklerini gösterir. Resmi extension'lar arayüzlerine kavuşur: diff'li git, editörlü dosya gezgini, process'ler ve browser. | Tanımlanmadı. | `desktop`, `extensions` | `planlandı` |
| **M7** Diller, registry ve skill'ler | Programlama dili extension'ları dil desteğini getirir. Registry; extension'ları, temaları ve dil paketlerini listeler. Agent skill'leri, agent'a nomux CLI'ını kullanmayı öğretir. Extension API'si son hâlini alır. | Tanımlanmadı. | `languages`, `registry`, `skills`, `extension-api`, `desktop` | `planlandı` |
| **M8** Doğrudan bağlantı ve port yönlendirme | İki cihaz eşleştirildikten sonra istemci Host'a SSH olmadan, doğrudan bağlanır. Uzak Host'taki bir port istemciden erişilebilir olur. | Tanımlanmadı. | `nomux`, `proto`, `relay`, `desktop` | `planlandı` |
| **M9** Mobil | iOS ve Android istemcileri Session'ları, agent'ları ve Takımları gösterir. Onay verebilir, tam bir terminal kullanabilir, değişiklikleri commit'leyebilirsiniz. | Tanımlanmadı. | `mobile`, `nomux` | `planlandı` |
| **M10** 1.0.0 sürüm hazırlığı | Güvenlik denetimi, bütün performans hedeflerinin son ölçümü, installer'lar, otomatik güncelleme ve kod imzalama. Bu aşama `1.0.0` sürümüyle kapanır. | Tanımlanmadı. | Bütün repolar | `planlandı` |

"Tanımlanmadı", aşamanın şu an bir kabul testi olmadığı anlamına gelir. Test, aşamanın işine başlanmadan önce bu sayfaya eklenir.

Henüz açılmamış bir repo, ona ihtiyaç duyan ilk aşama başlarken açılır.
Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
