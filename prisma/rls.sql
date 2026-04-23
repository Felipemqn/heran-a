-- Row Level Security policies para Jera Horizonte (Supabase).
-- Aplicar apos `prisma migrate dev`. Assume JWT com claim `family_id`.

-- Helper: extrai family_id do JWT
create or replace function auth.current_family_id() returns uuid as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'family_id', '')::uuid
$$ language sql stable;

-- Helper: extrai role do JWT
create or replace function auth.current_role_name() returns text as $$
  select current_setting('request.jwt.claims', true)::json->>'role'
$$ language sql stable;

-- Ativar RLS em todas as tabelas com familyId
alter table family            enable row level security;
alter table member            enable row level security;
alter table asset             enable row level security;
alter table allocation        enable row level security;
alter table historical_value  enable row level security;
alter table scenario          enable row level security;
alter table decision          enable row level security;
alter table ips_version       enable row level security;
alter table meeting           enable row level security;
alter table audit_log         enable row level security;
alter table ai_interaction    enable row level security;

-- Policy generica: acesso apenas a linhas da propria familia
-- Advisors (role=advisor) podem ver todas as familias que atendem.

create policy family_isolation on family
  for all using (id = auth.current_family_id() or auth.current_role_name() = 'advisor');

create policy member_isolation on member
  for all using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');

create policy asset_isolation on asset
  for all using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');

create policy allocation_isolation on allocation
  for all using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');

create policy historical_value_isolation on historical_value
  for all using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');

create policy scenario_isolation on scenario
  for all using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');

create policy decision_isolation on decision
  for all using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');

create policy ips_version_isolation on ips_version
  for all using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');

create policy meeting_isolation on meeting
  for all using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');

-- Audit log: insercao livre para servidor; leitura apenas da propria familia ou advisor
create policy audit_log_select on audit_log
  for select using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');
create policy audit_log_insert on audit_log
  for insert with check (true);

-- AI interactions: leitura pela propria familia; escrita pelo servidor
create policy ai_interaction_select on ai_interaction
  for select using (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');
create policy ai_interaction_insert on ai_interaction
  for insert with check (family_id = auth.current_family_id() or auth.current_role_name() = 'advisor');
