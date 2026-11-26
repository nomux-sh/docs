---
title: Nasıl çalışır
description: Üç nomux process'i, attach sırasında olanlar, daemon durduğunda Session'ın neden yaşadığı, nomux'un bir agent'ın durumunu nasıl bildiği, yeni bir Session'ın nasıl hızlı açıldığı, Session'ın ne aldığı ve ne kullandığı, Host yeniden başladıktan sonra neyin kaldığı ve neyin nerede tutulduğu.
---

nomux bir Host'ta üç tür process çalıştırır: istemci, daemon ve holder.
Bu sayfa nomux 0.4.0'da var olanı anlatır. Tasarımın tamamı için [kavramlara genel bakış](/docs/tr/concepts/overview/) sayfasına bakın.

## Üç process

<figure>
<svg viewBox="0 0 540 452" role="img" aria-labelledby="processes-title processes-description" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 540px; height: auto;" fill="none" stroke="currentColor" stroke-width="1.5" font-size="14">
<title id="processes-title">Üç nomux process'i ve disk</title>
<desc id="processes-description">İstemci daemon'a bir Unix socket üzerinden bağlanır. Daemon her Session'ın holder'ına bir kontrol socket'i üzerinden bağlanır, Session'ın terminal çıktısını da holder'ın paylaşılan belleğinden okur. Komutun PTY'si holder'dadır; holder Session'ın tanımını ve journal'ını diske yazar. Daemon yeniden başlatmadan sonra Session'ları bulmak için diski okur. Daemon durduğunda holder ve komut çalışmaya devam eder.</desc>
<rect x="20" y="12" width="320" height="60" rx="6"/>
<rect x="20" y="126" width="320" height="60" rx="6"/>
<rect x="8" y="232" width="344" height="208" rx="10" stroke-dasharray="6 5"/>
<rect x="20" y="246" width="320" height="60" rx="6"/>
<rect x="20" y="366" width="320" height="60" rx="6"/>
<rect x="372" y="246" width="160" height="60" rx="6"/>
<path d="M180 72 V124 M174 116 L180 124 L186 116"/>
<path d="M180 186 V244 M174 236 L180 244 L186 236"/>
<path d="M180 306 V364 M174 356 L180 364 L186 356 M174 314 L180 306 L186 314"/>
<path d="M340 276 H370 M362 270 L370 276 L362 282"/>
<path d="M340 156 H500 V244 M494 236 L500 244 L506 236" stroke-dasharray="4 4"/>
<g stroke="none" fill="currentColor">
<text x="34" y="37" font-weight="600">istemci: nomux (CLI)</text>
<text x="34" y="58" font-size="12.5">tek komut çalıştırır ya da attach kalır</text>
<text x="194" y="95" font-size="12.5">Unix socket</text>
<text x="194" y="112" font-size="12" font-family="monospace">~/.nomux/run/nomuxd.sock</text>
<text x="34" y="151" font-weight="600">daemon: nomuxd</text>
<text x="34" y="172" font-size="12.5">kullanıcı başına bir tane, holder'ları başlatır</text>
<text x="388" y="148" font-size="12.5">başlarken okur</text>
<text x="194" y="209" font-size="12.5">kontrol socket'i</text>
<text x="194" y="226" font-size="12" font-family="monospace">~/.nomux/run/&lt;id&gt;/sock</text>
<text x="372" y="209" font-size="12.5">terminal çıktısı:</text>
<text x="372" y="226" font-size="12.5">paylaşılan bellek</text>
<text x="34" y="271" font-weight="600">holder: nomux-holder</text>
<text x="34" y="292" font-size="12.5">Session başına bir tane: PTY onundur</text>
<text x="384" y="271" font-weight="600">disk</text>
<text x="384" y="292" font-size="12.5">tanım, journal</text>
<text x="194" y="341" font-size="12.5">PTY</text>
<text x="34" y="391" font-weight="600">Session'ın komutu</text>
<text x="34" y="412" font-size="12.5">shell, agent, sunucu</text>
<text x="366" y="332" font-size="12.5">daemon durunca</text>
<text x="366" y="349" font-size="12.5">çalışmaya devam eder</text>
</g>
</svg>
<figcaption>Oklar, bağlanan process'ten cevap veren process'e ya da yazan process'ten diske doğrudur. PTY iki yönde de veri taşır. Attach sırasında tuşları Session'a, terminal çıktısını da istemciye daemon'un Unix socket'i taşır. Disk, kullanıcının state dizinidir; Host yeniden başlasa da silinmez.</figcaption>
</figure>

**İstemci**, sizin kullandığınız programdır. Bugün tek istemci CLI'dır: `nomux`.
Komut satırını okur, daemon'a bağlanır, isteğini gönderir, sonucu yazdırır ve çıkar.
Attach'te ise bağlı kalır; klavyenizi ve ekranınızı Session'a verir.
Çalışan bir daemon yoksa CLI onu kendisi başlatır. [Uzak bir Host](/docs/tr/guides/remote-hosts/) için CLI o Host'un daemon'una SSH üzerinden bağlanır; daemon ve holder'lar orada çalışır.

**Daemon**, `nomuxd`'dir. Her kullanıcı için bir daemon çalışır.
Her yeni Session için bir holder başlatır, Session listesini tutar ve istemcilere cevap verir.
Attach olmuş istemci ile holder arasında tuşları ve terminal çıktısını taşır.
Hiçbir terminalin sahibi değildir. [Extension'ların](/docs/tr/guides/extensions/) daemon parçalarını da, her birini ayrı bir process olarak, o çalıştırır.
Her Session'ın [agent durumunu](#nomux-bir-agent-hakkında-ne-bilir) tutar; yeni Session'lar için de birkaç holder'ı hazır bekletir: [holder havuzu](#holder-havuzu).

**Holder**, `nomux-holder`'dır. Her Session için bir holder çalışır.
PTY'yi açar, Session'ın komutunu başlatır ve komutun çıktısını okur; bağlı bir istemci ya da daemon olmasa bile.
Session'ın o anki ekranını bellekte tutar: görünen hücreleri renkleriyle, imleci ve terminal modlarını.
Session'ın tanımını ve çıktısını diske yazar; ayrıntılar [Journal](#journal) bölümünde.
Programların çıktıya yazdığı raporları da okur: program durumu (OSC 7501 terminal dizisi), shell'in prompt işaretleri (OSC 133) ve bildirimler (OSC 9 ve OSC 777). Daemon ilk ikisini [agent durumu](#nomux-bir-agent-hakkında-ne-bilir) için kullanır. Bu sürümde bildirimleri gösteren bir komut yoktur.
Holder tek thread'li küçük bir process'tir. Komut bir şey yazmadığı sürece hiç iş yapmaz.

İstemci yalnızca daemon'la konuşur. Holder'la ise yalnızca daemon konuşur.

## Attach sırasında ne olur

`nomux attach` ve `nomux new --attach`, terminalinizi bir Session'ın terminaline bağlar. [Hızlı başlangıç](/docs/tr/guides/quick-start/#yeniden-attach-olmak) bunu gerçek komutlarla gösterir.

1. **Pencere boyutu.** CLI terminalinizin boyutunu gönderir, Session o boyutu alır.
2. **Ekran.** Daemon holder'dan o anki ekranı ister. Holder, bu ekranı boş bir terminale çizen bir byte dizisi verir. CLI bu diziyi terminalinize yazar. Böylece Session'ı şu anki hâliyle görürsünüz; programlar ekranı saatler önce çizmiş olsa bile.
3. **Çıktı akışı.** Ekrandan sonra istemci, komutun yazdığı her byte'ı sırasıyla alır. Ekran ile akış birbirine tam oturur: arada eksik byte da olmaz, iki kez gelen byte da.
4. **Tuşlar.** Bastığınız her tuş CLI'dan daemon'a, oradan holder'a ve PTY'ye gider.

Holder istemcileri tanımaz ve hiçbirini beklemez. Çıktının son 256 KiB'ını bellekte tutar; daemon da her istemci için 64 KiB'lık tek bir buffer kullanır.
**Yavaş kalan istemci taze bir ekran alır.** İstemci çıktıyı komutun yazdığından yavaş alıyorsa ve sıradaki çıktı artık holder'ın belleğinde değilse, daemon o anki ekranı yeniden gönderir ve oradan devam eder. O istemci aradaki byte'ları değil, en güncel ekranı görür.
Bu sayede çıktı seli daemon'un belleğini büyütmez, komutu da yavaşlatmaz. Yavaş bir istemci, aynı Session'daki başka bir istemciyi etkilemez.

Aynı Session'a birden fazla istemci attach olabilir. Hepsi aynı çıktıyı alır, hepsinden yazılabilir. Session'ın tek bir pencere boyutu vardır: en son attach olan ya da boyutu en son değişen istemcininki.

Detach yalnızca istemcinin bağlantısını kapatır. Session'ın komutu sinyal almaz, bir değişiklik görmez.
Attach daemon üzerinden geçer. Daemon durursa attach hatayla biter, Session ise yaşar: yeniden attach olduğunuzda yeni daemon ekranı holder'dan alır.

Attach ekranı gösterir; ekrandan çıkmış satırları göstermez. Bu satırları `nomux capture` journal'dan okuyup yazdırır.

## Daemon durduğunda Session neden yaşar

Session'ın komutu daemon'un değil, holder'ın child process'idir. Komutun terminali de holder'a aittir.
Dolayısıyla daemon'un sonlanması hiçbir terminali kapatmaz, hiçbir komutu durdurmaz.

Holder, kendisini başlatan process'ten de bağımsızdır:

- Kendi process session'ı ve kendi process group'u vardır. Daemon'a ya da daemon'un grubuna gönderilen sinyal holder'a ulaşmaz.
- Bir Session'ın holder'ının daemon'la arasında pipe yoktur. Daemon gidince hata almaz.
- Runtime dizinine üç dosya yazar. Yeni bir daemon bu dosyaları okuyarak holder'ı bulur ve ona bağlanır.

Daemon başlarken runtime dizinini tarar. Çalışan her holder'a bağlanır, ölmüş holder'ların dizinlerini siler.
`nomux daemon stop`'tan, daemon'a atılan `kill -9`'dan ya da bir daemon çökmesinden sonra `nomux ls`'in aynı Session'ları göstermesi bundandır.
[Hızlı başlangıç](/docs/tr/guides/quick-start/#daemonu-durdurmak-session-yaşar) bunu gerçek komutlarla gösterir.

Bir runtime dizini için yalnızca tek bir daemon çalışabilir. İkinci daemon hata verip çıkar ve hiçbir şeye dokunmaz. `nomuxd --replace` ise çalışan daemon'u durdurup onun yerine geçer; hiçbir Session sonlanmaz.

[Holder havuzundaki](#holder-havuzu) holder bunun dışındadır: henüz Session'ı yoktur ve daemon'la birlikte sonlanır.

## Journal

Holder, Session'ının çıktısını kullanıcının state dizinindeki journal'a yazar. Journal'da komutun yazdığı byte'lar olduğu gibi durur; aralarda da checkpoint'ler, yani ekranın o konumdaki kopyaları bulunur.

- Holder çıktıyı okuduktan en geç 1 saniye sonra, 64 KiB birikmişse daha erken, journal'a yazar. Komut çalışırken diski beklemez.
- Holder başlangıçta, her 1 MiB çıktıdan sonra ve pencere boyutu değiştiğinde bir checkpoint yazar.
- Bir Session'ın journal'ı en fazla 32 MiB dosya tutar; holder önce en eski dosyaları siler. 32 MiB'a 50 MiB ile 90 MiB arası terminal çıktısı sığar.
- Disk dolarsa holder journal'ı durdurur, Session devam eder.

Holder state dizinine Session'ın tanımını da yazar: komut ve argümanları, çalışma dizini, pencere boyutu, başlama zamanı ve komut bittikten sonra çıkış durumu. Tanımda hiçbir ortam değişkeni yoktur, çünkü ortamda secret'lar olabilir.

`nomux capture` journal'ı okur. Bu yüzden ekrandan çıkmış satırları da, komutu durmuş bir Session'ın çıktısını da yazdırır.

## nomux bir agent hakkında ne bilir

Daemon her Session'ın **agent durumunu** tutar: orada ne çalışıyor, durumu nedir (`idle`, `working`, `done`, `needs you` ya da `error`) ve bu durumun kaynağı nedir. İstemci, bir programın raporuyla daemon'un tahminini her zaman ayırt edebilir. Tahmin hiçbir zaman kesin bilgi gibi gösterilmez.

Daemon altı kaynağa sabit bir sırayla bakar. Bir öğeyi bildiren ilk kaynak, o öğenin durumunu verir:

| Sıra | Kaynak | Ne olduğu |
|---:|---|---|
| 1 | Adapter | Bir agent aracının hook olaylarından durumu bildiren adapter extension'ı |
| 2 | Program durumu | Bir program durumunu terminal akışında bildirir (OSC 7501) |
| 3 | Öz bildirim | Session'daki bir program `nomux status set` çalıştırır |
| 4 | Session geri yükleme | Session process'ini kaybetti: durumundan geriye kalan |
| 5 | Prompt işaretleri | Shell'in prompt işaretleri: bir komut çalışıyor ya da giriş satırı bekliyor. Bu bir tahmindir |
| 6 | Ön plandaki program | Session'ın komutu olmayan bir program terminali tutuyor. Bu bir tahmindir |

- `nomux status` her Session için bir satır yazdırır; tahminin yanında `(guess)` yazar. `nomux status --tree` Alt işleri de ekler. `nomux agent explain <id>` her kaynağı bu sırayla, ne söylediğiyle birlikte yazdırır. `nomux events --follow` her değişikliği olduğu anda yazdırır.
- Session'ın durumunu en acil durum belirler: önce `needs you`, sonra görmediğiniz bir `error` ya da `done`, sonra `working`. Attach, Session'ın sonuçlarını görüldü olarak işaretler.
- Process'i olmayan Session'da iş çalışmaz. Session uykuya geçince `working` ve `needs you` durumları, "session restore" kaynağıyla `done` olur. Biten bir Session'ın son Agent çalışması, yani **saklanan çalışma**, daemon Session'ı silene kadar kalır. Daemon en fazla 64 saklanan çalışma tutar.
- Daemon durumu diske yazmaz. Daemon yeniden başladığında program raporlarını holder'lardan yeniden okur. Öz bildirimler, adapter'ların raporları, durumda geçen süre ve görüldü bilgisi ile olaylar gider.

### Adapter ve hook

Adapter, tek bir agent aracının hook olaylarını alan extension'dır. Araç, olaylarında `nomux hook <araç> <olay>` komutunu çalıştırır. Komut olayı daemon'a gönderir ve en fazla 80 ms bekler. Çıkış kodu her zaman 0'dır; yani aracı hiçbir zaman bloklamaz, bozmaz. Daemon Session'ın token'ını kontrol eder, olayı adapter'a verir ve adapter durumu bildirir.

`nomux hooks install <araç>`, hook'ların aracın ayar dosyasında gerektirdiği değişikliği yazdırır. Dosyayı yalnızca `--apply` ile yazar. Bu sürümde hook, nomux'tan cevap almaz: nomux henüz bir izin istemine karar vermez.

Claude Code adapter'ı `extensions` reposundadır ve henüz release edilmedi: ne olduğunu [extension'lar sayfası](/docs/tr/concepts/extensions/) anlatır. Komutları [Agent durumu](/docs/tr/guides/agent-status/), [Agent adapter'ları ve hook'lar](/docs/tr/guides/agent-adapters/) ve [Claude Code adapter'ı](/docs/tr/guides/claude-code/) rehberleri gösterir.

## Holder havuzu

Yeni bir Session 10 ms'den kısa sürede açılmalıdır; başlangıç dosyalarıyla bir shell ise 200 ms ya da daha uzun sürebilir. Bu yüzden daemon birkaç holder'ı hazır bekletir; varsayılan 2'dir. Her **havuzdaki holder**, kullanıcının shell'ini home dizininde önceden başlatmıştır. Shell ile açılan yeni bir Session en eski havuzdaki holder'ı alır ve hiçbir process başlamaz. Ölçülen süreler [Performans hedefleri](/docs/tr/reference/performance/#yeni-session) sayfasında.

- Havuz, bir istemcinin ilk isteğinde başlar. İstek almayan bir daemon havuzda holder çalıştırmaz.
- Yeni Session açılmadan 10 dakika geçerse havuz boşalır. Havuzu `config.toml` içindeki `pool.size` (0 ile 8 arası) ve `pool.idle_time` değiştirir. 0 olursa havuz kapalıdır.
- Havuzdaki holder bir Session değildir. `nomux ls` onu göstermez; state dizini ve journal'ı yoktur. Standart girdisi daemon'dan gelen bir pipe'tır: daemon `kill -9` ile bile sonlansa havuzdaki holder ve shell'i sonlanır. Yeni bir daemon, önceki daemon'un havuzdaki holder'ını almaz.
- Session'ın çalışma dizini home dizini değilse daemon shell'e ` cd '<dizin>'` yazar. Bu satır ekranda ve journal'da görünür.
- Komutlu bir Session her zaman yeni bir holder alır. Kullanıcının shell'i `sh`, `bash`, `zsh`, `dash`, `ksh`, `mksh` ya da `fish` değilse havuz kapalıdır.
- Havuzdaki holder ve shell'i beklerken bellek kullanır: holder musl build'inde yaklaşık 1 MB, shell de kendi belleğini.

[Holder havuzu](/docs/tr/guides/holder-pool/) rehberi havuzu gerçek komutlarla gösterir.

## Ortam değişkenleri

Komutun ortamını holder kurar. Daemon'un ortamıyla başlar ve şu değişkenleri ayarlar:

| Değişken | Değer |
|---|---|
| `TERM` | `xterm-256color` |
| `COLORTERM` | `truecolor` |
| `NOMUX_SESSION_ID` | Session kimliği |
| `NOMUX_SOCK` | Daemon'un socket'i |
| `NOMUX_TOKEN` | Holder'ın her başlayışı için 128 bitlik rastgele bir token. Geri yükleme yeni bir token verir |

- `TERM`, bir istemcinin değil nomux'un terminalidir: bir Session'ın farklı zamanlarda farklı terminalli istemcileri olur.
- Daemon'un locale'i yoksa (`LC_ALL`, `LC_CTYPE` ve `LANG` boşsa) komut UTF-8 karakter kümesi alır. `COLUMNS`, `LINES`, `TERM_PROGRAM` ve `TERM_PROGRAM_VERSION` değişkenleri hiçbir zaman aktarılmaz.
- İstemciden hiçbir şey gelmez. Başka bir locale'e ya da `SSH_AUTH_SOCK`'a sahip bir istemci bunları Session'ına vermez.
- Session'daki bir program, hangi Session'da olduğunu daemon'a üç `NOMUX_` değişkeniyle söyler; örneğin `nomux status set` ve `nomux hook`. Token, isteğin Session'ın bir process'inden geldiğini kanıtlar. Hiçbir dosyada token yoktur. Aynı kullanıcının başka bir process'ine karşı koruma sağlamaz; o da ortamı okuyabilir.

Ayrıntılar [Session ortamı](/docs/tr/guides/session-environment/) rehberinde.

## Session belleği

`nomux ls --memory` her Session'ın process'lerinin belleğini gösterir: komut ve ondan türeyen her process, bu process'lerin sayısı ve ayrı bir değer olarak holder. Ölçü Linux'ta `pss`'tir. macOS'te ve çekirdeğin `pss` vermediği bir process'i olan Session için Linux'ta da `rss`'tir.

- Daemon yalnızca bir istemci isteyince ölçer. Zamanlayıcısı yoktur ve iki istek arasında değer tutmaz; boştaki daemon hiç CPU süresi kullanmaz.
- Process'i olmayan Session'ın değeri yoktur.
- Holder'ın process ağacından çıkmış bir process, örneğin kendini daemon yapan bir program, sayılmaz.
- nomux bu sürümde belleği gösterir, bellek için sınır koymaz.

İki ölçüyü [Session belleği](/docs/tr/guides/session-memory/) rehberi açıklar.

## Uzun home dizini

Bir Unix socket yolu Linux'ta en fazla 107, macOS'te en fazla 103 bayttır. `~/.nomux/run` içindeki en uzun socket yolu 103 bayttan uzunsa (73 bayttan uzun bir home dizini bunu yapar) nomux runtime dizinini `/tmp/nomux-<hash>` sembolik bağlantısı üzerinden açar. Dosyalar `~/.nomux/run` içinde kalır. Bağlantı onlara yalnızca kısa bir yol verir ve `NOMUX_SOCK` bu yolu taşır. `/tmp` temizliği bağlantıyı silerse nomux onu yeniden oluşturur. Kural her Host'ta macOS'in sınırını kullanır; böylece istemci uzak bir Host'un socket'ini yalnızca o Host'un home dizininden bilir.

Ayrıntılar [Uzun home dizinleri](/docs/tr/guides/long-home-paths/) rehberinde.

## Host yeniden başladıktan sonra

Yeniden başlatma, her holder ve her komut dahil, bütün process'leri sonlandırır. State dizini ise yerinde kalır.
Daemon yeniden başladığında state dizinini okur. Tanımına göre komutu çalışırken kalmış ve holder'ı olmayan bir Session **uykudadır**: `nomux ls` onu komutuyla birlikte, process'i olmadan gösterir.

Geri yükleme, uykudaki bir Session'ın komutunu yeniden başlatır: daemon aynı session kimliği, aynı komut, aynı çalışma dizini ve aynı pencere boyutuyla yeni bir holder başlatır. Yeni holder aynı journal'a yazar ve Session bir sonraki epoch'a geçer.
Bunun ne zaman olacağına Session'ın [geri yükleme politikası](/docs/tr/guides/after-a-restart/) karar verir: daemon başlarken, ilk attach'te ya da yalnızca `nomux start` ile.

Yeniden başlatmadan önceki process'ler geri gelmez; yeni komut en baştan başlar. Önceki çıktı journal'da kalır ve attach, yeni ekranın üstünde onun son kısmını gösterir.

Holder `SIGKILL` ile öldürüldüğünde ya da çöktüğünde de aynısı olur: Session uykuya geçer. Bunu gerçek komutlarla [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfası gösterir.

### Session ne zaman sonlanır

- Komutu biter ya da siz `nomux kill` ile sonlandırırsınız. Daemon biten Session'ı, çıkış durumunu ve journal'ını saklama süresi boyunca (varsayılan 24 saat) tutar. `nomux ls --all` onu gösterir. Son Agent çalışmasını da tutar: [saklanan çalışma](#nomux-bir-agent-hakkında-ne-bilir).
- Uykudaki bir Session'ı `nomux kill` ile silersiniz. Journal'ı da silinir.
- Bir servis yöneticisi daemon'un bütün process'lerini birlikte durdurur. `nomux daemon install-service`'in yazdığı servis dosyasında `KillMode=process` vardır; o unit durdurulunca yalnızca daemon durur. systemd'nin varsayılanı olan `KillMode=control-group` ile unit durdurulduğunda holder'lar da ölür ve Session'lar uykuya geçer.

## Ne nerede tutulur

| Veri | Nerede | Ömrü |
|---|---|---|
| PTY ve komut | Holder process'i | Komut ya da holder bitene kadar |
| O anki ekran ve çıktının son 256 KiB'ı | Holder'ın belleği | Holder sonlanana kadar |
| Programların raporları: en fazla 64 program durumu kaydı, son prompt işareti ve son 16 bildirim | Holder'ın belleği | Holder sonlanana kadar |
| Session listesi | Daemon'un belleği | Yeni daemon listeyi runtime dizininden ve state dizininden yeniden kurar |
| Her Session'ın agent durumu, saklanan çalışmalar (en fazla 64) ve olaylar (en fazla 1024) | Daemon'un belleği | Daemon sonlanana kadar. Yeni daemon program raporlarını holder'lardan yeniden okur, olaysız başlar |
| `nomuxd.sock`, `nomuxd.lock`, `nomuxd.log` | `~/.nomux/run/` | Daemon'un socket'i, kilidi ve log'u. Sorun yoksa log boş kalır |
| `pid`, `sock`, `ready` | `~/.nomux/run/<session kimliği>/` | Tek bir holder'ın dosyaları. Holder sonlanınca bunları siler |
| `pid`, `sock`, `ready` | `~/.nomux/run/<session kimliği>.pool/` | Havuzdaki bir holder'ın dosyaları. Bir Session holder'ı alınca dizinin adı düz session kimliği olur |
| Soket bağlantısı | `/tmp/nomux-<hash>` | Yalnızca uzun bir home dizininde. Kaybolursa nomux yeniden oluşturur |
| `session`, `restore-policy`, `journal/` | Linux'ta `~/.local/state/nomux/sessions/<session kimliği>/`, macOS'te `~/Library/Application Support/nomux/sessions/<session kimliği>/` | Bir Session'ın tanımı, geri yükleme politikası ve journal'ı. Yeniden başlatmadan sonra da kalırlar; uykudaki Session'a `nomux kill` yapılana ya da biten Session'ın saklama süresi dolana kadar |
| Kurulu extension'lar | Linux'ta `~/.local/share/nomux/extensions/`, macOS'te `~/Library/Application Support/nomux/extensions/` | `nomux ext rm`'e kadar |
| Bir aracın kurulu hook'larının kaydı | Linux'ta `~/.local/share/nomux/hooks/<araç>/`, macOS'te `~/Library/Application Support/nomux/hooks/<araç>/` | Kaydı `nomux hooks install <araç> --apply` yazar. Yeniden başlatmadan sonra da kalır; `nomux hooks uninstall <araç>` onu okur |
| Uzak Host'lar, yeni Session'ların geri yükleme politikası, saklama süresi, holder havuzunun anahtarları | Linux'ta `~/.config/nomux/config.toml`, macOS'te `~/Library/Application Support/nomux/config.toml` | Dosyayı siz değiştirene kadar. Dosyayı `nomux host add` yazar |

Aşağıda, geri yüklenmiş bir Session'ın state dizini var. Çalıştırmada önce bütün nomux process'leri, yeniden başlatmanın yaptığı gibi `kill -9` ile durduruldu, ardından `nomux start pieithls` çalıştırıldı:

```console
$ ls -A .local/state/nomux/sessions/pieithls
journal
session
$ ls -A .local/state/nomux/sessions/pieithls/journal
00000001-0000000000000000.journal
00000002-0000000000000000.journal
$ cat .local/state/nomux/sessions/pieithls/session
nomux-session 1
epoch 2
started 1795690824
rows 24
columns 80
restore on-focus
profile
directory /tmp/nomux-demo/project
command sh
argument -c
argument echo first run; exec sleep 600
status running
```

Her journal dosyası bir segment'tir. Dosya adında epoch ve segment'in ilk byte'ının konumu yazar. İki dosya, komutun ilk çalışmasının ve geri yüklemeden sonraki çalışmasının çıktısıdır.
`session` dosyasındaki `restore` satırı geri yükleme politikası değildir; daemon politikayı `restore-policy` dosyasında tutar. Bu Session'da o dosya yok, dolayısıyla varsayılan politika geçerli.

Dizinlerin modu 0700, dosyaların ve socket'lerin modu 0600'dür. Daemon ve holder'lar ayrıca başka bir kullanıcıdan gelen bağlantıyı kapatır. nomux'ta veritabanı yoktur.

## Bu sürümün sınırları

- Attach, Session'ın o anki ekranını ve o andan sonraki çıktıyı gösterir; ekrandan çıkmış satırları göstermez. Onları `nomux capture` escape sequence'leriyle birlikte yazdırır.
- Uykudaki bir Session'ı yeniden başlatan attach, eski çıktının en fazla 1 MiB'ını gösterir.
- Detach tuşları değiştirilemez.
- Session'ın komutu daemon'un ortam değişkenlerini, yani daemon'u başlatan shell'inkileri alır; [Ortam değişkenleri](#ortam-değişkenleri) bölümündeki değişikliklerle birlikte. Geri yükleme de komuta daemon'un o anki ortamını verir. Bir istemci attach olana kadar terminal 24 satır, 80 sütundur.
- Hiçbir adapter'ın release'i henüz yok. OSC 7501 göndermeyen bir aracın kaynakları yalnızca öz bildirim ve iki tahmindir.
- Journal'ın boyut sınırı her Session için sabit 32 MiB'tır.

Sırada ne olduğunun tek adresi [yol haritasıdır](/docs/tr/project/roadmap/).
Bu process modelinin gerekçeleri [ADR-0001](https://github.com/nomux-sh/docs/blob/main/adr/0001-session-holder-model.md)'de, disk ve bellek bütçeleri [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md)'da yazar (İngilizce).
Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
