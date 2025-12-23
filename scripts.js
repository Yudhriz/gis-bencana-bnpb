/* ==========================================
   BAGIAN 1: KONFIGURASI & INISIALISASI PETA
   ========================================== */

// GANTI DENGAN API KEY MAPTILER KAMU (Daftar gratis di maptiler.com)
// Jika tidak punya, biarkan string kosong.
const MAPTILER_KEY = "7lmQQSsX8Y6UM6xqKZ81"; 

// Inisialisasi Peta (Fokus ke Tengah Indonesia)
var map = L.map('map').setView([-2.5489, 118.0149], 5);


/* ==========================================
   BAGIAN 2: BASEMAPS (FITUR GANTI TEMA PETA)
   ========================================== */

// 1. Layer Standar (OpenStreetMap)
const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
});

// 2. Layer Satelit (MapTiler)
const satelliteLayer = L.tileLayer(
    `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
    {
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
        tileSize: 512,
        zoomOffset: -1,
    }
);

// 3. Layer Topografi (Alam/Kontur)
const topoLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenTopoMap contributors",
});

// Set Default Layer
osmLayer.addTo(map);

// Menu Kontrol Layer (Ditaruh di Kiri Atas agar tidak menutupi Search Box)
const baseMaps = {
    "Peta Standar": osmLayer,
    "Satelit (Real)": satelliteLayer,
    "Topografi (Alam)": topoLayer
};

L.control.layers(baseMaps, null, { position: 'topleft' }).addTo(map);


/* ==========================================
   BAGIAN 3: VISUALISASI DATA BENCANA (JSON)
   ========================================== */

// Loop data dari variable 'dataBencana' (file data/bencana_2024.js)
dataBencana.records.forEach(function(row) {
    var namaKota = row[3];     
    var lat = row[4];          
    var lng = row[5];          
    
    // --- AMBIL SEMUA JENIS BENCANA (Pastikan jadi Angka) ---
    // Kita gunakan Number() untuk mencegah error jika datanya string "0.0"
    var banjir          = Number(row[6]) || 0;
    var cuaca           = Number(row[7]) || 0;
    var erupsi          = Number(row[8]) || 0;  // Erupsi Gunung Api
    var abrasi          = Number(row[9]) || 0;  // Gelombang Pasang & Abrasi
    var gempa           = Number(row[10]) || 0;
    var karhutla        = Number(row[11]) || 0;
    var kekeringan      = Number(row[12]) || 0; // Kekeringan
    var longsor         = Number(row[13]) || 0;
    var tsunami         = Number(row[14]) || 0; // Tsunami

    // Hitung Total Semua Kejadian
    var total = banjir + cuaca + erupsi + abrasi + gempa + karhutla + kekeringan + longsor + tsunami;

    if (lat != null && lng != null) {
        
        // --- LOGIKA WARNA & UKURAN ---
        var warna = "#4CAF50"; // Hijau (Aman/Rendah)
        var radius = 5000;     // Lingkaran Kecil

        if (total > 20) {
            warna = "#D32F2F"; // Merah (Tinggi)
            radius = 15000;    
        } else if (total > 5) {
            warna = "#FF9800"; // Orange (Sedang)
            radius = 9000;     
        }

        // --- ISI POPUP INFO (HANYA MUNCULKAN YANG ADA KEJADIAN) ---
        // Kita susun HTML-nya secara dinamis biar rapi
        var detailBencana = "";
        
        if(banjir > 0)      detailBencana += `🌊 Banjir: <b>${banjir}</b><br>`;
        if(cuaca > 0)       detailBencana += `🌪️ Cuaca Ekstrem: <b>${cuaca}</b><br>`;
        if(erupsi > 0)      detailBencana += `🌋 Erupsi Gunung: <b>${erupsi}</b><br>`;
        if(abrasi > 0)      detailBencana += `🌊🏚️ Gelombang/Abrasi: <b>${abrasi}</b><br>`;
        if(gempa > 0)       detailBencana += `🏚️ Gempa Bumi: <b>${gempa}</b><br>`;
        if(karhutla > 0)    detailBencana += `🔥 Karhutla: <b>${karhutla}</b><br>`;
        if(kekeringan > 0)  detailBencana += `☀️ Kekeringan: <b>${kekeringan}</b><br>`;
        if(longsor > 0)     detailBencana += `⛰️ Tanah Longsor: <b>${longsor}</b><br>`;
        if(tsunami > 0)     detailBencana += `🌊🏢 Tsunami: <b>${tsunami}</b><br>`;

        // Jika total 0 (jarang terjadi tapi mungkin), kasih info aman
        if(detailBencana === "") detailBencana = "<i>Tidak ada kejadian bencana tercatat.</i>";

        var isiPopup = `
            <div style="font-family:sans-serif; min-width:160px">
                <h4 style="margin:0 0 5px 0;">${namaKota}</h4>
                <strong style="color:${warna}">Total Kejadian: ${total}</strong>
                <hr style="margin:5px 0; border:0.5px solid #ccc">
                ${detailBencana}
            </div>
        `;

        // --- GAMBAR KE PETA ---
        L.circle([lat, lng], {
            color: warna,
            fillColor: warna,
            fillOpacity: 0.6,
            radius: radius
        }).addTo(map).bindPopup(isiPopup);
    }
});

/* ==========================================
   BAGIAN 4: FITUR LAPORAN WARGA (GOOGLE SHEETS)
   ========================================== */

var tempMarker; // Marker Merah Sementara
var userReports = L.layerGroup().addTo(map); // Grup Marker Laporan User

// URL Google Apps Script (Backend)
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbx7h8ZnVq1SfUfGkOTnLiFiOmPv3NArc0d73mVUmE8rxhTp0TcZfzh27KhJEFhCyW7v/exec";

// --- 1. FUNGSI LOAD DATA DARI SHEET (SAAT WEB DIBUKA) ---
function loadLaporan() {
    fetch(GOOGLE_SHEET_URL)
    .then(response => response.json())
    .then(data => {
        if (!Array.isArray(data)) return;

        data.forEach(row => {
            var lat = parseFloat(row.lat);
            var lng = parseFloat(row.lng);
            var radius = parseInt(row.radius);

            // Skip jika koordinat rusak/kosong
            if (isNaN(lat) || isNaN(lng)) return;

            // Format Tampilan Popup (Card Style)
            var teksRadius = radius > 0 ? `${radius} Meter` : "Titik Saja";
            
            // PERHATIKAN: Di sini pakai 'row.nama', 'row.info', dll
            var popupContent = `
                <div style="font-family: 'Segoe UI', sans-serif; min-width: 220px;">
                    <div style="background: #1976D2; color: white; padding: 8px 12px; border-radius: 5px 5px 0 0; font-weight: bold; font-size: 14px;">📢 LAPORAN WARGA</div>
                    <div style="padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
                        <div style="margin-bottom: 6px;">👤 <b>${row.nama}</b></div>
                        <div style="margin-bottom: 6px;">📝 ${row.info}</div>
                        <div style="margin-bottom: 6px; color: #d32f2f;">⭕ <b>Dampak:</b> ${teksRadius}</div>
                        <hr style="border: 0; border-top: 1px solid #ddd; margin: 8px 0;">
                        <div style="font-size: 11px; color: #666; text-align: right;">📅 ${row.waktu}</div>
                    </div>
                </div>
            `;
            
            var posisi = [lat, lng];
            var marker = L.marker(posisi).bindPopup(popupContent);
            
            if (radius > 0) {
                L.circle(posisi, {color:'blue', radius:radius, fillOpacity:0.2}).addTo(userReports);
            }
            
            marker.addTo(userReports);
        });
    })
    .catch(err => console.error("Gagal load data sheet:", err));
}
// Jangan lupa panggil fungsi ini
loadLaporan();

// --- 2. LOGIKA KLIK PETA (Hanya Ambil Koordinat) ---
map.on('click', function(e) {
    var lat = e.latlng.lat.toFixed(5);
    var lng = e.latlng.lng.toFixed(5);

    // Masukkan ke Form HTML
    document.getElementById('inputLat').value = lat;
    document.getElementById('inputLng').value = lng;

    // Tampilkan Marker Merah Sementara
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup("Lokasi Terpilih. Isi data lalu klik 'Kirim Laporan'.").openPopup();
});


// --- 3. LOGIKA TOMBOL KIRIM (Simpan ke Google Sheet) ---
function simpanLaporan() {
    // 1. Ambil Data
    var nama = document.getElementById('inputNama').value;
    var info = document.getElementById('inputLokasi').value;
    var radius = document.getElementById('inputRadius').value;
    var lat = document.getElementById('inputLat').value;
    var lng = document.getElementById('inputLng').value;

    // 2. Validasi
    if (!lat || !lng) {
        Swal.fire({icon: 'warning', title: 'Lokasi Kosong!', text: 'Silakan klik titik lokasi bencana di peta.', confirmButtonColor: '#f39c12'});
        return;
    }
    if (!nama || !info) {
        Swal.fire({icon: 'error', title: 'Data Belum Lengkap', text: 'Harap isi Nama Pelapor dan Keterangan Bencana.', confirmButtonColor: '#d33'});
        return;
    }

    // 3. Konfirmasi (Ada tombol Batal & Reset)
    Swal.fire({
        title: 'Konfirmasi Laporan',
        text: "Data akan dikirim ke server. Klik Batal untuk mereset form.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Kirim',
        cancelButtonText: 'Batal & Reset', // Teks tombol batal
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#d33',
        reverseButtons: true
    }).then((result) => {
        
        // A. JIKA USER KLIK "YA, KIRIM"
        if (result.isConfirmed) {

            // Loading...
            Swal.fire({title: 'Mengirim Data...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() }});
            
            var waktu = new Date().toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            var formData = new FormData();
            formData.append('waktu', waktu);
            formData.append('nama', nama);
            formData.append('info', info);
            formData.append('lat', lat);
            formData.append('lng', lng);
            formData.append('radius', radius);

            // Kirim ke Google Sheet
            fetch(GOOGLE_SHEET_URL, {method: 'POST', body: formData})
            .then(response => response.json())
            .then(hasil => {
                
                // --- BAGIAN POPUP CANTIK (CARD STYLE) ---
                var teksRadius = radius > 0 ? `${radius} Meter` : "Titik Saja";
                
                var popupContent = `
                    <div style="font-family: 'Segoe UI', sans-serif; min-width: 220px;">
                        <div style="background: #1976D2; color: white; padding: 8px 12px; border-radius: 5px 5px 0 0; font-weight: bold; font-size: 14px;">📢 LAPORAN WARGA (Baru)</div>
                        <div style="padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
                            <div style="margin-bottom: 6px;">👤 <b>${nama}</b></div>
                            <div style="margin-bottom: 6px;">📝 ${info}</div>
                            <div style="margin-bottom: 6px; color: #d32f2f;">⭕ <b>Dampak:</b> ${teksRadius}</div>
                            <hr style="border: 0; border-top: 1px solid #ddd; margin: 8px 0;">
                            <div style="font-size: 11px; color: #666; text-align: right;">📅 ${waktu}</div>
                        </div>
                    </div>
                `;

                var posisi = [parseFloat(lat), parseFloat(lng)];
                var marker = L.marker(posisi).bindPopup(popupContent);
                
                if (radius > 0) {
                    var circle = L.circle(posisi, {color: '#1976D2', fillColor: '#2196F3', fillOpacity: 0.2, radius: parseInt(radius)});
                    userReports.addLayer(circle);
                }

                userReports.addLayer(marker);
                marker.openPopup();

                // Sukses -> Reset Form
                resetForm();
                if (tempMarker) map.removeLayer(tempMarker);

                Swal.fire({icon: 'success', title: 'Berhasil!', text: 'Laporan tersimpan di Google Sheets.', timer: 2000, showConfirmButton: false});
            })
            .catch(err => {
                Swal.fire({icon: 'error', title: 'Gagal', text: 'Koneksi Error'});
                console.error(err);
            });

        } 
        
        // B. JIKA USER KLIK "BATAL & RESET" (INI YANG TADI HILANG)
        else if (result.dismiss === Swal.DismissReason.cancel) {
            resetForm(); // Kosongkan Form
            if (tempMarker) map.removeLayer(tempMarker); // Hapus marker merah
            
            Swal.fire({
                icon: 'info', 
                title: 'Dibatalkan', 
                text: 'Formulir telah dikosongkan.', 
                timer: 1500, 
                showConfirmButton: false
            });
        }
    });
}

// Fungsi Reset Form
function resetForm() {
    document.getElementById('inputNama').value = "";
    document.getElementById('inputLokasi').value = "";
    document.getElementById('inputLat').value = "";
    document.getElementById('inputLng').value = "";
    document.getElementById('inputRadius').value = "0";
}

/* ==========================================
   BAGIAN 5: FITUR PENCARIAN KOTA
   ========================================== */

var datalist = document.getElementById('daftarKota');

// Isi Datalist Autocomplete
dataBencana.records.forEach(function(row) {
    var namaKota = row[3];
    var option = document.createElement('option');
    option.value = namaKota;
    datalist.appendChild(option);
});

// Fungsi Cari & Terbang ke Lokasi
function cariLokasi() {
    var namaDicari = document.getElementById('inputCari').value;
    
    var hasil = dataBencana.records.find(function(row) {
        return row[3] === namaDicari;
    });

    if (hasil) {
        var lat = hasil[4];
        var lng = hasil[5];
        
        map.flyTo([lat, lng], 10, { duration: 2 });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Tidak Ditemukan',
            text: 'Nama kota tidak ada di dalam data BNPB.'
        });
    }
}

// Enter untuk mencari
document.getElementById('inputCari').addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        cariLokasi();
    }
});