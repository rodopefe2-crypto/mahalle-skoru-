CREATE OR REPLACE FUNCTION
mahalle_tesisler_yakin(
  p_mahalle_id uuid,
  p_lat float,
  p_lng float,
  p_kategori text,
  p_max_km float DEFAULT 0.5
)
RETURNS TABLE(alt_kategori text, isim text)
LANGUAGE sql
AS $$
  SELECT DISTINCT ON (
    mt.alt_kategori,
    COALESCE(mt.isim, mt.alt_kategori)
  )
    mt.alt_kategori,
    mt.isim
  FROM mahalle_tesisler mt
  WHERE mt.mahalle_id = p_mahalle_id
    AND mt.kategori = p_kategori
    AND mt.lat IS NOT NULL
    AND mt.lng IS NOT NULL
    AND (
      6371 * 2 * ASIN(SQRT(
        POWER(SIN((mt.lat - p_lat) * PI() / 180 / 2), 2) +
        COS(mt.lat * PI() / 180) *
        COS(p_lat * PI() / 180) *
        POWER(SIN((mt.lng - p_lng) * PI() / 180 / 2), 2)
      ))
    ) <= p_max_km
  ORDER BY
    mt.alt_kategori,
    COALESCE(mt.isim, mt.alt_kategori)
$$;
