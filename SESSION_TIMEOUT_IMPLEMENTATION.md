# Dokumentasi Implementasi Session Timeout 15 Menit

## Ringkasan
Fitur session timeout 15 menit telah berhasil diimplementasikan menggunakan **Laravel Sanctum** dengan opsi "Remember Me" (7 hari).

---

## Fitur yang Diimplementasikan

### 1. Backend (Laravel)

#### A. Instalasi & Konfigurasi Sanctum
- **Package:** `laravel/sanctum` v4.3.1
- **Config:** `config/sanctum.php` - Expiration default 15 menit
- **Migration:** `personal_access_tokens` table untuk menyimpan token

#### B. Model User (`app/Models/User.php`)
- Ditambahkan trait `HasApiTokens` untuk Sanctum support

#### C. AuthController (`app/Http/Controllers/AuthController.php`)
Metode yang tersedia:
- `login()` - Membuat token dengan expiry 15 menit atau 7 hari (remember me)
- `logout()` - Revoke token saat logout
- `me()` - Mendapatkan user yang sedang login

#### D. SessionTimeoutMiddleware (`app/Http/Middleware/SessionTimeoutMiddleware.php`)
- Mengecek validitas token di setiap request
- Jika token expired, return 401 dengan code `SESSION_TIMEOUT`
- Update `last_used_at` secara otomatis

#### E. API Routes (`routes/api.php`)
- Route publik: `/api/login`
- Route protected (auth:sanctum + session.timeout):
  - Semua route API lainnya
  - `/api/logout`
  - `/api/me`

#### F. Bootstrap Config (`bootstrap/app.php`)
- Register middleware alias `session.timeout`

---

### 2. Frontend (React)

#### A. Token Manager (`resources/js/utils/tokenManager.js`)
Utility untuk mengelola token di localStorage:
- `setToken()` - Simpan token dan metadata
- `getToken()` - Ambil token
- `isTokenExpired()` - Cek apakah token sudah expired
- `getTimeRemaining()` - Hitung sisa waktu dalam detik
- `clearToken()` - Hapus semua data autentikasi

#### B. Axios Config (`resources/js/api/axiosConfig.js`)
- Request interceptor: Auto-attach Bearer token
- Response interceptor: Handle 401 SESSION_TIMEOUT

#### C. useAuth Hook (`resources/js/hooks/useAuth.js`)
Custom hook dengan features:
- `login()` - Login dengan remember me option
- `logout()` - Logout dan revoke token
- `checkSession()` - Validasi session manual
- Session monitoring: Check setiap 30 detik
- Auto logout saat token expired

#### D. SessionTimeoutModal (`resources/js/components/SessionTimeoutModal.jsx`)
Modal popup yang muncul saat session timeout:
- Icon dan pesan "Session Berakhir"
- Tombol "Login Kembali" untuk redirect ke login
- Tidak bisa ditutup (wajib login ulang)

#### E. ProtectedRoute (`resources/js/components/ProtectedRoute.jsx`)
Wrapper untuk route yang memerlukan autentikasi

#### F. Updated Login.jsx
- Menggunakan useAuth hook
- Checkbox "Ingat saya (7 hari)" - Remember Me

#### G. Updated App.jsx
- Integrasi useAuth hook
- Integrasi SessionTimeoutModal
- ProtectedRoute wrapper

---

## Cara Kerja

### Flow Login
1. User mengisi email, password, dan opsi "Ingat saya"
2. API `/api/login` dipanggil
3. Server membuat Sanctum token dengan expires_at:
   - 15 menit jika tidak remember me
   - 7 hari jika remember me
4. Token, expiry time, dan user data disimpan di localStorage
5. Session monitoring dimulai (check setiap 30 detik)

### Flow Session Check
1. Setiap 30 detik, frontend cek token expiry
2. Jika token expired, clear localStorage dan tampilkan modal
3. User wajib klik "Login Kembali" untuk ke halaman login

### Flow API Request
1. Axios interceptor attach Bearer token ke setiap request
2. Server middleware cek token validity
3. Jika expired, return 401 SESSION_TIMEOUT
4. Axios interceptor catch 401, clear storage, trigger modal

### Flow Logout
1. Panggil API `/api/logout` untuk revoke token
2. Clear localStorage
3. Stop session monitoring

---

## Penggunaan

### Login Normal (15 menit)
```javascript
// Login tanpa remember me - token expired dalam 15 menit
const result = await login({ email, password }, false);
```

### Login dengan Remember Me (7 hari)
```javascript
// Login dengan remember me - token expired dalam 7 hari
const result = await login({ email, password }, true);
```

### Protected API Call
```javascript
import apiClient from '../api/axiosConfig';

// Token otomatis di-attach oleh interceptor
const response = await apiClient.get('/me');
```

---

## File yang Dibuat/Modifikasi

### Backend
1. ✅ `config/sanctum.php` (baru)
2. ✅ `app/Models/User.php` (modifikasi - tambah HasApiTokens)
3. ✅ `app/Http/Controllers/AuthController.php` (rewrite)
4. ✅ `app/Http/Middleware/SessionTimeoutMiddleware.php` (baru)
5. ✅ `routes/api.php` (rewrite - tambah middleware auth)
6. ✅ `bootstrap/app.php` (modifikasi - register middleware)
7. ✅ `database/migrations/2026_03_30_071530_create_personal_access_tokens_table.php` (baru)

### Frontend
1. ✅ `resources/js/utils/tokenManager.js` (baru)
2. ✅ `resources/js/api/axiosConfig.js` (baru)
3. ✅ `resources/js/hooks/useAuth.js` (baru)
4. ✅ `resources/js/components/SessionTimeoutModal.jsx` (baru)
5. ✅ `resources/js/components/ProtectedRoute.jsx` (baru)
6. ✅ `resources/js/pages/Login.jsx` (modifikasi - tambah remember me)
7. ✅ `resources/js/App.jsx` (modifikasi - integrasi session timeout)

---

## Testing

### Skenario Test
1. **Login Normal:** Login tanpa centang "Ingat saya", tunggu 15 menit, verify auto logout
2. **Login Remember Me:** Login dengan centang "Ingat saya", verify masih login setelah 15 menit
3. **Multiple Device:** Login dari 2 browser berbeda, verify keduanya bisa aktif
4. **Manual Logout:** Klik logout di device A, verify device B masih aktif
5. **API Protection:** Coba akses API tanpa token, verify 401 error

### Perintah Test
```bash
# Test login
POST /api/login
Body: { "email": "user@example.com", "password": "secret", "remember_me": false }

# Test protected route (dengan token)
GET /api/me
Headers: Authorization: Bearer {token}

# Test logout
POST /api/logout
Headers: Authorization: Bearer {token}
```

---

## Troubleshooting

### Masalah: Token tidak berfungsi
**Solusi:** 
- Pastikan migration `personal_access_tokens` sudah di-run
- Clear cache: `php artisan config:clear`

### Masalah: Session timeout modal tidak muncul
**Solusi:**
- Check browser console untuk error
- Pastikan event listener di App.jsx berjalan
- Verify token tersimpan di localStorage

### Masalah: Auto logout tidak berjalan
**Solusi:**
- Check interval timer di useAuth.js
- Verify `isTokenExpired()` mengembalikan true saat expired

---

## Keamanan

### Token Security
- ✅ Token disimpan di localStorage (perlu pertimbangkan httpOnly cookies untuk production)
- ✅ Token di-attach sebagai Bearer Authorization header
- ✅ Token dihapus dari database saat logout
- ✅ Token expired otomatis tidak bisa digunakan lagi

### Session Security
- ✅ Session check setiap 30 detik di frontend
- ✅ Server validation di setiap API request
- ✅ Auto logout saat token expired
- ✅ Multiple device login diizinkan

---

## Estimasi Waktu Implementasi

| Task | Waktu |
|------|-------|
| Backend Setup | ~45 menit |
| Frontend Setup | ~60 menit |
| Testing & Debugging | ~30 menit |
| **Total** | **~2.5 jam** |

---

## Next Steps (Opsional)

1. **Refresh Token:** Implementasi refresh token untuk extend session tanpa login ulang
2. **httpOnly Cookies:** Ganti localStorage dengan httpOnly cookies untuk keamanan lebih baik
3. **Session Warning:** Tambah warning popup di menit ke-13 sebelum timeout
4. **Activity Tracking:** Track user activity untuk extend session saat user aktif
5. **Single Session:** Opsi untuk hanya mengizinkan 1 session per user

---

## Catatan Penting

1. **Remember Me:** Token dengan remember me expired dalam 7 hari, bukan 15 menit
2. **Multiple Device:** User bisa login dari multiple device secara bersamaan
3. **Logout:** Logout dari 1 device tidak mengeluarkan device lain
4. **Build:** Frontend perlu di-build ulang setelah perubahan: `npm run build`
5. **Cache:** Clear Laravel cache setelah deploy: `php artisan cache:clear`

---

## Support

Jika ada masalah atau pertanyaan, silakan check:
1. Laravel logs: `storage/logs/laravel.log`
2. Browser console untuk frontend error
3. Network tab untuk API request/response

Implementasi siap digunakan! 🎉