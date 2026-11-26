---
title: Session'ların belleği
description: nomux ls --memory ile her Session'ın process'lerinin ne kadar bellek kullandığını görün, sayıların neyi saydığını ve nomux'un neyi ölçmediğini öğrenin.
---

`nomux ls --memory`, her Session'ın process'lerinin şu an kullandığı belleği gösterir. Bellek azaldığında hangi Session'ın onu kullandığını görürsünüz.

Bu sayfadaki çıktılar, nomux 0.4.0'ın Linux'taki gerçek çıktısıdır. Çalıştırmanın home dizini geçici `/tmp/nomux-demo` dizinidir.
Dört Session'ın komutları şunlardı: `python3 hog.py 200` (200 MiB ayıran bir program), iki böyle programı (50 MiB ve 30 MiB) başlatan bir `sh`, `sleep 3600` ve kullanıcının shell'i.

## Belleği göstermek

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  COMMAND
epvdx7iy  running  155.0 KiB  1          325.0 KiB  pss      sleep 3600
myuy5zl4  running  203.9 MiB  1          332.0 KiB  pss      python3 hog.py 200
nubgqpss  running  88.2 MiB   3          332.0 KiB  pss      sh -c python3 hog.py 50 & python3 hog.py 30 & wait
ynz3inyu  running  784.0 KiB  1          355.0 KiB  pss      /bin/bash
total: 293.1 MiB in 6 processes of 4 sessions, and 1.3 MiB in the holders (pss)
```

| Sütun | Anlamı |
|---|---|
| `MEMORY` | Komutun process ağacının belleği: komut ve ondan türeyen her process. |
| `PROCESSES` | Bu ağaçtaki process sayısı. |
| `HOLDER` | Session'ın holder'ının belleği. **Holder `MEMORY` içinde değildir.** nomux onu ayrı bir değer olarak gösterir. |
| `MEASURE` | nomux'un iki değeri nasıl saydığı: `pss` ya da `rss`. |

`nubgqpss` Session'ının 3 process'i var: `sh` ve iki child'ı. 88.2 MiB'ı, child'ların 50 MiB ve 30 MiB'ından ve shell ile interpreter'ların belleğinden oluşur.

Process'i olmayan bir Session'ın değeri yoktur ve toplama girmez. Burada `epvdx7iy` Session'ının holder'ı `kill -9` ile sonlandı; Host'un yeniden başlaması da onu böyle sonlandırırdı:

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  COMMAND
epvdx7iy  dormant  -          -          -          -        sleep 3600
myuy5zl4  running  204.1 MiB  1          352.0 KiB  pss      python3 hog.py 200
nubgqpss  running  88.7 MiB   3          352.0 KiB  pss      sh -c python3 hog.py 50 & python3 hog.py 30 & wait
ynz3inyu  running  785.0 KiB  1          376.0 KiB  pss      /bin/bash
total: 293.6 MiB in 5 processes of 3 sessions, and 1.0 MiB in the holders (pss)
```

Değerler komutun çalıştığı andan alınır. İkinci bir komut yeniden ölçer. Canlı görünüm isteyen bir istemci isteği kendi aralığında yeniden gönderir. Böyle bir istemci henüz yok.

`--json` ile her Session'ın bir `memory` nesnesi olur:

```json
"memory":{"command_bytes":158720,"command_processes":1,"holder_bytes":332800,"measure":"pss"}
```

Tam doküman [CLI başvurusunda](/docs/tr/reference/cli/).

## `pss` ve `rss`

| Ölçü | Nerede | Anlamı |
|---|---|---|
| `pss` | Linux | Orantılı set boyutu (proportional set size). Birden fazla process'in kullandığı bir sayfa aralarında bölünür; bu yüzden bir toplam her sayfayı bir kez sayar. |
| `rss` | Linux'ta kernel'in `pss` vermediği process'ler için, ve macOS | Resident set boyutu. Birden fazla process'in kullandığı bir sayfa her birinin değerinde bulunur; bu yüzden bir toplam, kullanımdaki bellekten büyük olabilir. |

- Bir Session'ın `pss` değerine sahip olması için nomux'un bunu holder için ve komutun her process'i için alabilmesi gerekir. Tek bir process'te eksik olması, Session'ın her değerini `rss` yapar. nomux iki türü hiçbir zaman toplamaz.
- Session'ların ölçüleri farklı olan bir Host'ta toplam satırı `pss and rss` der.
- İki ölçü de şu an bellekte duran sayfaları sayar. Swap'i ve kernel'in process'ler için kullandığı belleği saymaz.
- macOS'ta orantılı set boyutu yoktur; bu yüzden orada ölçü her zaman `rss`'tir. macOS kodunun testleri yalnızca CI'da çalıştı. Gerçek Session'larla bir Mac'te denenmedi ve değer, Activity Monitor'ün gösterdiği değer değildir.

## nomux neyi sayar

Bir Session'ın komutu, holder'ının tek child'ıdır. Komutun process ağacı, holder'dan türeyen her process'tir. İşlerini kendi process group'unda başlatan bir shell ağacın içinde kalır.

Ağaçtan ayrılan bir process **sayılmaz**: bir process bittiğinde işletim sistemi onun child'larını process 1'e verir. Kendini daemon yapan bir program bunu bilerek yapar ve nomux onun Session'dan geldiğini bilemez.

nomux önce process tablosunu, sonra her process'in belleğini, sonra her process'in kimliğini yeniden okur. Bir process, iki okuma arasında değişmediyse sayılır. Bu yüzden bir değer hiçbir zaman başka bir programın process'inin belleği olmaz. Bedeli, ağacın bir kısmı biterken tek bir istek için fazla küçük çıkan bir değerdir.

## Maliyeti

- Daemon yalnızca bir istemci istediğinde ölçer. Zamanlayıcısı yoktur ve iki istek arasında hiçbir değer tutmaz.
- İş, isteğin 10 saniye sonra biten bir thread'de çalışır. Boştaki daemon CPU zamanı kullanmaz.
- [Performans sayfasında](/docs/tr/reference/performance/), `nomux` reposunun ölçümlerinden, 50 Session ve 200 Session için bir isteğin süresi var.

## Bellek limiti yapılmadı

nomux 0.4.0 belleği gösterir. Sınırlamaz. `memory_limit` anahtarı, her Session için bir limit ve limit sütunu, [`docs/memory.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/memory.md#design-an-optional-memory-limit-for-a-session) dosyasındaki bir tasarımdır: kodu yok. Tasarım Linux'ta control group'ları kullanır, macOS'ta limit vermez.

Bunun için [#38](https://github.com/nomux-sh/nomux/issues/38) numaralı issue açık. Boştaki agent'ların hazırda bekletilmesi ([#36](https://github.com/nomux-sh/nomux/issues/36)) de açık. Disk ve bellek bütçeleri hakkındaki karar [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md)'da kayıtlı.
