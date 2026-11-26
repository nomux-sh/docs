---
title: Holder havuzu
description: Holder havuzu nedir, yeni bir Session neden hızlı açılır, pool.size ve pool.idle_time ayarları ve yeni bir Session'ın bir cd satırı göstermesi sınırı.
---

Yeni bir Session 10 ms'den kısa sürede açılmalıdır. Bir holder'ın başlaması yaklaşık 1 ms sürer. Bir shell'in başlangıç dosyalarıyla birlikte başlaması 2 ms ile 200 ms'den fazla arasında sürer.
Bu yüzden daemon az sayıda holder'ı hazır tutar; her birinde kullanıcının shell'i önceden başlatılmıştır: **holder havuzu**. Shell ile açılan yeni bir Session bunlardan birini alır.

Bu sayfadaki çıktılar, nomux 0.4.0'ın Linux'taki gerçek çıktısıdır. Çalıştırmanın home dizini geçici `/tmp/nomux-demo` dizinidir.

## Ne görürsünüz

Bir istemcinin ilk isteğinden önce hiçbir şey çalışmaz. İlk istekten sonra daemon havuzu doldurur. Havuzdaki her holder'ın runtime dizininde `.pool` son ekli bir dizini vardır:

```console
$ nomux ls
no sessions
$ ls ~/.nomux/run
66hgjht7.pool
bkidecqo.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
```

- Havuzdaki holder bir Session değildir. `nomux ls` onu listelemez, `nomux daemon status` saymaz.
- State dizini ve journal'ı yoktur.
- Havuzdaki holder'ın standart girdisi daemon'dan gelen bir pipe'tır. Daemon sonlandığında, `kill -9` ile sonlandığında da, havuzdaki her holder shell'iyle birlikte sonlanır. Session'ı olan bir holder ise, her Session holder'ı gibi, devam eder.
- Yeni bir daemon, önceki daemon'un havuzdaki holder'larını almaz. Onlar kendiliğinden sonlanır ve yeni daemon kendi havuzunu ilk isteğinde başlatır.

Komutsuz `nomux new` en eski havuzdaki holder'ı alır, daemon da cevap verdikten sonra bir sonrakini başlatır. `bkidecqo` Session'ı havuzdan geldi. Alındıktan sonra havuzda yeni bir `.pool` dizini olur, Session'ın holder'ında ise Session kimliğinin dizini.

## Ayarlar

Daemon `~/.config/nomux/config.toml` dosyasını açılışında bir kez okur. Bir değişiklik daemon'un sonraki açılışından sonra geçerli olur.

```toml
[pool]
size = 2          # 0 to 8; 0 turns the pool off
idle_time = "10m" # a number with the unit s, m, h or d
```

| Anahtar | Varsayılan | İşlevi |
|---|---|---|
| `pool.size` | `2` | Daemon'un hazır tuttuğu holder sayısı. |
| `pool.idle_time` | `10m` | Hiçbir Session başlamadığında havuzun ne kadar durduğu. Sonra havuz boşalır ve sonraki yeni Session onu yeniden doldurur. |

`size = 0` ile daemon havuzda hiçbir holder başlatmaz:

```console
$ cat ~/.config/nomux/config.toml
[pool]
size = 0
$ nomux ls
no sessions
$ ls ~/.nomux/run
nomuxd.lock
nomuxd.log
nomuxd.sock
```

`idle_time = "30s"` ile havuz, yeni bir Session olmadan 30 saniye geçince boşalır:

```console
$ cat ~/.config/nomux/config.toml
[pool]
size = 2
idle_time = "30s"
$ nomux ls
no sessions
$ ls ~/.nomux/run
3a5fgpb3.pool
mitkj4pm.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
```

Yeni bir Session olmadan 33 saniye sonra `ls ~/.nomux/run` yalnızca `nomuxd.lock`, `nomuxd.log` ve `nomuxd.sock` gösterdi. Daemon yoklama yapmaz: boşta kalma süresinin sonu için kurulan tek bir zamanlayıcı havuzun görevini uyandırır.

Havuzdaki bir shell bellek kullanır: statik build'li holder için yaklaşık 1 MB ve shell'in belleği. Varsayılan 2, art arda başlayan iki Session'a hazır bir holder verir. Daha büyük bir sayı, çoğu Host'un ihtiyaç duymadığı kadar bellek kullanır.
Geçersiz bir dosya daemon'u durdurmaz: daemon sorunu log'una yazar ve varsayılanları kullanır.

## Bilinen sınır: dizin değişikliği görünür

Havuzdaki shell, Session henüz yokken home dizininde başlar. Session'ın çalışma dizini başkaysa daemon dizin değişikliğini shell'e yazar. Satır Session'ın ekranında ve journal'ında görünür:

```console
$ nomux new --cwd ~/project
mvnfjcys
$ nomux capture mvnfjcys | cat -v
 cd '/tmp/nomux-demo/project'^M
^[[?2004l^M^[[?2004hbash-5.3$ 
```

Yeni bir holder'dan açılan Session bu satırı göstermez. `pool.size = 0` ile aynı komut yalnızca prompt'u gösterir:

```console
$ nomux capture 4yxsgapc | cat -v
^[[?2004hbash-5.3$ 
```

Bunun için [#74](https://github.com/nomux-sh/nomux/issues/74) numaralı issue açık: havuzdan açılan yeni bir Session yalnızca prompt'u göstermelidir. Kapanana kadar havuzu `size = 0` ile kapatabilirsiniz; bu durumda Session biraz daha geç açılır.

`cd`'den önceki boşluk, satırı buna göre ayarlanmış bir shell'in geçmişinin dışında tutar (bash'te `ignorespace`, zsh'te `HIST_IGNORE_SPACE`, fish'te varsayılan davranış).

Diğer sınırlar:

- Shell'in başlangıç dosyaları home dizininde çalıştı. Çalışma dizinini okuyan bir başlangıç dosyası home dizinini okur.
- Kullanıcının shell'i `sh`, `bash`, `zsh`, `dash`, `ksh`, `mksh` ya da `fish` değilse havuz kapalıdır. `'`, `\`, bir kontrol karakteri ya da UTF-8 olmayan baytlar içeren bir çalışma dizini yeni bir holder alır.
- Komutlu bir Session (`nomux new -- <komut>`) her zaman yeni bir holder alır. Havuzdaki bir holder yalnızca shell'ini verebilir.
- Havuzda bir holder, holder hazır olduğunda bulunur; shell'i başlangıç dosyalarını bitirdiğinde değil. O sırada holder'ı alan bir Session prompt'unu daha geç gösterir.
- Havuzdaki bir shell, [Session'ın ortamını](/docs/tr/guides/session-environment/) alır. Soruyu soran istemcinin ortamını almaz. Her Session için bu eksiklik [#75](https://github.com/nomux-sh/nomux/issues/75) numaralı issue'dadır.
