---
title: Agent durumu
description: Her Session'da neyin çalıştığını, neyin bittiğini ve neyin sizi beklediğini görün; bir Session'ın neden sizi beklediğini ve her durumun nereden geldiğini öğrenin.
---

nomux her Session'daki işin durumunu gösterir: çalışan bir agent, sizi bekleyen bir komut, görmediğiniz bir sonuç.
Her durumun bir kaynağı vardır. nomux bir tahmini asla gerçek gibi göstermez.

Bu sayfadaki çıktılar, nomux 0.4.0'ın Linux'ta verdiği gerçek çıktılardır. Çalıştırmanın home dizini, geçici `/tmp/nomux-demo` dizinidir.
Sizdeki session kimlikleri farklı olacaktır. Örneklerdeki programlar küçük shell script'leridir, çünkü hiçbir agent aracı çalışmadı. [Claude Code adapter'ı](/docs/tr/guides/claude-code/) sayfası, gerçek bir agent aracının hook verisiyle bir adapter gösterir.

## Beş durum

| Durum | Anlamı |
|---|---|
| `idle` | Hiçbir iş çalışmıyor, hiçbir şey beklemiyor. |
| `working` | İş çalışıyor. |
| `done` | İş tamamlandı, sonuç sizi bekliyor. |
| `needs you` | İş sizsiz devam edemez. Bir türü olabilir: `permission`, `question` veya `auth`. |
| `error` | İş bir hatayla durdu. |

Agent çalışması, bir Session'daki iştir. Alt işleri olabilir: subagent'lar, takım arkadaşları ve arka plan görevleri. Her Alt işin kendi durumu vardır.

## Her Session'ın durumunu görmek

`nomux status` her Session için bir satır yazdırır:

```console
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 4rwbgxxt  ./report.sh error the build failed            error                  1s   the build failed
! c65xaxvc  ./osc.sh                                      needs you: permission  2s   may I install the linter?
* hg2oywnn  ./report.sh working reading the source files  working                1s   reading the source files
+ khkuqjw2  ./report.sh done all tests pass               done                   1s   all tests pass
  oisyjabu  /bin/bash                                     idle                   2s
! scgqcjko  ./report.sh blocked run the tests?            needs you              1s   run the tests?
```

- İlk sütun bir işarettir: `!` needs you, `x` error, `+` done, `*` working. `idle` olan bir Session'ın işareti yoktur.
- `FOR`, durumda geçen süredir. Yeni bir mesaj onu sıfırlamaz.
- Satırlar session kimliği sırasındadır.
- Biten bir Session'ın satırı son sonucunu gösterir: bkz. [Biten Session'lar](#biten-sessionlar).

Bir Session'ın satırı, onun en acil durumunu gösterir. Sizi bekleyen bir Alt iş, Session'ı da sizi bekler yapar.
Aciliyet sırası şöyledir: `needs you`, sonra görmediğiniz `error`, sonra görmediğiniz `done`, sonra `working`, sonra diğerleri. Aciliyet eşitse en uzun bekleyen durum öne geçer.

### Alt işler

`--tree`, her Alt iş için Session'ının altına bir satır ekler; her seviye iki boşlukla girintilenir:

```console
$ nomux status --tree
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 4rwbgxxt  ./report.sh error the build failed            error                  1s   the build failed
! c65xaxvc  ./osc.sh                                      needs you: permission  2s   may I install the linter?
!   lint                                                  needs you: permission  2s   may I install the linter?
*   tests                                                 working                2s   running 120 tests
* hg2oywnn  ./report.sh working reading the source files  working                1s   reading the source files
+ khkuqjw2  ./report.sh done all tests pass               done                   1s   all tests pass
  oisyjabu  /bin/bash                                     idle                   2s
! scgqcjko  ./report.sh blocked run the tests?            needs you              1s   run the tests?
```

`c65xaxvc` Session'ı çalışıyor, Alt işi `lint` ise bir izin bekliyor. Bu yüzden Session'ın satırı `needs you: permission` gösterir.

### Gördüğünüz sonuçlar

Bir `done` ya da `error` sonucu, siz görene kadar listede durur. Session'a attach olmak sonuçlarını görüldü olarak işaretler ve satırda `(seen)` yazar:

```console
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 4rwbgxxt  ./report.sh error the build failed            error                  7s   the build failed
! c65xaxvc  ./osc.sh                                      needs you: permission  8s   may I install the linter?
* hg2oywnn  ./report.sh working reading the source files  working                7s   reading the source files
+ khkuqjw2  ./report.sh done all tests pass               done (seen)            7s   all tests pass
  oisyjabu  /bin/bash                                     idle                   8s
! scgqcjko  ./report.sh blocked run the tests?            needs you              7s   run the tests?
```

Burada `nomux attach khkuqjw2` çalıştırıldı, ardından detach tuşlarına basıldı. Bir sonucu yalnızca attach görüldü olarak işaretler.

## Bir Session neden sizi bekliyor

`needs you`'dan sonraki tür nedeni söyler: `permission` (agent bir aracı çalıştırmak için izin ister), `question` (bir cevap bekler) veya `auth` (bir girişi bekler). Mesaj, ne sorduğunu söyler. Tür vermeyen bir program yalnızca `needs you` gösterir; yukarıdaki `scgqcjko` gibi.

`nomux agent explain` bir durumun nereden geldiğini söyler. Session'ın durumunu kaynağıyla yazdırır, sonra her kaynağı karar verdikleri sırayla listeler:

```console
$ nomux agent explain c65xaxvc
session c65xaxvc: working for 7s, from program status; message from program status: fixing the failing test
most urgent with its Child work: needs you: permission for 7s, from program status; message from program status: may I install the linter?

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      working: fixing the failing test (3 program status records in the terminal stream)
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal

child work:
  lint: needs you: permission for 7s, from program status; message from program status: may I install the linter?
  tests: working for 7s, from program status; message from program status: running 120 tests
```

Bir öğeyi bildiren ilk kaynak, o öğenin durumunu verir. Hiçbir şey bildirmeyen bir kaynak da nedeniyle birlikte listede yer alır.

## Durum nereden gelir

| Sıra | Kaynak | Ne olduğu |
|---|---|---|
| 1 | adapter | Bir [adapter extension'ı](/docs/tr/guides/agent-adapters/) durumu agent aracının olaylarından bildirir. |
| 2 | program durumu (`program status`) | Bir program durumunu terminal çıktısına Program Status Protocol (OSC 7501) ile yazar. Claude Code, Codex ve Qwen Code bunu gönderir. |
| 3 | öz bildirim (`self-report`) | Session'daki bir program `nomux status set` çalıştırır. |
| 4 | session geri yükleme (`session restore`) | Session process'ini kaybetti. Durum, Session'ın o andaki durumudur. |
| 5 | prompt işaretleri (`prompt marks`) | Shell bir komutun başını ve sonunu işaretler (OSC 133). Tahmin. |
| 6 | ön plandaki program (`foreground program`) | Session'ın komutu olmayan bir program terminali tutuyor. Tahmin. |

İlk dördü bir programın ya da Host'un bildirimidir. Son ikisi tahmindir ve CLI onları `(guess)` ile işaretler.
[ADR-0007](https://github.com/nomux-sh/docs/blob/main/adr/0007-status-source-order.md) sırayı ve nedenini kaydeder.

Burada biri, `oisyjabu` Session'ının shell'ine `sleep 30` yazdı ve detach oldu. Shell hiçbir prompt işareti göndermedi; bu yüzden tek kaynak ön plandaki programdır:

```console
$ nomux status | grep oisyjabu
* oisyjabu  /bin/bash                                     working (guess)        0s
$ nomux agent explain oisyjabu
session oisyjabu: working (guess) for 0s, from foreground program

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  working (the program sleep is in the foreground of the terminal)
```

Daemon, ön plandaki programın değiştiğini göremez: işletim sistemi ona haber vermez. Ön planı siz durumu istediğinizde okur. Yalnızca bu kaynağın gördüğü bir değişiklik olay üretmez.

## Kendi programınızdan durum bildirmek

Adapter'ı olmayan bir script ya da araç, durumunu kendisi bildirebilir. Programı bir Session çalıştırmalıdır.

```sh
nomux status set working "reading the source files"
nomux status set blocked "run the tests?"
nomux status set done "all tests pass"
```

- Durum `working`, `done`, `blocked`, `error` veya `idle` olur. `blocked`, `needs you` durumudur. `idle` bildirimi geri alır.
- Mesaj, en fazla 512 baytlık tek bir satırdır.
- Komut `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini okur; holder bunları bir Session'ın her process'ine verir ([Session'ın ortamı](/docs/tr/guides/session-environment/)). Session'ın dışında komut başarısız olur:

  ```console
  $ nomux status set working "x"
  nomux: NOMUX_SESSION_ID is not set: `nomux status set` works only inside a nomux session
  ```

  Çıkış kodu 4'tür.
- Bir bildirim, bir sonrakine kadar durur.

Yukarıdaki örnekler, bir Session'ın komutu olan şu script'ten geldi:

```sh
#!/bin/sh
sleep 1
nomux status set "$1" "$2"
sleep 3600
```

`sleep 1` bilerek orada. Komutunun ilk anlarında bildirim yapan bir program, daemon'un Session'ı henüz tanımadığını görebilir: o zaman `nomux status set` 2 ya da 4 çıkış koduyla başarısız olur. Bir an sonra yeniden bildirin.

Terminaline OSC 7501 yazan bir program için komut gerekmez. Alt işi de bildirebilir; `id` bir yoldur (`tests`, Agent çalışmasının altındadır). `c65xaxvc` Session'ının script'i bunu yaptı:

```sh
#!/bin/sh
text() { printf %s "$1" | base64 -w0; }
report() { printf '\033]7501;%s\033\\' "$1"; }
report "state=working:msg=$(text 'fixing the failing test')"
report "id=tests:state=working:msg=$(text 'running 120 tests')"
report "id=lint:state=blocked:kind=permission:msg=$(text 'may I install the linter?')"
sleep 3600
```

[Program Status Protocol](https://control-codes.page/proposals/osc-7501/) tam biçimi anlatır.

## Olaylar

`nomux events --follow`, bir durumun her değişikliğini olduğu anda yazdırır. Ctrl-C ile biter.

```console
$ nomux events --follow
1 c65xaxvc working fixing the failing test
2 c65xaxvc working fixing the failing test
3 c65xaxvc needs you: permission may I install the linter?
4 hg2oywnn working reading the source files
5 scgqcjko needs you run the tests?
6 4rwbgxxt error the build failed
7 khkuqjw2 done all tests pass
8 khkuqjw2 done (seen) all tests pass
9 scgqcjko done
```

Bir satır; olay numarası, Session, durum ve mesajdan oluşur. `8` numaralı olay, sonucu görüldü olarak işaretleyen attach'tir. Daemon son olayları bellekte tutar: daemon yeniden başlayınca numaralar baştan başlar. Çok geride kalan bir istemci, önce mevcut durumun bir snapshot'ını alır.

`--filter agent-run-changed`, `--filter agent-run-removed` ve `--filter extension-event` yalnızca o türdeki olayları yazdırır. `--json` ile her satır bir JSON belgesi olur. Alanları [CLI başvurusunda](/docs/tr/reference/cli/) bulabilirsiniz.

## Biten Session'lar

Bir Session'ın komutu bitince nomux onun son Agent çalışmasını saklar: çalışan ya da bekleyen iş `done` olur ve bir sonuç kalır. Sizi bekleyen bir Session'a `nomux kill scgqcjko` uygulandıktan sonra:

```console
$ nomux kill scgqcjko
session scgqcjko ended
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 4rwbgxxt  ./report.sh error the build failed            error                  7s   the build failed
! c65xaxvc  ./osc.sh                                      needs you: permission  8s   may I install the linter?
* hg2oywnn  ./report.sh working reading the source files  working                7s   reading the source files
+ khkuqjw2  ./report.sh done all tests pass               done (seen)            7s   all tests pass
  oisyjabu  /bin/bash                                     idle                   8s
+ scgqcjko  ./report.sh blocked run the tests?            done                   0s
$ nomux agent explain scgqcjko
session scgqcjko: done for 0s, from session restore

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: the session has no process
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     done (the session lost its process: the status is what the session had then, and work that ran or waited is shown as complete)
  prompt marks        nothing: the session has no process
  foreground program  nothing: the session has no process
```

Uykudaki Session için de aynı kural geçerlidir. İşin mesajı gösterilmez, çünkü o mesaj çalışmış bir işi anlatıyordu.
Saklanan çalışma, daemon Session'ı silene kadar, yani [saklama süresi](/docs/tr/reference/glossary/) sonunda, durur. Bir adapter verdiyse agent aracının resume komutunu gösterir. Daemon en fazla 64 böyle çalışma tutar.

## Bu sürümün sınırları

- Daemon durumu diske yazmaz. Daemon yeniden başladıktan sonra process'i olmayan bir Session kaynaksız `idle` gösterir ve biten Session'ların saklanan çalışmaları gider. Process'i olan bir Session yeniden bildirim yapar.
- Komutunun ilk anlarında ilk kez bildirim yapan bir program başarısız olabilir: bkz. [Kendi programınızdan durum bildirmek](#kendi-programınızdan-durum-bildirmek).
- Sizi bekleyen bir Session'a girdi vermek onun işaretini kaldırmaz. Durum, program yeniden bildirim yaptığında değişir.
- Bir sonucu yalnızca attach görüldü olarak işaretler. Biten bir Session'ın sonucu, daemon Session'ı silene kadar görülmemiş kalır.
- Alt işin öz bildirimi yoktur. `nomux status set` Session'ın Agent çalışmasını bildirir.
- Bir Session'da birden fazla Agent çalışması desteklenmez.

Hiçbir kaynağın bildirmediği iş, kaynağı `none` olan `idle` durumundadır. nomux durum için terminalin başlığını ya da ekranını okumaz.
