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

## Attach ve extension'lar

Bu terimler de küçük harfle yazılır.

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| attach | attach | Bir istemcinin terminalini bir Session'ın terminaline bağlamak: istemci Session'ın ekranını gösterir ve tuşlarını ona gönderir. Bu bağlantının kendisine de attach denir. Aynı Session'a birden fazla istemci attach olabilir. CLI komutu `nomux attach`'tir. |
| detach | detach | Bir attach'i bitirmek. Session yaşamaya devam eder. CLI komutu `nomux detach`'tir. |
| extension | extension | nomux'a bir özellik ekleyen paket. Bir manifest'i (`extension.toml`) ve bir ya da daha fazla parçası vardır. |
| daemon parçası | daemon part | Extension'ın Host'ta ayrı bir process olarak çalışan parçası. Onu `nomuxd` başlatır. |
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
- On terim iki dilde de aynıdır: Host, Worktree, Session, Pane, Tab, holder, daemon, attach, detach ve extension.
- Koddaki adlar İngilizce terimden türetilir. Örnek: `sessions`, `agent_runs` ve `child_work` veritabanı tabloları ile `NOMUX_SURFACE_ID` ortam değişkeni.
