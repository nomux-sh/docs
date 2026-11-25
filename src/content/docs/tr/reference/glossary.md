---
title: Sözlük
description: Her nomux kavramının tek adı. Bu sayfa kod, CLI ve arayüz için adlandırma otoritesidir.
---

Bu sayfa nomux'un adlandırma otoritesidir.
Her kavramın tek bir adı vardır. Kod, CLI, arayüz ve dokümantasyon o adı kullanır, başka bir ad kullanmaz.

Kod, komut, arayüz etiketi, sayfa ya da karar kaydı yazarken bu tablodaki terimi kullanın.
Yeni bir kavram gerekiyorsa önce bu tabloya, İngilizce ve Türkçe olarak ekleyin.

## Terimler

| Türkçe terim | İngilizce terim | Tanım |
|---|---|---|
| Host | Host | `nomuxd` çalışan bir makine. Host ya local'dir ya da ona SSH veya doğrudan bağlantı ile ulaşılır. |
| Proje | Project | Bir Host'taki bir repo. Projenin bir klasörü, varsayılan bir agent'ı ve bir rengi vardır. |
| Worktree | Worktree | Projenin bir git worktree'si. Bir Görev genelde kendi Worktree'sinde çalışır. |
| Session | Session | Bir holder process'inin tuttuğu tek bir PTY. Shell de, agent da, geliştirme sunucusu da birer Session'dır. |
| Agent çalışması | Agent run | Bir Session'da çalışan bir agent. Aracı, modeli, durumu ve sağlayıcının verdiği session kimliği vardır. Agent bu kimlik sayesinde kaldığı yerden devam eder. |
| Alt iş | Child work | Bir Agent çalışmasının subagent'ı, takım arkadaşı ya da arka plan görevi. Alt işin de Alt işi olabilir. Derinlik sınırı 8'dir. |
| Takım | Team | Bir lider ve üyelerden oluşan Session grubu. Takım tek bir Tab'da yaşar. Üyeler farklı araçlar olabilir. |
| Görev | Task | Kullanıcının ya da bir agent'ın açtığı iş birimi. Görevin bir başlığı, bir Worktree'si ve atandığı bir Session ya da Takım vardır. |
| Pane | Pane | Pane ağacındaki bir yaprak. Pane bir Tab yığını taşır. |
| Tab | Tab | Pane'deki tek bir içerik. Tab'ın türü, içerik türleri registry'sinden gelir. |
| Yüzey kimliği | Surface ID | Bir Tab'ın kimliği. Tab yaşadığı sürece değişmez. Session bu kimliği bir ortam değişkeniyle alır. |

## Kavramlar birbirine nasıl bağlanır

```text
Host → Proje → Worktree → Session (holder) → Agent çalışması → Alt iş* (subagent | takım arkadaşı | arka plan görevi)
                        ↘ Takım (lider Session + üye Session'lar)
```

Durumun sahibi `nomuxd`'dir; durumu kendi veritabanına yazar.
Her holder, kendi Session'ının durumunun en küçük kopyasını tutar.
Daemon durursa durum kaybolmaz. Daemon yeniden bağlandığında durumu holder'dan okur.

Görünüm durumu tek bir istemciye aittir ve paylaşılan Session durumunun parçası değildir.
Açık olan Tab, Pane oranları ve sidebar genişliği görünüm durumuna örnektir.
Bu sayede desktop ve mobil istemci aynı Session'a farklı görünümlerle bağlanabilir.

## Terim kuralları

- Terimi olduğu gibi kullanın. Eş anlamlı bir sözcük kullanmayın; örneğin Proje yerine "çalışma alanı", Pane yerine "pencere" demeyin.
- Türkçe metinde Türkçe terimi, İngilizce metinde İngilizce terimi yazın.
- Beş terim iki dilde de aynıdır: Host, Worktree, Session, Pane ve Tab.
- Koddaki adlar İngilizce terimi izler. Örnek: `sessions`, `agent_runs` ve `child_work` veritabanı tabloları ile `NOMUX_SURFACE_ID` ortam değişkeni.
