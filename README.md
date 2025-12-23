# 🌍 GIS Bencana & Laporan Warga

Aplikasi Sistem Informasi Geografis (SIG) berbasis web untuk memvisualisasikan data bencana (BNPB) dan memungkinkan warga untuk melaporkan kejadian bencana secara *real-time* ke dalam peta.

Aplikasi ini menggunakan **Google Sheets** sebagai database (Serverless), sehingga ringan, gratis, dan mudah dikelola tanpa perlu menyewa hosting mahal.

## ✨ Fitur Utama

* **🗺️ Peta Interaktif:** Menggunakan Leaflet.js dengan pilihan layer (Jalan, Satelit, Topografi).
* **📊 Visualisasi Data:** Menampilkan data bencana tahunan dengan indikator warna (Hijau/Merah) berdasarkan intensitas.
* **📢 Laporan Warga:** Pengguna bisa melapor kejadian dengan klik peta, mengisi form, dan menentukan radius dampak.
* **☁️ Database Google Sheets:** Data laporan tersimpan otomatis di Google Spreadsheet.
* **🔍 Pencarian Lokasi:** Fitur pencarian Kota/Kabupaten dengan *autocomplete*.
* **📱 Responsif:** Tampilan menyesuaikan layar HP dan Desktop.

---

## 📂 Struktur Folder

Pastikan susunan folder proyek Anda seperti ini:

```text
gis-bencana-bnpb/
│
├── index.html        # Halaman utama web
├── script.js         # Logika peta, koneksi database, & interaksi
├── style.css         # Desain tampilan (CSS)
├── README.md         # Panduan ini
└── data/
    └── bencana_2024.js  # Data statis BNPB (JSON)
```

## 🚀 Cara Menjalankan (Instalasi)
### 1. Persiapan (Clone/Download)
****Download** atau **Clone repository** ini ke komputer Anda.

### 2. Jalankan Web
Karena ini adalah web statis (HTML/JS), Anda bisa menjalankannya dengan cara:

* VS Code: **Klik kanan pada index.html** > Pilih "**Open with Live Server**".

* Langsung: **Klik 2x file index.html** (beberapa fitur mungkin terbatas jika tidak pakai server lokal).

## ⚙️ Konfigurasi Database (Wajib)
Agar fitur "Laporan Warga" berfungsi, Anda harus menghubungkan web ini dengan Google Sheets milik Anda.

## Langkah 1: Siapkan Google Sheet
1. Buat Google Sheet baru di sheets.new.
2. Beri nama sheet (Tab bawah) menjadi `Sheet1`.
3. Isi Baris 1 (Header) dengan tulisan berikut (**Huruf Kecil Semua**):

    * A1: waktu
    * B1: nama
    * C1: info
    * D1: lat
    * E1: lng
    * F1: radius

4. **PENTING**: Blok Kolom **D (lat)** dan **E (lng)**, lalu klik menu **Format > Number > Plain Text**. (Ini wajib agar Google tidak mengubah titik koordinat menjadi ribuan/tanggal).

### Langkah 2: Pasang Apps Script
1. Di Google Sheet, klik **Extensions > Apps Script**.
2. Hapus seluruh kode yang ada.
3. Ganti dengan kode berikut:

    ```javascript
    var sheetName = 'Sheet1'; // Pastikan nama tab di bawah sheet kamu 'Sheet1'
    var scriptProp = PropertiesService.getScriptProperties();

    function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    scriptProp.setProperty('key', doc.getId());
    }

    // 1. Fungsi Simpan Data (POST)
    function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
        var sheet = doc.getSheetByName(sheetName);

        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var nextRow = sheet.getLastRow() + 1;

        // Mapping data dari web ke kolom sheet
        var newRow = headers.map(function(header) {
        // header harus lowercase biar cocok sama key JSON dari web
        return header === 'timestamp' ? new Date() : e.parameter[header];
        });

        sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

        return ContentService
        .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    catch (e) {
        return ContentService
        .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    finally {
        lock.releaseLock();
    }
    }

    // 2. Fungsi Ambil Data (GET)
    function doGet(e) {
    var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
    var sheet = doc.getSheetByName(sheetName);
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var data = [];

    // Loop baris (mulai index 1 karena 0 itu header)
    for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var record = {};
        for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = row[j];
        }
        data.push(record);
    }

    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }
    ```

4. Klik **Deploy > New Deployment**.
5. Pilih type **Web App**.
6. Pada bagian **Who has access**, pilih: "**Anyone**" (Siapa saja).
7. Klik **Deploy** dan **Copy URL** yang muncul (akhiran /exec).

### Langkah 3: Sambungkan ke Web
1. Buka file script.js di VS Code.
2. Cari baris paling atas:

    ```javascript
    const GOOGLE_SHEET_URL = "ISI_URL_WEB_APP_KAMU_DISINI";
    ```
3. Ganti dengan URL yang kamu copy tadi.
4. Simpan dan Refresh web.

## 📖 Cara Penggunaan
1. **Melihat Data Bencana**
    * Buka web, peta akan memuat lingkaran-lingkaran berwarna.
    * **Hijau** = Aman/Sedikit kejadian.
    * **Merah** = Rawan/Banyak kejadian.
    * Klik lingkaran untuk melihat detail jenis bencana (Banjir, Gempa, dll).

2. **Melaporkan Kejadian**
    * Isi **Nama** dan **Keterangan** pada formulir.
    * Pilih **Radius Dampak** (misal: 500 Meter).
    * **Klik lokasi** kejadian di peta.
    * Klik tombol "**KIRIM LAPORAN**".
    * Konfirmasi dengan klik "**Ya, Kirim**".
    * Data akan muncul di peta dan tersimpan di Google Sheet.

3. **Mencari Lokasi**
* Gunakan kotak pencarian di kiri atas (sebelah tombol Zoom).
* Ketik nama kota (misal: "Aceh"), lalu tekan Enter.

## 🛠️ Teknologi yang Digunakan
* **Frontend**: HTML5, CSS3, JavaScript (Vanilla).
* **Library Peta**: [Leaflet.js](https://leafletjs.com/).
* **Alerts**: [SweetAlert2](https://sweetalert2.github.io/).
* **Backend**: Google Apps Script (GAS).
* **Database**: Google Spreadsheets.
* **Map Tiles**: OpenStreetMap & MapTiler.

## ⚠️ Troubleshooting (Masalah Umum)
**Q: Laporan sudah terkirim tapi marker tidak muncul?** A: Cek Google Sheet kamu.

1. Apakah kolom lat dan lng angkanya jutaan (tanpa titik)? Jika ya, hapus baris tersebut.

2. Pastikan format kolom D & E sudah diubah ke Plain Text.

3. Input ulang laporan dari web.

**Q: Muncul error "Gagal Load Data" di awal?** A: Pastikan saat Deploy Apps Script, aksesnya (Who has access) diset ke **Anyone**.

