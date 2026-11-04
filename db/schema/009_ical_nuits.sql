-- Migration 009 : provenance des nuitées importées par iCal.
-- Doctrine : un import iCal REMPLACE les nuitées de SA source — il ne touche
-- NI les blocages manuels de l'hôte, NI les réservations confirmées (cause
-- 'reservation_confirmee'). Sans provenance, ré-importer un calendrier qui a
-- libéré une semaine laisserait la semaine bloquée à vie : un calendrier
-- externe qui ment sur l'offre affichée.
--
-- Les nuitées importées lors du dernier import sont donc mémorisées dans
-- annonces_ical (jsonb) : le remplacement retire exactement celles-là —
-- et seulement si elles sont toujours de cause 'blocage'.

ALTER TABLE annonces_ical
  ADD COLUMN nuits_importees jsonb NOT NULL DEFAULT '[]';
