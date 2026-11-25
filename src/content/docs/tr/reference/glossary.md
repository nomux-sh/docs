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
- Beş terim iki dilde de aynıdır: Host, Worktree, Session, Pane ve Tab.
- Koddaki adlar İngilizce terimden türetilir. Örnek: `sessions`, `agent_runs` ve `child_work` veritabanı tabloları ile `NOMUX_SURFACE_ID` ortam değişkeni.
