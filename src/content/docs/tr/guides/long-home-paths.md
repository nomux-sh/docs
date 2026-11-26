---
title: Uzun home yolları
description: Uzun bir home dizininin nomux soket yollarını neden çok uzun yaptığı, nomux'un runtime dizinini /tmp'deki kısa bir bağlantıyla nasıl açtığı ve bir yol yine de sığmazsa ne yapılacağı.
---

Bir Unix soketinin yol sınırı vardır: macOS'ta 103 bayt, Linux'ta 107 bayt. nomux soketlerini runtime dizininde tutar: `~/.nomux/run`. Bu dizindeki en uzun soket yolu, havuzdaki bir holder'ın kontrol soketidir: `<runtime dizini>/<session kimliği>.pool/sock`. Runtime dizininden 19 bayt daha uzundur.
Bu yüzden 73 bayttan uzun bir home dizini, macOS için bir soket yolunu çok uzun yapar. macOS'ta uzun bir home dizini, önceki sürümlerde `nomux new` komutunu anlaşılmaz bir hatayla bozuyordu ([#65](https://github.com/nomux-sh/nomux/issues/65)). nomux 0.4.0 bunu çözer.

Bu sayfadaki çıktılar, nomux 0.4.0'ın Linux'taki gerçek çıktısıdır. Çalıştırmanın home dizini `/tmp/nomux-demo-with-a-long-home-directory-name-that-makes-the-socket-paths-too-long-xxx`, yani 88 baytlık bir dizindir.

## Kural

`~/.nomux/run` içindeki en uzun soket yolu 103 bayttan uzunsa nomux runtime dizinini `/tmp/nomux-<hash>` bağlantısı üzerinden açar. `<hash>`, runtime dizininin yolunun 64 bitlik FNV-1a hash'idir; 16 onaltılık basamakla yazılır.
Kural her Host'ta macOS'un sınırını kullanır. Böylece bir istemci uzak bir Host'un soketini yalnızca o Host'un home dizininden bilir.

```console
$ echo ${#HOME}
88
$ nomux new --cmd sh -c 'echo $NOMUX_SOCK; sleep 3600'
vygaejhw
$ nomux capture vygaejhw
/tmp/nomux-c6c257ef50042a31/nomuxd.sock
$ readlink /tmp/nomux-c6c257ef50042a31
/tmp/nomux-demo-with-a-long-home-directory-name-that-makes-the-socket-paths-too-long-xxx/.nomux/run
```

Session'ın komutunda `NOMUX_SOCK` kısa yolu taşır ([Session'ın ortamı](/docs/tr/guides/session-environment/)).

- **Dosyalar `~/.nomux/run` içinde kalır.** Bağlantı onlara yalnızca kısa bir yol verir. Soket, lock, log ve holder dizinleri eskisi gibi runtime dizinindedir:

  ```console
  $ ls ~/.nomux/run
  h5acygai.pool
  nomuxd.lock
  nomuxd.log
  nomuxd.sock
  ouwtkgsz.pool
  vygaejhw
  ```

- **Bağlantı kontrol edilir.** `/tmp` her kullanıcıya açıktır. Bağlantı yoksa daemon ve CLI onu oluşturur. O yolda, bu kullanıcının runtime dizinine giden bir bağlantı olmayan bir dosya varsa bu, yolu da yazan bir hatadır ve nomux o dosyayı silmez.
- **Silinen bağlantı geri gelir.** `/tmp` temizliği bağlantıyı silebilir. Daemon durmaz: sonraki istemci ya da daemon açılışı bağlantıyı yeniden oluşturur.

  ```console
  $ rm /tmp/nomux-c6c257ef50042a31; nomux ls
  ID        STATE    PID     COMMAND
  vygaejhw  running  934501  sh -c echo $NOMUX_SOCK; sleep 3600
  $ readlink /tmp/nomux-c6c257ef50042a31
  /tmp/nomux-demo-with-a-long-home-directory-name-that-makes-the-socket-paths-too-long-xxx/.nomux/run
  ```

73 baytlık bir home dizini için bağlantı gerekmez: böyle bir dizinle yapılan çalıştırmada `NOMUX_SOCK` home dizininin altında bir yoldu. 74 baytta ise `/tmp/nomux-<hash>` altında bir yoldu.

## Sığmayan bir yol

Bağlantı yalnızca runtime dizinini kısaltır. Holder, kontrol soketinin yolunu bağlamadan önce kontrol eder. Çok uzun bir yol, örneğin `nomux-holder`'ın uzun bir `--runtime-directory` değerinden ya da uzun bir session kimliğinden gelen yol, şu mesajla başarısız olur:

```text
the socket path <path> has <n> bytes, and the limit on this system is <limit> bytes
```

Bu mesaj nomux dokümanlarından geliyor. Bu sayfa için çalıştırılmadı.

## Sınırlar

- Bağlantı `/tmp` içindedir. `/tmp`'nin kullanıcı için yazılabilir olmadığı bir sistem uzun bir home dizinini kullanamaz.
- Hash yalnızca bağlantıyı adlandırır; bir sır değildir. Runtime dizininin modu 0700, soketin modu 0600'dür: daemon başka bir kullanıcının bağlantısını reddeder.
