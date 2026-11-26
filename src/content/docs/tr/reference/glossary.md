---
title: Sözlük
description: Her nomux kavramının tek adı. Kodda, CLI'da ve arayüzde hangi adın kullanılacağına bu sayfa karar verir.
---

nomux'ta neye ne ad verileceğine bu sayfa karar verir.
Her kavramın tek bir adı vardır; kodda, CLI'da, arayüzde ve dokümantasyonda hep o ad geçer.

Kod, komut, arayüz etiketi, sayfa ya da karar kaydı yazarken terimi bu tablodan alın.
Yeni bir kavrama ihtiyaç duyarsanız önce onu İngilizcesi ve Türkçesiyle bu tabloya ekleyin.

## Terimler

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| Host | Host | Üzerinde `nomuxd` çalışan makine. Host ya local'dir ya da ona SSH ile veya doğrudan bağlanılır. |
| Proje | Project | Bir Host'taki bir repo. Projenin bir klasörü, varsayılan bir agent'ı ve bir rengi vardır. |
| Grup | Group | Planlanıyor, nomux 0.4.0'da yok: Projeleri ve başka grupları, istenen derinlikte içeren adlandırılmış öğe. |
| Worktree | Worktree | Projenin bir git worktree'si. Bir Görev genelde kendi Worktree'sinde çalışır. |
| Session | Session | Tek bir holder process'inin tuttuğu tek bir PTY. Shell de, agent da, dev server da birer Session'dır. |
| Agent çalışması | Agent run | Bir Session'da çalışan bir agent. Aracı, modeli, durumu ve sağlayıcının verdiği session kimliği vardır. Agent bu kimlik sayesinde kaldığı yerden devam eder. |
| Alt iş | Child work | Bir Agent çalışmasının subagent'ı, takım arkadaşı ya da arka plan görevi. Alt işin de Alt işi olabilir; en fazla 8 seviye iç içe girebilir. |
| Takım | Team | Bir lider ile üyelerinden oluşan Session grubu. Takım tek bir Tab'da yaşar. Üyelerin aynı araç olması gerekmez. |
| Görev | Task | Kullanıcının ya da bir agent'ın açtığı iş. Görevin bir başlığı, bir Worktree'si ve üzerinde çalışan bir Session'ı ya da Takımı vardır. |
| Pane | Pane | Pane ağacındaki bir yaprak. Pane bir Tab yığını taşır. |
| Tab | Tab | Pane'de açık duran içeriklerden biri. Tab'ın türü, içerik türü registry'sinden gelir. |
| Yüzey kimliği | Surface ID | Tab'ın kimliği. Tab kapanana kadar değişmez. Session bu kimliği bir ortam değişkeninden okur. |

## Process'ler ve dosyalar

Bu terimler bir Host'ta çalışan process'leri ve onların dosyalarını adlandırır. Küçük harfle yazılırlar.

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| holder | holder | Tek bir Session'ın PTY'sini tutan process. Her Session için bir holder çalışır. Binary'si `nomux-holder`'dır. |
| daemon | daemon | Holder'ları başlatan, yeniden başladığında onları tekrar bulan ve istemcilere cevap veren process. Bir Host'ta her kullanıcı için bir daemon çalışır. Binary'si `nomuxd`'dir. |
| istemci | client | Session'ları göstermek ya da değiştirmek için daemon'a bağlanan program. CLI (`nomux`), desktop uygulaması ve mobil uygulamalar birer istemcidir. |
| runtime dizini | runtime directory | Daemon'un ve holder'ların socket'lerini ve keşif dosyalarını tuttuğu dizin: `~/.nomux/run`. |
| session kimliği | session identifier | Bir Session'ın o Host'taki adı. Daemon üretir: `a`-`z` ve `2`-`7` karakterlerinden oluşan 8 karakter. CLI bu kimliği yazdırır ve komutlarda bu kimliği bekler. |
| state dizini | state directory | Her Session'ın tanımını ve journal'ını tuttuğu dizin: Linux'ta `~/.local/state/nomux`, macOS'ta `~/Library/Application Support/nomux`. Host yeniden başlasa da silinmez. |
| journal | journal | Bir Session'ın diskteki çıktısı; state dizininde durur. Onu holder yazar. Bir Session için en fazla 32 MiB dosya tutar. `nomux capture` buradan okur. |
| checkpoint | checkpoint | Session ekranının, journal'daki belirli bir konumdaki kopyası. Holder başlangıçta, her 1 MiB çıktıdan sonra ve pencere boyutu değiştiğinde bir checkpoint yazar. |
| epoch | epoch | Session komutunun kaçıncı kez çalıştığını gösteren sayı: yeni bir Session'da 1'dir, her geri yüklemede bir artar. |
| servis dosyası | service file | Daemon'u oturum açılışında başlatan dosya: Linux'ta bir systemd kullanıcı unit'i, macOS'ta bir launchd agent'ı. Onu `nomux daemon install-service` yazar. |

## Session durumları ve geri yükleme

Bu terimler de, Session dışında, küçük harfle yazılır. CLI durumları `running`, `unreachable`, `dormant`, `ended` ve `damaged` olarak gösterir.

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| uykudaki Session | dormant Session | Process'i olmayan Session: holder'ı gitmiştir ama komutu bitmemiştir. Host yeniden başladıktan sonra her Session bu durumdadır. Daemon tanımını ve journal'ını saklar; geri yükleme komutu yeniden başlatır. |
| biten Session | ended Session | Komutu bitmiş Session. Daemon onu çıkış durumu ve journal'ıyla birlikte saklama süresi boyunca tutar. Yalnızca `nomux ls --all` gösterir. |
| bozuk Session | damaged Session | Daemon'un tanımını okuyamadığı Session. `nomux kill` onu siler. |
| geri yükleme | restore | Uykudaki bir Session'ın komutunu aynı komut, çalışma dizini ve pencere boyutuyla yeniden başlatmak. Önceki process'ler geri gelmez; önceki çıktı journal'da kalır. |
| geri yükleme politikası | restore policy | Daemon'un uykudaki bir Session'ı ne zaman geri yükleyeceği: `auto` (daemon başlarken), `on-focus` (ilk attach'te ya da `nomux start` ile; varsayılan budur) veya `manual` (yalnızca `nomux start` ile). CLI komutu `nomux restore-policy`'dir. |
| saklama süresi | retention time | Daemon'un biten bir Session'ı ne kadar tuttuğu. Varsayılanı 24 saattir. |
| hazırda bekletme | hibernation | Planlanıyor, nomux 0.4.0'da yok: daemon boşta duran bir agent'ın komutunu durdurur, Session'ını açtığınızda resume komutuyla yeniden başlatır. Uykudaki Session ile karıştırmayın; o, holder'ın sona ermesiyle oluşur. |

## Agent durumu

Bu terimler, bir Session'daki işle ilgili nomux'un bildiklerini adlandırır. Küçük harfle yazılırlar. CLI durumları `idle`, `working`, `done`, `needs you` ve `error` olarak yazdırır.

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| agent durumu | agent status | nomux'un bir Agent çalışması ve Alt işleri hakkında bildikleri: bir durum, durumun kaynağı ve isteğe bağlı olarak mesaj, başlık, ilerleme ve araç. `nomux status` bunu gösterir. |
| durum | state | Agent durumunun değeri: `idle`, `working`, `done`, `needs you` veya `error`. `needs you` durumunun bir türü olabilir: `permission`, `question` veya `auth`. |
| kaynak | source | Agent durumunun nereden geldiği. Daemon kaynaklara sabit bir sırayla bakar: adapter, program durumu, öz bildirim, session geri yükleme, prompt işaretleri ve ön plandaki program. Son ikisi tahmindir. |
| tahmin | guess | Daemon'un çıkarım yaptığı ve hiçbir programın bildirmediği durum. CLI bunu `(guess)` ile işaretler. |
| adapter | adapter | Bir agent aracının agent durumunu, o aracın hook olaylarından bildiren extension. Adapter extension da denir. |
| hook | hook | Bir agent aracının işinin belirli bir olayında çalıştırdığı komut. nomux için komut `nomux hook <araç> <olay>`'dır. `nomux hooks install` hook'ları aracın ayar dosyasına yazar. |
| öz bildirim | self-report | Bir Session'daki programın `nomux status set` ile bildirdiği durum. |
| görüldü | seen | `done` ve `error` için: kullanıcı sonucu gördü. Bir attach, Session'ın sonuçlarını görüldü olarak işaretler. CLI bunu `(seen)` olarak gösterir. |
| saklanan çalışma | kept run | Biten bir Session'ın son Agent çalışması. Daemon Session'ı silene kadar onu tutar; böylece `nomux status` ve `nomux agent explain` sonucu ve resume komutunu göstermeye devam eder. |
| olay | event | Daemon'un olay günlüğüne yazdığı bir değişiklik; örneğin bir Agent çalışmasının yeni durumu. `nomux events --follow` olayları yazdırır. |
| session token | session token | Holder'ın bir Session'ın komutuna `NOMUX_TOKEN` içinde verdiği rastgele token. Daemon bir Session için bildirimi yalnızca bu token ile kabul eder. |

## Holder havuzu ve bellek

Bu terimler küçük harfle yazılır.

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| holder havuzu | holder pool | Daemon'un yeni Session'lar için hazır tuttuğu holder'lar; her birinde kullanıcının shell'i önceden başlatılmıştır. Kaç tane olacağını `pool.size` ayarı belirler. |
| havuzdaki holder | pooled holder | Holder havuzundaki bir holder. Henüz Session'ı yoktur. Shell ile açılan yeni bir Session onu alır. |
| bellek ölçüsü | memory measure | nomux'un bir Session'ın belleğini nasıl saydığı: `pss` (orantılı set boyutu, Linux'ta) veya `rss` (resident set boyutu). `nomux ls --memory` bunu `MEASURE` sütununda gösterir. |
| soket bağlantısı | socket link | Runtime dizinine giden `/tmp/nomux-<hash>` sembolik bağlantısı. Uzun bir home dizini soket yolunu çok uzun yaptığında nomux bunu kullanır. |

## Uzak Host'lar

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| uzak Host | remote Host | İstemcinin SSH ile bağlandığı Host. `nomux host add` onu kaydeder, `--host <ad>` onu seçer. |
| bootstrap | bootstrap | nomux binary'lerini uzak bir Host'a koyan adımlar: sistemi yoklar, release arşivini istemcide indirip doğrular, binary'leri Host'ta `~/.nomux/bin/<sürüm>` altına kopyalar ve orada da doğrular. Bunu `nomux host add` yapar; `--host` ile çalışan her komut da binary'ler yoksa yapar. |

## Attach ve extension'lar

Bu terimler de küçük harfle yazılır.

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| attach | attach | Bir istemcinin terminalini bir Session'ın terminaline bağlamak: istemci Session'ın ekranını gösterir ve tuşlarını ona gönderir. Bu bağlantının kendisine de attach denir. Aynı Session'a birden fazla istemci attach olabilir. CLI komutu `nomux attach`'tir. |
| detach | detach | Bir attach'i bitirmek. Session yaşamaya devam eder. CLI komutu `nomux detach`'tir. |
| extension | extension | nomux'a bir özellik ekleyen paket. Bir manifest'i (`extension.toml`) ve bir ya da daha fazla parçası vardır. Bir Host'a `nomux ext install` ile kurulur. |
| daemon parçası | daemon part | Extension'ın Host'ta ayrı bir process olarak çalışan parçası. `nomuxd` onu ilk çağrıda başlatır, 60 saniye çağrı gelmezse durdurur. |
| extension host | extension host | Daemon'un kurulu extension'ları tutan ve daemon parçalarını çalıştıran kısmı. |
| izin | permission | Bir extension'ın manifest'inde istediği ve kullanıcının kurulumda onayladığı erişim: bir dizin (`fs`), bir program (`process`), ağ erişimi (`network`) ya da bir host servisinin kapsamı (`scope`). |
| arayüz parçası | UI part | Extension'ın istemcide çalışan parçası. |

## Kavramlar birbirine nasıl bağlanır

```text
Host → Proje → Worktree → Session (holder) → Agent çalışması → Alt iş* (subagent | takım arkadaşı | arka plan görevi)
                        ↘ Takım (lider Session + üye Session'lar)
```

State'in sahibi `nomuxd`'dir ve onu kendi veritabanına yazar.
Her holder da kendi Session'ına ait state'in gereken en küçük kopyasını tutar.
Bu yüzden daemon dursa bile state kaybolmaz: daemon yeniden bağlandığında onu holder'dan okur.

Görünüm state'i ise tek bir istemciye aittir; paylaşılan Session state'ine dahil değildir.
Açık olan Tab, Pane oranları ve sidebar genişliği buna örnektir.
Böylece desktop istemcisi ile mobil istemci aynı Session'a farklı görünümlerle bağlanabilir.

## Terimleri kullanırken

- Terimi olduğu gibi kullanın, yerine eş anlamlısını koymayın: Proje yerine "çalışma alanı", Pane yerine "pencere" demeyin.
- Türkçe metinde Türkçe terimi, İngilizce metinde İngilizce terimi yazın.
- Şu terimler iki dilde de aynıdır: Host, Worktree, Session, Pane, Tab, holder, daemon, journal, checkpoint, epoch, bootstrap, attach, detach, extension, extension host, adapter, hook ve session token.
- CLI'ın yazdırdığı ya da beklediği değerler çevrilmez: durumlar (`running`, `dormant`, `ended`) ve geri yükleme politikaları (`auto`, `on-focus`, `manual`).
- Koddaki adlar İngilizce terimden türetilir. Örnek: `sessions`, `agent_runs` ve `child_work` veritabanı tabloları ile `NOMUX_SURFACE_ID` ortam değişkeni.
