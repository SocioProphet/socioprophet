create view core.v_entity_current_identifiers as
select distinct on (i.entity_id, i.scheme)
  i.entity_id,
  i.scheme,
  i.value,
  i.jurisdiction,
  i.issuing_authority,
  i.status,
  i.preferred,
  i.valid_from,
  i.valid_to,
  i.source_record_id
from core.identifier i
where i.valid_to is null or i.valid_to > now()
order by i.entity_id, i.scheme, i.preferred desc, i.created_at desc;

create view core.v_entity_current_attributes as
select distinct on (a.entity_id, a.predicate_code, coalesce(a.normalized_value, a.value_text, a.value_date::text, a.value_timestamp::text))
  a.statement_id,
  a.entity_id,
  a.predicate_code,
  a.value_text,
  a.value_json,
  a.value_numeric,
  a.value_date,
  a.value_timestamp,
  a.normalized_value,
  a.language,
  a.script,
  a.confidence,
  a.valid_from,
  a.valid_to,
  a.observed_at,
  a.source_record_id,
  a.review_state
from core.attribute_statement a
where a.valid_to is null or a.valid_to > now()
order by a.entity_id, a.predicate_code, coalesce(a.normalized_value, a.value_text, a.value_date::text, a.value_timestamp::text), a.review_state desc, a.observed_at desc, a.created_at desc;

create view core.v_current_designations as
select d.*
from core.designation_event d
where d.status = 'active'
  and (d.effective_to is null or d.effective_to > now())
  and d.delisting_date is null;
