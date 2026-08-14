-- Dev-only seed data. Safe to re-run locally; not applied to production by default.

insert into categories (slug, label, icon, kind) values
  ('videographer', 'Vidéaste', '🎥', 'both'),
  ('photographer', 'Photographe', '📸', 'both'),
  ('model', 'Modèle', '💃', 'both'),
  ('ugc-creator', 'UGC Creator', '📱', 'both'),
  ('video-editor', 'Monteur vidéo', '🎬', 'pro'),
  ('drone-operator', 'Opérateur drone', '🚁', 'pro'),
  ('makeup-artist', 'Maquilleur', '💄', 'pro'),
  ('travel', 'Voyage', '✈️', 'collab'),
  ('tiktok', 'TikTok', '📱', 'collab'),
  ('fashion', 'Fashion', '👗', 'both')
on conflict (slug) do nothing;
