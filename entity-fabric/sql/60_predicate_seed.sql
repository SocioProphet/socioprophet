insert into core.predicate_catalog (predicate_code, predicate_kind, label, value_type, semantic_family, description, source_standard)
values
  ('legal_name', 'attribute', 'Legal name', 'string', 'identity', 'Official legal name of the entity', 'internal'),
  ('alternate_name', 'attribute', 'Alternate name', 'string', 'identity', 'Alternative or alias name', 'internal'),
  ('registered_address', 'attribute', 'Registered address', 'json', 'location', 'Registered office or registered address', 'internal'),
  ('headquarters_address', 'attribute', 'Headquarters address', 'json', 'location', 'Headquarters or principal office address', 'internal'),
  ('country_of_incorporation', 'attribute', 'Country of incorporation', 'code', 'jurisdiction', 'Country of incorporation', 'internal'),
  ('country_of_domicile', 'attribute', 'Country of domicile', 'code', 'jurisdiction', 'Country of domicile or management location', 'internal'),
  ('legal_form', 'attribute', 'Legal form', 'code', 'classification', 'Legal form or ELF code', 'internal'),
  ('entity_status', 'attribute', 'Entity status', 'code', 'classification', 'Lifecycle status of entity', 'internal'),
  ('direct_accounting_parent_of', 'relationship', 'Direct accounting parent of', 'null', 'ownership', 'GLEIF direct accounting-consolidating parent', 'GLEIF'),
  ('ultimate_accounting_parent_of', 'relationship', 'Ultimate accounting parent of', 'null', 'ownership', 'GLEIF ultimate accounting-consolidating parent', 'GLEIF'),
  ('owns', 'relationship', 'Owns', 'null', 'ownership', 'Ownership relationship', 'internal'),
  ('controls', 'relationship', 'Controls', 'null', 'control', 'Control relationship', 'internal'),
  ('beneficial_owner_of', 'relationship', 'Beneficial owner of', 'null', 'ownership', 'Beneficial ownership relationship', 'BODS'),
  ('officer_of', 'relationship', 'Officer of', 'null', 'governance', 'Officer appointment relationship', 'Companies House'),
  ('possible_same_as', 'relationship', 'Possible same as', 'null', 'resolution', 'Possible same-entity relation', 'internal'),
  ('not_same_as', 'relationship', 'Not same as', 'null', 'resolution', 'Negative resolution relation', 'internal')
on conflict (predicate_code) do nothing;
