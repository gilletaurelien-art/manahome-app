-- Fixtures de DÉMONSTRATION uniquement — is_demo=true, jamais de donnée réelle.
-- Périphérie de Crozon (29), géoloc volontairement large (centre-bourg, pas d'adresse).

INSERT INTO utilisateurs (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000d1', 'demo-vendeur@manahome.demo'),
  ('00000000-0000-0000-0000-0000000000d2', 'demo-acheteur@manahome.demo');

INSERT INTO annonces (id, proprietaire, type_bien, surface_m2, pieces, prix_eur, dpe, description, geoloc, statut, source, empreinte, is_demo) VALUES
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1',
   'maison', 98, 4, 245000, 'C',
   'Maison de ville lumineuse à deux pas du port, jardin clos, cuisine ouverte. Coup de cœur assuré pour la vue sur la rade depuis le séjour.',
   '(48.2462,-4.4337)', 'publiee', 'directe_particulier', 'demo-crozon-maison-1', true),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d1',
   'appartement', 62, 3, 168000, 'D',
   'Appartement en dernier étage avec balcon plein sud, proche des commerces et de la plage de Pen-Hat.',
   '(48.2403,-4.4308)', 'publiee', 'directe_particulier', 'demo-crozon-appt-1', true),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000d1',
   'terrain', 720, NULL, 89000, NULL,
   'Terrain viabilisé au calme, en lisière du hameau, idéal maison de famille. Bornage à jour.',
   '(48.2589,-4.4612)', 'publiee', 'directe_particulier', 'demo-crozon-terrain-1', true);

INSERT INTO territoires (code_insee, nom, enrichissement) VALUES
  ('29042', 'Crozon',
   '{"environnement": "Presqu''île, rade de Brest, côte sauvage",
     "transports": "Gare TER de Landévennec-Hydro, bus Brest-Crozon (Ligne 15/16)",
     "services": "Commerces, écoles, marché, centre culturel, hôpital de proximité",
     "vie_locale": "Port de pêche, plages, sentiers GR34, dynamisme associatif"}');

-- annonce importée de démo : la plus ancienne et en second dans le tri source
INSERT INTO annonces (id, proprietaire, type_bien, surface_m2, pieces, prix_eur, dpe, description, geoloc, statut, source, source_id, empreinte, is_demo) VALUES
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000d1',
   'maison', 145, 5, 410000, 'B',
   '[DEMO import] Longère rénovée avec dépendance, panorama mer, à 10 min des plages.',
   '(48.2700,-4.4700)', 'publiee', 'import_pro', 'gedeon-demo-001', 'demo-crozon-maison-2', true);
