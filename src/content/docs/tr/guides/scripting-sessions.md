---
title: Session'ları script'lemek
description: nomux send ile Session'a yazın, capture -f ile çıktısını izleyin, kill --all ile çok sayıda Session'ı sonlandırın; script için JSON çıktısını, çıkış kodlarını ve hedefleri kullanın.
---

nomux'un `attach` komutu ile `new`'in `-a` ve `-A` seçenekleri dışındaki her komutu terminalsiz çalışır. Bu yüzden bir script Session açabilir, ona yazabilir, çıktısını okuyabilir ve onu sonlandırabilir.
Bu sayfa `send`, `capture -f` ve `kill --all` komutlarını; bir script'in JSON çıktısından, çıkış kodlarından ve hedeflerden neye ihtiyaç duyduğunu anlatır.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'taki gerçek çıktısıdır. Sizdeki session kimlikleri ve process ID'leri farklı olacaktır.
İlk adımlar [hızlı başlangıçta](/docs/tr/guides/quick-start/), adlar ve hedefler [Session'lar](/docs/tr/guides/sessions/) sayfasındadır.

## Session'a yazmak: `send`

`nomux send <hedef> <metin>...` metni Session'ın terminaline, siz yazmışsınız gibi yazar ve ardından Enter'a basar.
Aşağıdaki Session satır okur ve her satırı bir önekle yazdırır:

```console
$ nomux new -n reader -- sh -c 'while read line; do echo "got: $line"; done'
libqhkc6
$ nomux send reader hello world
$ nomux capture reader --lines 2
hello world
got: hello world
```

İlk `hello world` terminalin yankısıdır, ikinci satır programın cevabıdır. `send` hiçbir çıktı yazdırmaz ve çıkış kodu 0'dır.

Şu kuralları aklınızda tutun:

- `send`, metnin kelimelerini aralarına tek boşluk koyarak birleştirir. İçinde boşluk olan bir kelime boşluğunu korur: `nomux send reader 'a   b'` üç boşluk gönderir.
- Hedeften sonra gelen her kelime metindir; seçenek gibi görünen kelime de. `nomux send reader --json` komutu `--json` yazar. `--json` ile `--quiet`'i hedeften önce yazın.
- Baytlar tek istekte gider; yani birbirinden ayrılmaz.
- `send` hemen yazar. Programın hazır olmasını beklemez ve cevabı okumaz. Cevabı okumak için `capture` kullanın.
- Satır sonu olan bir metin 1 çıkış koduyla biter ve hiçbir şey göndermez. Her seferinde tek satır gönderin.

```console
$ nomux send reader "two
lines"
nomux: the text has a line break: send one line at a time, or each key with -k
```

### Enter'sız metin

`--no-enter` metni Enter olmadan gönderir. Sonradan tamamlayacağınız bir taslak için ya da satır yerine tek tuş bekleyen bir prompt için kullanın:

```console
$ nomux send --no-enter reader draft
$ nomux send -k reader Enter
$ nomux capture reader --lines 2
draft
got: draft
```

### Tuşlar: `-k`

`-k` (`--keys`) her kelimeyi bir tuş adı yapar; `send` Enter eklemez. Adlar tmux'un adlarıdır:

- `Enter`, `Escape`, `Tab`, `S-Tab`, `Space`, `BSpace`
- `Up`, `Down`, `Left`, `Right`, `Home`, `End`, `PgUp`, `PgDn`
- `F1` ile `F12` arası
- `Ctrl`'lü tuş için `C-<harf>`, `Alt`'lı tuş için `M-<karakter>`

Aldığı baytları yazdıran bir test Session'ı, birkaç tuşun ne gönderdiğini gösterdi: `Up` için `ESC [ A`, `F1` için `ESC O P`, `F12` için `ESC [ 24 ~`, `C-a` için 1 numaralı bayt, `M-x` için `ESC x`. İmleç tuşları normal imleç kipinin dizisini gönderir.

`send`'in tanımadığı bir ad, diğer adlar doğru olsa bile, 1 çıkış koduyla biter ve hiçbir şey göndermez:

```console
$ nomux send -k reader Foo
nomux: "Foo" is not a key name: give Enter, Escape, Tab, S-Tab, Space, BSpace, Up, Down, Left, Right, Home, End, PgUp, PgDn, F1 to F12, C-<letter> or M-<character>
```

`C-c`, bir terminalde olduğu gibi Session'ın programını keser. Burada döngüyü sonlandırır ve döngünün shell'i de onunla biter:

```console
$ nomux send -k reader C-c
$ nomux ls --all
ID        NAME    STATE  PID  COMMAND                                            NOTE
libqhkc6  reader  ended  -    sh -c while read line; do echo "got: $line"; done  signal 2
```

### Hangi Session `send` kabul eder

| Session | Sonuç |
|---|---|
| Çalışıyor | Metin terminale gider |
| Uykuda (dormant) | Çıkış kodu 1; mesaj `nomux start <kimlik>` komutunu söyler. `send` Session başlatmaz |
| Bitmiş, kimlikle | Çıkış kodu 2: `session <kimlik> ended: its command does not run` |
| Bitmiş, adla | Çıkış kodu 2; çünkü ad yalnızca bitmemiş Session'ları bulur |

## Çıktıyı gelirken okumak: `capture -f`

`nomux capture <hedef>` bir Session'ın son 100 satırını yazdırır. `nomux capture -f <hedef>` (`--follow`) bu satırları, sonra Session bitene kadar komutun yazdığı her baytı yazdırır.
Komut salt okunur bir istemci olarak attach olur: girdi ve pencere boyutu göndermez, her bayt'ı bir kez alır.

Bu örnekte çıktı bir dosyaya gidiyor. Session bitince komut 0 çıkış koduyla biter:

```console
$ nomux new -n build -- sh -c 'for i in 1 2 3; do echo "step $i"; sleep 1; done'
xxzazneq
$ nomux capture -f build > build.log
$ cat build.log
step 1
step 2
step 3
```

Bu yüzden `nomux capture -f api >> api.log` bir Session'ın çıktısını dosyada tutar.

Çıkış kodu şu durumların hepsinde 0'dır: Session biter, komuta `SIGINT` ya da `SIGTERM` gönderirsiniz ya da çıktıyı okuyan taraf çıktıyı kapatır (`nomux capture -f api | head -2`).
`--lines <n>` baştaki satır sayısını belirler.

Bu Session 300 satır ve 3 saniye sonra `done` yazdırdı. Komut 5 saniye sonra `SIGINT` ile durduruldu:

```console
$ nomux new -n watch -- sh -c 'seq 1 300; sleep 3; echo done; sleep 600'
5th7pjdd
$ nomux capture -f watch > watch.log &
$ kill -INT $!
$ wc -l < watch.log
101
$ head -1 watch.log
201
$ tail -2 watch.log
300
done
```

Dosyada başlangıçtan önceki son 100 satır (`201` ile `300`) ve sonradan gelen `done` satırı var.

`capture -f` komutunun sınırları:

- Çıktı, komutun yazdığı baytların aynısıdır: her satır sonunda bir satırbaşı (carriage return) ve komutun escape sequence'leri bulunur. Bir shell prompt'u için escape sequence yazar. Temiz metin gerekiyorsa script'te bunları ayıklayın.
- `--json` bununla çalışmaz. Çıktı komutun baytlarıdır ve hata bunu söyler (çıkış kodu 1).
- Bitmiş bir Session için `-f` olmadan `capture` kullanın. `-f` ile nomux 0.5.0 son satırları yazdırır, sonra `session <kimlik> ended: its command does not run` yazar ve 2 çıkış koduyla biter. Bu bilinen bir sınırdır: sürümün CLI dokümanı yalnızca komutun Session bitince bittiğini söyler.

## Cevabı beklemek

`send` beklemez; bu yüzden script, ihtiyacı olanı görene kadar çıktıyı okur. Bu script sayıların karesini alan bir Session açar, bir sayı gönderir ve cevabı bekler:

```sh
#!/bin/sh
set -e
nomux new -n calc -- sh -c 'while read n; do echo "square: $((n * n))"; done' >/dev/null
nomux send calc 12
until nomux capture calc | grep -q 'square: 144'; do sleep 0.5; done
nomux capture calc --lines 1 | tr -d '\r'
nomux kill calc
```

```console
$ sh square.sh
square: 144
session calc (sygcspxb) ended
```

Bu script hakkında iki nokta:

- Session'ın terminali yazdığınızı yankılar; yani yazdığınız metin de çıktıdadır. Aranan desen, gönderdiğiniz satırda bulunmamalı. Burada `12` yazılır, `square: 144` cevaptır.
- Terminal Session'ında bir satır satırbaşı ile biter. `grep -q 'square: 144$'` onu eşleştirmez. Karakteri `tr -d '\r'` ile silin ya da desenin sonunu açık bırakın. Bir shell'in çıktısında satır başında escape sequence de olur; bu yüzden desenin başını da sabitlemeyin.

Session'ın journal'ı, çıktıdan en geç 1 saniye sonra yazılır. `send`'in hemen ardından çalışan bir `capture`, programın yazdığından daha azını yazdırabilir: script'teki gibi yeniden okuyun.

## Çok sayıda Session'ı sonlandırmak: `kill --all`

`nomux kill --all`, komutu çalışan her Session'ı birbiri ardına sonlandırır ve her biri için bir satır yazdırır. Sonraki örneklerin Session listesi şu:

```console
$ nomux ls
ID        NAME    STATE    PID      COMMAND
gg5n3iod  web     running  4080188  sleep 600
jzopbhue  worker  running  4080191  sleep 600
tefuuqvp  -       running  4080194  sleep 600
```

`--dry-run` Session'ları yazdırır ve hiçbirini sonlandırmaz. `--json` ile doküman `would_kill` olur:

```console
$ nomux kill --all --dry-run
session web (gg5n3iod) would end
session worker (jzopbhue) would end
session tefuuqvp would end
$ nomux --json kill --all --dry-run
{"schema_version":1,"would_kill":["gg5n3iod","jzopbhue","tefuuqvp"]}
```

Bir terminalde komut önce standart hatada sorar. Yalnızca `y` ya da `yes` Session'ları sonlandırır. Boş satır dahil diğer her cevap hiçbirini sonlandırmaz ve çıkış kodu 1 olur:

```console
$ nomux kill --all
nomux: end 3 sessions? [y/N] n
nomux: no session ended
```

Terminal yoksa komut sormaz. `--yes` gerekir; yoksa çıkış kodu 1 olur ve hiçbir Session sonlanmaz.

```console
$ nomux kill --all < /dev/null
nomux: kill --all ends 3 sessions: without a terminal, give --yes
$ nomux kill --all --yes
session web (gg5n3iod) ended
session worker (jzopbhue) ended
session tefuuqvp ended
```

`--yes` terminalde de soruyu atlar. `--json` ile `killed_sessions` alanı gelir: `{"schema_version":1,"killed_sessions":["mwc2oqo3"]}`.

Çalışan Session yoksa komut `no session runs` yazar, hiçbir şey sormaz ve 0 çıkış koduyla biter. Bir Session sonlanmazsa onun hatası standart hataya gider, diğer Session'lar yine de sonlanır ve çıkış kodu hataların en yüksek kodu olur.

### Uykudaki Session'lar: `--include-dormant`

`kill --all` uykudaki (dormant) Session'a dokunmaz. Host yeniden başladıktan sonra her Session uykudadır ve komut onların çıktısını silmemelidir. Uykudaki Session'ın sonlandırılacak bir komutu yoktur. `nomux kill <hedef>` ve `--include-dormant` onu çıktısıyla birlikte siler.

```console
$ nomux ls
ID        NAME     STATE    PID      COMMAND
ayk4q27a  live     running  3968954  sleep 600
kifzbrhd  run      dormant  -        sleep 600
utdbl3b6  sleeper  dormant  -        sleep 600
$ nomux kill --all --yes
session live (ayk4q27a) ended
$ nomux ls
ID        NAME     STATE    PID  COMMAND
kifzbrhd  run      dormant  -    sleep 600
utdbl3b6  sleeper  dormant  -    sleep 600
$ nomux kill --all --yes --include-dormant
session run (kifzbrhd) ended
session sleeper (utdbl3b6) ended
$ nomux ls
no sessions
```

`--dry-run --include-dormant` uykudaki Session'ları da listeler. `kill`'in `-a` seçeneği yoktur: tmux'ta `kill-session -a` diğer her Session'ı sonlandırır. `nomux kill --all` her Session'ı sonlandırır ve hedefle birlikte kullanılamaz.

## JSON ve çıkış kodları

Her komut `--json` ve `--quiet` kabul eder; ikisi birlikte olmaz. Bunları komuttan önce ya da `--`'den önce yazın: `--`'den sonraki her argüman Session'ın komutuna gider.

| Komut | `--quiet` | `--json` |
|---|---|---|
| `new` | Session kimliği | `{"schema_version":1,"session":{...}}`; içinde `id`, `name`, `state`, `pid`, `command`, `cwd` ve daha fazlası var |
| `ls` | Her satırda bir kimlik | `{"schema_version":1,"sessions":[...]}`; her Session için aynı nesne ve `project` alanı |
| `send` | Hiçbir şey | `{"schema_version":1,"sent":{"id":"...","bytes":13}}`: Session'ın Enter dahil aldığı bayt sayısı |
| `capture` | Çıktı satırları | `{"schema_version":1,"capture":{"id":"...","output":"..."}}` |
| `kill` | Hiçbir şey | `{"schema_version":1,"killed":"<kimlik>"}` |
| `kill --all` | Hiçbir şey | `killed_sessions`; `--dry-run` ile `would_kill` |
| `attach`, `new -a`, `new -A` | Hiçbir şey | Attach bittikten sonra tek bir doküman; `end` alanı: `detached`, `exited`, `signaled`, `lost` ya da `unknown` |

```console
$ nomux new --json -n z -- sleep 5 | jq -r .session.id
dcybgmle
$ nomux --quiet ls
dcybgmle
rese27fe
wddj2dq4
$ nomux --json ls | jq -c '.sessions[] | {id, name, state}'
{"id":"dcybgmle","name":"z","state":"running"}
{"id":"rese27fe","name":"x","state":"running"}
{"id":"wddj2dq4","name":"y","state":"running"}
```

Adı olmayan Session'da `"name":null` bulunur. `jq -r` ile `.name` onun için `null` yazar: onu atlamak için `// empty` ekleyin.

Hata standart hataya `nomux: <mesaj>` olarak gider ve standart çıktı boş kalır. `--json` ile hata, standart hatada tek bir dokümandır. Mesajın metni değişebilir: bir script çıkış kodunu, JSON'daki `kind` ve `candidates` alanlarını kullanmalıdır.

```console
$ nomux --json rename nosuch x
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier or the name nosuch, and no session has a name or an identifier that starts with it"}}
$ nomux --json attach job < /dev/null
{"schema_version":1,"error":{"code":1,"kind":"error","message":"attach needs a terminal: the standard input is not a terminal"}}
```

| Kod | `kind` | Bu sayfadaki komutlarda |
|---:|---|---|
| 0 | | Başarı |
| 1 | `error` | Yanlış komut satırı, geçersiz ya da kullanılan bir ad, birden fazla Session olabilecek bir hedef, satır sonu olan bir metin, bilinmeyen bir tuş adı, terminalsiz ve `--yes`'siz `kill --all`, `send` için uykudaki bir Session |
| 2 | `not_found` | Hedefle eşleşen Session yok ya da Session'ın komutu bitmiş |
| 3 | `timeout` | Bir işlem izin verilen sürede tamamlanmadı |
| 4 | `no_permission` | Kullanıcının izni yok; örneğin daemon'un socket'i için |
| 5 | `version_mismatch` | CLI ile daemon'un ortak bir protokol sürümü yok |

`attach` ve `new -a`, Session'ın komutunun çıkış durumuyla bitebilir; yani 1 ile 5 arası bir değer komuttan da gelebilir. Tam tablo [CLI başvurusunda](/docs/tr/reference/cli/) yer alır.

## Script'te hedefler

Hedef; kimlik, ad ya da ikisinden birinin başıdır. Bir script'te:

- Kimliği `nomux new --quiet` çıktısından alın ya da kendi seçtiğiniz bir adı verin ve sonraki her komutta onu kullanın. Kimlik hiç değişmez; tam ad da Session yaşadığı sürece başka bir Session'ı bulmaz.
- Adın başını kullanmayın. Sonradan açılan bir Session bir başı belirsiz yapabilir; o zaman komut 1 çıkış koduyla ve adaylarla biter. Tam ad, aynı harflerle başlayan daha uzun bir adın her zaman önüne geçer.
- Ad yalnızca bitmemiş Session'ları bulur. Bir Session'ın komutu bittikten sonra kimliğini kullanın: `nomux capture <kimlik>` çıktısını 24 saat boyunca yine yazdırır.
- `nomux new -n <ad>`, o adı taşıyan bir Session varsa 1 çıkış koduyla başarısız olur. `new -A` terminal gerektirir; bu yüzden script önce kontrol eder:

```console
$ nomux ls --json | jq -e '.sessions[] | select(.name == "job")' > /dev/null || nomux new -n job -- sleep 600
33yct7jo
```

İkinci çalıştırmada `jq` komutu Session'ı bulur ve `nomux new` çalışmaz.

## Sıradaki adımlar

- [Session'lar](/docs/tr/guides/sessions/): adlar, hedefler ve attach tuşları.
- [tmux ve screen'den gelenler için](/docs/tr/guides/coming-from-tmux-and-screen/): `send-keys`, `pipe-pane` ve `kill-server` nomux'ta nasıl yapılır.
- [Uzak Host'lar](/docs/tr/guides/remote-hosts/): `--host` ile bir sunucuda aynı komutlar.
