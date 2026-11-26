---
title: tmux ve screen'den gelenler için
description: En çok yazılan tmux ve GNU screen komutlarını nomux'un komutlarına ve tuşlarına eşleyen iki kopya kâğıdı ve bilerek yapılmış farklar.
---

Bu sayfa tmux ve GNU screen komutlarını `nomux` komutlarına eşler. Her tablonun sağ sütunu nomux komutudur. Her komutun seçeneklerini, çıktısını ve çıkış kodlarını [CLI başvurusunda](/docs/tr/reference/cli/) bulursunuz.

İki tablodaki her nomux komutu, `--host` satırı dışında, nomux 0.5.0 ile Linux'ta çalıştırıldı. O satır uzak bir Host gerektirir; onun için `nomux --help` ile yetinildi. tmux ve screen komutları kendi kılavuzlarından alındı; bu sayfa onları çalıştırmadı.

Bir Session'ın kimliği vardır ve adı olabilir. Session alan her komut bir hedef alır: kimlik, ad ya da ikisinden birinin başı. Yani `nomux attach api` ve `nomux attach k3xq` ikisi de çalışır. Kurallar [Session'lar](/docs/tr/guides/sessions/) sayfasında.

## tmux'tan

| tmux'ta yazdığınız | nomux'ta |
|---|---|
| `tmux new -s api` | `nomux new -n api -a` |
| `tmux new -d -s api 'cmd'` | `nomux new -n api -- cmd`. `new`, `-a` ya da `-A` olmadan attach olmaz |
| `tmux new -A -s api` | `nomux new -A -n api` |
| `tmux attach -t api` | `nomux attach api` ya da `nomux a api`. `-t api` de çalışır |
| `tmux attach` | `nomux attach`, ya da terminalde yalın `nomux`: bir istemcinin en son attach olduğu Session |
| `tmux attach -d -t api` | `nomux attach -d api` |
| `tmux attach -r -t api` | `nomux attach -r api` |
| `tmux ls` | `nomux ls` |
| `tmux ls -F '#{session_name}'` | `nomux ls --json \| jq -r '.sessions[].name // empty'` |
| `tmux rename -t api web` | `nomux rename api web` |
| `tmux kill-session -t api` | `nomux kill api` |
| `tmux kill-server` | `nomux kill --all` Session'ları sonlandırır; terminalde önce sorar. `nomux daemon stop` daemon'u durdurur, Session'lar yaşamaya devam eder |
| `tmux detach -s api` | `nomux detach api` |
| `tmux send-keys -t api 'ls' Enter` | `nomux send api 'ls'` |
| `tmux send-keys -l -t api 'x'` | `nomux send --no-enter api 'x'` |
| `tmux send-keys -t api C-c` | `nomux send -k api C-c` |
| `tmux pipe-pane -O 'cat >> f'` | `nomux capture -f api >> f` |
| `tmux capture-pane -p -S - -E - -t api` | `nomux capture --lines 100000 api`. Çıktı, komutun yazdığı gibidir; escape sequence'leri de içerir |
| `ssh host tmux attach -t api` | `nomux --host host attach api` |
| `C-b d` | `Ctrl-a d`. `Ctrl-\ d` de çalışır |
| `C-b C-b` (`C-b` gönder) | `Ctrl-a Ctrl-a`, `Ctrl-a` gönderir |
| `set -g prefix C-b` | `nomux attach --prefix C-b`, `NOMUX_PREFIX=C-b` ya da `config.toml` dosyasında `[attach]` tablosunda `prefix = ["C-b"]` |

Satırlara notlar:

- `tmux ls -F '#{session_name}'` yalnızca adları listeler. nomux'ta adı olmayan Session'da `"name":null` bulunur ve `jq -r` onun için `null` yazar. `// empty` onu atlar.
- `capture --lines 100000`, Session'ın journal'ındaki bütün satırları yazdırır. Journal, bir Session için en çok 32 MiB çıktı tutar.
- `Ctrl-a` ve `Ctrl-\` varsayılan prefix tuşlarıdır; ikisi aynı anda çalışır. Nasıl değiştirileceğini [Session'lar](/docs/tr/guides/sessions/#prefix-tuşları) sayfası gösterir.
- tmux alışkanlığı için `attach-session`, `new-session`, `list-sessions`, `kill-session` ve `rename-session` takma ad olarak çalışır. Yardım metni bunları göstermez; seçenekleri tmux'un değil, nomux'un seçenekleridir.

Bilerek farklı olanlar:

- nomux CLI'ında pencere, pane ya da tuş bağlaması yoktur: bir Session tek bir terminaldir. Pane ve Tab düzeni masaüstü istemcisinin işidir. O geliştirme aşamasında; nomux 0.5.0'da masaüstü istemcisi yok: [yol haritasına](/docs/tr/project/roadmap/) bakın.
- `tmux new`'deki `-d` "ayrık başlat" demektir. `nomux new`, `-a` ya da `-A` olmadan hiç attach olmaz; `nomux attach`'teki `-d` ise `tmux attach -d` gibi "diğerlerini detach et" demektir.
- `nomux kill`'in `-a` seçeneği yoktur. `tmux kill-session -a` diğer her Session'ı sonlandırır; `nomux kill --all` kullandığınız Session dahil her Session'ı sonlandırır.
- Ad, tmux'taki gibi Host'ta benzersizdir. Tam ad, aynı harflerle başlayan daha uzun bir adın önüne geçer; birden fazla Session'ın paylaştığı bir baş ise adaylar listelenerek reddedilir.
- Host yeniden başlayınca Session'lar uykuda (dormant) olarak yaşamaya devam eder. `nomux ls` onları gösterir; `attach` ya da `start` yeniden başlatır: [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/).

## screen'den

| screen'de yazdığınız | nomux'ta |
|---|---|
| `screen -S api` | `nomux new -n api -a` |
| `screen -dmS api cmd` | `nomux new -n api -- cmd` |
| `screen -ls` | `nomux ls` |
| `screen -r api` | `nomux attach api`. `nomux attach`'teki `-r` salt okunur demektir |
| `screen -r` | `nomux attach`, ya da terminalde yalın `nomux` |
| `screen -d -r api` | `nomux attach -d api` |
| `screen -x api` | `nomux attach api`. Bir Session'a birden fazla terminal attach olabilir |
| `screen -dRR api` | `nomux new -A -n api` |
| `screen -d api` | `nomux detach api` |
| `screen -S api -X sessionname web` | `nomux rename api web` |
| `screen -S api -X quit` | `nomux kill api` |
| `screen -S api -X stuff 'ls\r'` | `nomux send api 'ls'` |
| `screen -S api -X stuff $'\003'` | `nomux send -k api C-c` |
| `screen -L -Logfile f` | `nomux capture -f api >> f`. Daemon çıktıyı zaten saklar |
| `screen -S api -X hardcopy -h f` | `nomux capture --lines 100000 api > f` |
| `screen -wipe` | Gerekmez. Daemon biten Session'ı 24 saat sonra siler (`sessions.ended_retention`); `nomux kill` uykudaki Session'ı siler |
| `C-a d` | `Ctrl-a d`. `Ctrl-\ d` de çalışır |
| `C-a a` (`C-a` gönder) | `Ctrl-a a` ya da `Ctrl-a Ctrl-a` |

Satırlara notlar:

- `screen -dRR api`, `api` Session'ına attach olur; yoksa onu açar. `nomux new -A -n api` aynısını yapar. Session varsa nomux onun komutunu ve dizinini korur.
- `sessions.ended_retention`, `config.toml` dosyasının `[sessions]` tablosunda biten Session'ın saklama süresini belirler. Varsayılan `24h`'dir. `"5s"` ile, daemon yeniden başlayıp 5 saniye geçince biten Session `nomux ls --all` çıktısından düştü. Dosyanın yolunu [kurulum sayfası](/docs/tr/guides/install/) listeler.

Bilerek farklı olanlar:

- Ad Host'ta benzersizdir. screen aynı adla iki session'a izin verir.
- Tam ad, aynı harflerle başlayan daha uzun bir adın her zaman önüne geçer. screen'de `build` ile `builder` varsa `-S build` belirsizdir.
- nomux'un küçük bir yapılandırma dosyası vardır: `config.toml`. Geri yükleme politikası, saklama süresi, holder havuzu, bellek limitleri ve prefix tuşları orada durur. Tuş bağlaması yoktur; komutlardan oluşan bir `.screenrc` karşılığı da yoktur.
