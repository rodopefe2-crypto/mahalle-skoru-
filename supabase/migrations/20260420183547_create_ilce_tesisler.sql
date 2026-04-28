create table ilce_tesisler (
  id uuid primary key default gen_random_uuid(),
  ilce_id uuid references ilceler(id) on delete cascade,
  kategori text not null,
  alt_kategori text,
  isim text,
  lat double precision not null,
  lng double precision not null,
  osm_id bigint,
  created_at timestamp default now()
);

create index idx_ilce_tesisler_ilce_kategori 
  on ilce_tesisler(ilce_id, kategori);
