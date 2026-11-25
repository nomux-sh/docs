---
title: Nasıl çalışır
description: Üç nomux process'i, attach sırasında olanlar, daemon durduğunda Session'ın neden yaşadığı ve neyin nerede tutulduğu.
---

nomux bir Host'ta üç tür process çalıştırır: istemci, daemon ve holder.
Bu sayfa bugün var olanı anlatır. Tasarımın tamamı için [kavramlara genel bakış](/docs/tr/concepts/overview/) sayfasına bakın.

## Üç process

<figure>
<svg viewBox="0 0 540 452" role="img" aria-labelledby="processes-title processes-description" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 540px; height: auto;" fill="none" stroke="currentColor" stroke-width="1.5" font-size="14">
<title id="processes-title">Üç nomux process'i</title>
<desc id="processes-description">İstemci daemon'a bir Unix socket üzerinden bağlanır. Daemon her Session'ın holder'ına bir kontrol socket'i üzerinden bağlanır, Session'ın terminal çıktısını da holder'ın paylaşılan belleğinden okur. Komutun PTY'si holder'dadır. Daemon durduğunda holder ve komut çalışmaya devam eder.</desc>
<rect x="20" y="12" width="320" height="60" rx="6"/>
<rect x="20" y="126" width="320" height="60" rx="6"/>
<rect x="8" y="232" width="344" height="208" rx="10" stroke-dasharray="6 5"/>
<rect x="20" y="246" width="320" height="60" rx="6"/>
<rect x="20" y="366" width="320" height="60" rx="6"/>
<path d="M180 72 V124 M174 116 L180 124 L186 116"/>
<path d="M180 186 V244 M174 236 L180 244 L186 236"/>
<path d="M180 306 V364 M174 356 L180 364 L186 356 M174 314 L180 306 L186 314"/>
<g stroke="none" fill="currentColor">
<text x="34" y="37" font-weight="600">istemci: nomux (CLI)</text>
<text x="34" y="58" font-size="12.5">tek komut çalıştırır ya da attach kalır</text>
<text x="194" y="95" font-size="12.5">Unix socket</text>
<text x="194" y="112" font-size="12" font-family="monospace">~/.nomux/run/nomuxd.sock</text>
<text x="34" y="151" font-weight="600">daemon: nomuxd</text>
<text x="34" y="172" font-size="12.5">kullanıcı başına bir tane, holder'ları başlatır</text>
<text x="194" y="209" font-size="12.5">kontrol socket'i</text>
<text x="194" y="226" font-size="12" font-family="monospace">~/.nomux/run/&lt;id&gt;/sock</text>
<text x="372" y="209" font-size="12.5">terminal çıktısı:</text>
<text x="372" y="226" font-size="12.5">paylaşılan bellek</text>
<text x="34" y="271" font-weight="600">holder: nomux-holder</text>
<text x="34" y="292" font-size="12.5">Session başına bir tane: PTY onundur</text>
<text x="194" y="341" font-size="12.5">PTY</text>
<text x="34" y="391" font-weight="600">Session'ın komutu</text>
<text x="34" y="412" font-size="12.5">shell, agent, sunucu</text>
<text x="366" y="332" font-size="12.5">daemon durunca</text>
<text x="366" y="349" font-size="12.5">çalışmaya devam eder</text>
</g>
</svg>
<figcaption>Oklar, bağlanan process'ten cevap veren process'e doğrudur. PTY iki yönde de veri taşır. Attach sırasında tuşları Session'a, terminal çıktısını da istemciye daemon'un Unix socket'i taşır.</figcaption>
</figure>

**İstemci**, sizin kullandığınız programdır. Bugün tek istemci CLI'dır: `nomux`.
Komut satırını okur, daemon'a bağlanır, isteğini gönderir, sonucu yazdırır ve çıkar.
Attach'te ise bağlı kalır; klavyenizi ve ekranınızı Session'a verir.
Çalışan bir daemon yoksa CLI onu kendisi başlatır.

**Daemon**, `nomuxd`'dir. Her kullanıcı için bir daemon çalışır.
Her yeni Session için bir holder başlatır, Session listesini tutar ve istemcilere cevap verir.
Attach olmuş istemci ile holder arasında tuşları ve terminal çıktısını taşır.
Hiçbir terminalin sahibi değildir.

**Holder**, `nomux-holder`'dır. Her Session için bir holder çalışır.
PTY'yi açar, Session'ın komutunu başlatır ve komutun çıktısını okur; bağlı bir istemci ya da daemon olmasa bile.
Session'ın o anki ekranını bellekte tutar: görünen hücreleri renkleriyle, imleci ve terminal modlarını.
Programların çıktıya yazdığı raporları da okur: program durumu (OSC 7501 terminal dizisi), shell'in prompt işaretleri (OSC 133) ve bildirimler (OSC 9 ve OSC 777). Bu sürümde bunları gösteren bir komut yoktur.
Holder tek thread'li küçük bir process'tir. Komut bir şey yazmadığı sürece hiç iş yapmaz.

İstemci yalnızca daemon'la konuşur. Holder'la ise yalnızca daemon konuşur.

## Attach sırasında ne olur

`nomux attach` ve `nomux new --attach`, terminalinizi bir Session'ın terminaline bağlar. [Hızlı başlangıç](/docs/tr/guides/quick-start/#yeniden-attach-olmak) bunu gerçek komutlarla gösterir.

1. **Pencere boyutu.** CLI terminalinizin boyutunu gönderir, Session o boyutu alır.
2. **Ekran.** Daemon holder'dan o anki ekranı ister. Holder, bu ekranı boş bir terminale çizen bir byte dizisi verir. CLI terminalinizi temizler ve bu diziyi yazar. Böylece Session'ı şu anki hâliyle görürsünüz; programlar ekranı saatler önce çizmiş olsa bile.
3. **Çıktı akışı.** Ekrandan sonra istemci, komutun yazdığı her byte'ı sırasıyla alır. Ekran ile akış birbirine tam oturur: arada eksik byte da olmaz, iki kez gelen byte da.
4. **Tuşlar.** Bastığınız her tuş CLI'dan daemon'a, oradan holder'a ve PTY'ye gider.

Holder istemcileri tanımaz ve hiçbirini beklemez. Çıktının son 256 KiB'ını tutar; daemon da her istemci için 64 KiB'lık tek bir buffer kullanır.
**Yavaş kalan istemci taze bir ekran alır.** İstemci çıktıyı komutun yazdığından yavaş alıyorsa ve sıradaki çıktı artık holder'ın belleğinde değilse, daemon o anki ekranı yeniden gönderir ve oradan devam eder. O istemci aradaki byte'ları değil, en güncel ekranı görür.
Bu sayede çıktı seli daemon'un belleğini büyütmez, komutu da yavaşlatmaz. Yavaş bir istemci, aynı Session'daki başka bir istemciyi etkilemez.

Aynı Session'a birden fazla istemci attach olabilir. Hepsi aynı çıktıyı alır, hepsinden yazılabilir. Session'ın tek bir pencere boyutu vardır: en son attach olan ya da boyutu en son değişen istemcininki.

Detach yalnızca istemcinin bağlantısını kapatır. Session'ın komutu sinyal almaz, bir değişiklik görmez.
Attach daemon üzerinden geçer. Daemon durursa attach hatayla biter, Session ise yaşar: yeniden attach olduğunuzda yeni daemon ekranı holder'dan alır.

Attach ekranı gösterir; ekrandan çıkmış satırları göstermez. Bu sürümde scrollback yoktur.

## Daemon durduğunda Session neden yaşar

Session'ın komutu daemon'un değil, holder'ın child process'idir. Komutun terminali de holder'a aittir.
Dolayısıyla daemon'un sonlanması hiçbir terminali kapatmaz, hiçbir komutu durdurmaz.

Holder, kendisini başlatan process'ten de bağımsızdır:

- Kendi process session'ı ve kendi process group'u vardır. Daemon'a ya da daemon'un grubuna gönderilen sinyal holder'a ulaşmaz.
- Daemon'la arasında pipe yoktur. Daemon gidince hata almaz.
- Runtime dizinine üç dosya yazar. Yeni bir daemon bu dosyaları okuyarak holder'ı bulur ve ona bağlanır.

Daemon başlarken runtime dizinini tarar. Çalışan her holder'a bağlanır, ölmüş holder'ların dizinlerini siler.
`nomux daemon stop`'tan, daemon'a atılan `kill -9`'dan ya da bir daemon çökmesinden sonra `nomux ls`'in aynı Session'ları göstermesi bundandır.
[Hızlı başlangıç](/docs/tr/guides/quick-start/#daemonu-durdurmak-session-yaşar) bunu gerçek komutlarla gösterir.

Bir runtime dizini için yalnızca tek bir daemon çalışabilir. İkinci daemon hata verip çıkar ve hiçbir şeye dokunmaz.

### Session ne zaman sonlanır

- Komutu biter ya da siz `nomux kill` ile sonlandırırsınız.
- Holder'ı öldürülür.
- Host yeniden başlar. Holder da bir process'tir; yeniden başlatma bütün process'leri sonlandırır. Yeniden başlatma sonrası geri yükleme henüz yok.
- Bir servis yöneticisi daemon'un bütün process'lerini birlikte durdurur. `nomuxd`'yi systemd unit'i olarak çalıştırıyorsanız `KillMode=process` ayarlayın. Varsayılan `KillMode=control-group` ile unit durdurulduğunda holder'lar da ölür. nomux henüz bir unit dosyasıyla gelmiyor.

## Ne nerede tutulur

| Veri | Nerede | Ömrü |
|---|---|---|
| PTY ve komut | Holder process'i | Komut bitene kadar |
| O anki ekran ve çıktının son 256 KiB'ı | Holder'ın belleği | Holder sonlanana kadar |
| Programların raporları: en fazla 64 program durumu kaydı, son prompt işareti ve son 16 bildirim | Holder'ın belleği | Holder sonlanana kadar |
| Session listesi | Daemon'un belleği | Yeni daemon listeyi runtime dizininden yeniden kurar |
| `nomuxd.sock`, `nomuxd.lock` | `~/.nomux/run/` | Daemon'un socket'i ve kilidi |
| `nomuxd.log` | `~/.nomux/run/` | CLI'ın başlattığı daemon'un log'u. Sorun yoksa boş kalır |
| `pid`, `sock`, `ready` | `~/.nomux/run/<session kimliği>/` | Tek bir holder'ın dosyaları. Session sonlanınca holder bunları siler |

Diskte başka hiçbir şey yoktur: veritabanı yok, diskte scrollback yok, ayar dosyası yok.
Komutun çıkış durumu da saklanmaz; komut bitince Session listeden düşer. Çıkış durumunu yalnızca o anda attach olmuş istemciler alır.

Runtime dizininin modu 0700, socket'lerin modu 0600'dür. Daemon ve holder'lar ayrıca başka bir kullanıcıdan gelen bağlantıyı kapatır.

## Bu sürümün sınırları

- Scrollback yoktur. Attach, Session'ın o anki ekranını ve o andan sonraki çıktıyı gösterir.
- Detach tuşları değiştirilemez.
- Session'ın komutu daemon'un ortam değişkenlerini, yani daemon'u başlatan shell'inkileri alır. Bir istemci attach olana kadar terminali 24 satır, 80 sütundur.
- Daemon yalnızca local makineye hizmet verir. Uzak bağlantı yoktur.

Sırada ne olduğunun tek adresi [yol haritasıdır](/docs/tr/project/roadmap/).
Bu process modelinin gerekçeleri [ADR-0001](https://github.com/nomux-sh/docs/blob/main/adr/0001-session-holder-model.md)'de yazar (İngilizce).
Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
