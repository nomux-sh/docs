---
title: Session'ın ortamı
description: Bir Session'ın komutunun hangi ortam değişkenlerini aldığı, nomux'un hangilerini ayarlayıp kaldırdığı, terminalinizin ortamının neden geçmediği ve bir Session'a nasıl dil verileceği.
---

Bir Session'ın komutu daemon'un ortamını alır; nomux buna birkaç değişiklik yapar. Bu değişiklikleri holder yapar.
Bir servis yöneticisi daemon'u başlattığında bu önemlidir: launchd bir job'a `PATH=/usr/bin:/bin:/usr/sbin:/sbin` verir, `TERM` ve `LANG` vermez; bir systemd kullanıcı servisinde de `TERM` yoktur.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'taki gerçek çıktısıdır. Çalıştırmaların home dizini `/home/user` olarak gösterilir.

## Komut neleri alır

| Nereden | Değişkenler |
|---|---|
| Daemon | Daemon'un ortamındaki her değişken; sonraki satırlardakiler hariç. |
| nomux, her zaman | `TERM=xterm-256color`, `COLORTERM=truecolor`, `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN`. Daemon'dan gelen bir değerin yerine geçer. |
| nomux, daemon'un locale'i yoksa | Linux'ta `LC_CTYPE=C.UTF-8`, macOS'ta `LC_CTYPE=UTF-8`: UTF-8 bir karakter kümesi. Yalnızca `LC_ALL`, `LC_CTYPE` ve `LANG` değersizse. |
| Hiç geçmez | `COLUMNS`, `LINES`, `TERM_PROGRAM` ve `TERM_PROGRAM_VERSION`. Bunlar daemon'u başlatan programın terminalini anlatır. |

nomux'un üç değişkeni:

| Değişken | Değer |
|---|---|
| `NOMUX_SESSION_ID` | Session kimliği. |
| `NOMUX_SOCK` | Daemon'un socket'i. |
| `NOMUX_TOKEN` | 128 bitlik rastgele bir token; holder her başladığında yenisi üretilir. |

Session'daki bir program bunları hangi Session'da olduğunu söylemek için kullanır; örneğin `nomux status set` ([Agent durumu](/docs/tr/guides/agent-status/#kendi-programınızdan-durum-bildirmek)) ve `nomux hook` ([Agent adapter'ları ve hook'lar](/docs/tr/guides/agent-adapters/)).
Token, bir isteğin Session'ın bir process'inden geldiğini kanıtlar. Session'ın process'leri onu miras alır. Session dışındaki aynı kullanıcının bir process'i, Session'ın bir process'inin ortamını okuyabilir; bu yüzden token ona karşı bir savunma değildir. nomux'un hiçbir log'unda, journal'ında ve dosyasında token yoktur. Geri yükleme Session'a yeni bir token verir.

## Bir örnek

Burada daemon, bir servis yöneticisinin vereceği gibi küçük bir ortamla başladı: `TERM=screen`, `COLUMNS=120`, `LINES=40` ve `TERM_PROGRAM=demo`; locale yok. `small` shell değişkeni bu ortamı tutar. Session'ın komutu kendi ortamını yazdırdı. Token'ın değeri komutta `<hidden>` ile değiştirildi.

```console
$ small="env -i HOME=$HOME PATH=$HOME/.local/bin:/usr/bin:/bin TERM=screen COLUMNS=120 LINES=40 TERM_PROGRAM=demo"
$ cd ~/project
$ $small nomux ls
no sessions
$ $small nomux new --cmd sh -c 'env | sort | sed "s/^NOMUX_TOKEN=.*/NOMUX_TOKEN=<hidden>/"; sleep 3600'
d4r34zip
$ nomux capture d4r34zip
COLORTERM=truecolor
HOME=/home/user
LC_CTYPE=C.UTF-8
NOMUX_SESSION_ID=d4r34zip
NOMUX_SOCK=/home/user/.nomux/run/nomuxd.sock
NOMUX_TOKEN=<hidden>
PATH=/home/user/.local/bin:/usr/bin:/bin
PWD=/home/user/project
SHLVL=1
TERM=xterm-256color
_=/usr/bin/env
```

- Daemon'un `TERM=screen` değeri `xterm-256color` oldu.
- `COLUMNS`, `LINES` ve `TERM_PROGRAM` yok.
- Daemon'un locale'i yoktu; bu yüzden Session `LC_CTYPE=C.UTF-8` aldı.

Locale'i olan bir daemon onu korur. Burada daemon `LANG=tr_TR.UTF-8` ve aynı küçük ortamla başladı:

```console
$ $small nomux new --cmd sh -c 'env | sort | grep -E "^(LANG|LC_|TERM|COLORTERM)"; sleep 3600'
gak3ck3g
$ nomux capture gak3ck3g
COLORTERM=truecolor
LANG=tr_TR.UTF-8
TERM=xterm-256color
```

Bu durumda nomux `LC_CTYPE` eklemez. (O çalıştırmada `small` değişkeni `env -i HOME=$HOME PATH=$HOME/.local/bin:/usr/bin:/bin LANG=tr_TR.UTF-8` idi ve daemon yeniydi.)

## `TERM` neden istemcinizin terminali değil

Bir Session'ın terminali, xterm'i izleyen nomux terminalidir. Bir Session'a farklı zamanlarda farklı terminallere sahip istemciler bağlanır. Bu yüzden `TERM` her zaman `xterm-256color`, `COLORTERM` her zaman `truecolor`'dır.

## İstemciden ne geçmez

`nomux new` komutunu çalıştıran terminalin ortamı Session'a gitmez. Kontrol protokolünde bunun için bir alan yoktur. Daemon sizin terminalinizden başladıysa o andaki terminalinizin ortamına sahiptir ve Session onu alır. Farklı bir ortamı olan sonraki istemci bunu değiştirmez.

Bu yüzden farklı bir locale'i olan ya da `SSH_AUTH_SOCK` veya `DISPLAY` gibi değişkenleri taşıyan bir istemci bunları Session'ına veremez. Bu eksiklik için [#75](https://github.com/nomux-sh/nomux/issues/75) numaralı issue açık.

## Session'lara dil vermek

Bir servis yöneticisinin daemon'unun locale'i olmayabilir. O zaman C kütüphanesi `C` locale'ini kullanır; bunda ASCII dışı karakter yoktur. nomux'un fallback'i UTF-8 bir karakter kümesi verir. Dil, tarih biçimi ya da sayı biçimi vermez.

Her Session'a bir dil vermek için servise `LANG` verin:

- Linux: `nomux daemon install-service` komutunun yazdığı unit'teki (`~/.config/systemd/user/nomuxd.service`) `Environment=`, örneğin `Environment=LANG=en_US.UTF-8`.
- macOS: launchd agent'ındaki (`~/Library/LaunchAgents/sh.nomux.nomuxd.plist`) `EnvironmentVariables`.

Linux ve macOS satırları nomux dokümanlarından geliyor. Bu sayfa için çalıştırılmadı.

## Geri yükleme ve havuz

- Geri yükleme komutu, geri yükleme anındaki daemon'un ortamıyla, aynı kurallarla yeniden başlatır.
- [Holder havuzundan](/docs/tr/guides/holder-pool/) gelen bir shell aynı ortamı alır, çünkü hiçbir parça istemciden gelmez. Havuzdaki shell ilk prompt'tan önce Session'ın dizinine geçer; bu yüzden `PWD` Session'ın dizinidir. Nasıl olduğunu [Holder havuzu](/docs/tr/guides/holder-pool/#havuzdaki-shell-dizinini-nasıl-alır) sayfası anlatır.
- Uzak bir Host'taki Session, o Host'taki daemon'un ortamını alır.
