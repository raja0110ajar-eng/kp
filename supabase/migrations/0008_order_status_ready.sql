-- Menambah tahap opsional "Siap diantar" di antara processing dan delivering.
-- Jalankan SENDIRIAN (jangan digabung dengan migrasi lain).
alter type public.order_status add value if not exists 'ready' before 'delivering';