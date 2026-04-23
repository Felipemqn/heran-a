-- Row Level Security policies para Jera Horizonte (Supabase).
-- Aplicar apos `prisma migrate dev`. Assume JWT com claims `family_id` e `role`.
--
-- NOTA: Prisma gera colunas em camelCase ("familyId"), nao snake_case.
-- Todas as referencias a colunas usam quoted identifiers preservando camelCase.

-- Helper: extrai family_id do JWT (claim em snake_case por convencao Clerk/Supabase)
create or replace function public.current_family_id() returns uuid as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'family_id', '')::uuid
$$ language sql stable;

-- Helper: extrai role do JWT
create or replace function public.current_role_name() returns text as $$
  select current_setting('request.jwt.claims', true)::json->>'role'
$$ language sql stable;

-- Ativar RLS em todas as tabelas com dados de familia
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

-- Policies: leitura e escrita apenas da propria familia.
-- Advisors (role=advisor no JWT) veem todas as familias que atendem.
-- USING cobre SELECT/UPDATE/DELETE; WITH CHECK cobre INSERT/UPDATE
-- (impede um usuario mover uma linha para outra familia).

create policy family_isolation on family
  for all
  using (id = public.current_family_id() or public.current_role_name() = 'advisor')
  with check (id = public.current_family_id() or public.current_role_name() = 'advisor');

create policy member_isolation on member
  for all
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor')
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');

create policy asset_isolation on asset
  for all
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor')
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');

create policy allocation_isolation on allocation
  for all
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor')
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');

create policy historical_value_isolation on historical_value
  for all
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor')
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');

create policy scenario_isolation on scenario
  for all
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor')
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');

create policy decision_isolation on decision
  for all
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor')
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');

create policy ips_version_isolation on ips_version
  for all
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor')
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');

create policy meeting_isolation on meeting
  for all
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor')
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');

-- Audit log: leitura da propria familia ou advisor; insert liberado para servidor
create policy audit_log_select on audit_log
  for select
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor' or "familyId" is null);
create policy audit_log_insert on audit_log
  for insert
  with check (true);

-- AI interactions: leitura e escrita na propria familia
create policy ai_interaction_select on ai_interaction
  for select
  using ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');
create policy ai_interaction_insert on ai_interaction
  for insert
  with check ("familyId" = public.current_family_id() or public.current_role_name() = 'advisor');
