CREATE TABLE IF NOT EXISTS source_system (
  source_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  api_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observation_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES source_system(source_id),
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  metric_unit TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL,
  topic_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quality_score (
  snapshot_id TEXT PRIMARY KEY REFERENCES observation_snapshot(snapshot_id),
  source_authority_score DOUBLE PRECISION NOT NULL,
  relevance_score DOUBLE PRECISION NOT NULL,
  freshness_score DOUBLE PRECISION NOT NULL,
  anomaly_score DOUBLE PRECISION NOT NULL,
  confidence_score DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS provenance_audit (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES observation_snapshot(snapshot_id),
  ingestion_job_id TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  request_id TEXT NOT NULL,
  transformation_version TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS seo_action_plan (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  steps JSONB NOT NULL,
  timeline TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  priority TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_item (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  effort TEXT NOT NULL,
  priority TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_item_history (
  id BIGSERIAL PRIMARY KEY,
  action_id TEXT NOT NULL REFERENCES action_item(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
