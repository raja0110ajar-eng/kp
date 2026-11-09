-- Ganti daftar email di bawah dengan email akun anggota kelompok yang SUDAH terdaftar.
insert into public.admin_users (user_id)
select id
from auth.users
where email in (
  'karsapandiga@gmail.com',
  'karsapandiga2@gmail.com'
)
on conflict (user_id) do nothing;