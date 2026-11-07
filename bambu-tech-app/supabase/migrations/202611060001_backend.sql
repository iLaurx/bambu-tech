-- Apply to a Supabase database with auth and storage already installed.
-- No real users, WhatsApp number, inventory, or remote resources are provisioned here.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.admin_users enable row level security;
revoke all on private.admin_users from public, anon, authenticated;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

create function public.admin_session() returns boolean
language sql stable security invoker set search_path = '' as $$ select private.is_admin(); $$;
revoke all on function public.admin_session() from public;
grant execute on function public.admin_session() to authenticated;

create function private.valid_specs(category text, specs jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb; allowed text[]; numeric_keys text[]; text_keys text[];
begin
  if jsonb_typeof(specs) is distinct from 'object' then return false; end if;
  case category
    when 'Celulares' then numeric_keys := array['ram_gb','storage_gb','battery_mah']; text_keys := array['color','processor'];
    when 'Bocinas' then numeric_keys := array['power_w','battery_hours']; text_keys := array['color','connectivity','water_resistance'];
    when 'Smartbands' then numeric_keys := array['battery_days']; text_keys := array['color','screen','connectivity','water_resistance'];
    when 'Smartwatches' then numeric_keys := array['battery_days']; text_keys := array['color','screen','connectivity','compatibility','water_resistance'];
    when 'Otros' then numeric_keys := array[]::text[]; text_keys := array['color','features'];
    else return false;
  end case;
  allowed := numeric_keys || text_keys;
  if category = 'Celulares' then allowed := allowed || array['unlocked']; end if;
  for k, v in select * from jsonb_each(specs) loop
    if not (k = any(allowed)) then return false; end if;
    if k = any(numeric_keys) then
      if jsonb_typeof(v) <> 'number' then return false; end if;
      if (v::text)::numeric <= 0 or (v::text)::numeric > 1000000
        or trunc((v::text)::numeric * 100) <> (v::text)::numeric * 100 then return false; end if;
    elsif k = 'unlocked' then
      if jsonb_typeof(v) <> 'boolean' then return false; end if;
    else
      if jsonb_typeof(v) <> 'string' or length(btrim(v #>> '{}')) < 1
        or length(v #>> '{}') > (case when k = 'features' then 1000 else 200 end) then return false; end if;
    end if;
  end loop;
  return true;
end;
$$;
revoke all on function private.valid_specs(text,jsonb) from public;
grant execute on function private.valid_specs(text,jsonb) to anon, authenticated, service_role;

create table public.products (
  id uuid primary key,
  title text not null check (title = btrim(title) and length(title) between 1 and 200),
  category text not null check (category in ('Celulares','Bocinas','Smartbands','Smartwatches','Otros')),
  brand text not null check (brand = btrim(brand) and length(brand) between 1 and 80),
  price numeric(10,2) not null check (price > 0),
  condition text not null check (condition in ('Nuevo','Reacondicionado')),
  description text not null default '' check (length(description) <= 10000),
  specs jsonb not null default '{}' check (private.valid_specs(category,specs)),
  main_image text not null,
  gallery_images text[] not null default '{}' check (cardinality(gallery_images) <= 3),
  is_active boolean not null default false,
  is_sold boolean not null default false,
  views_count bigint not null default 0 check (views_count >= 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index products_public_idx on public.products(created_at desc) where is_active and deleted_at is null;
alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
create policy products_read on public.products for select to anon, authenticated
  using (deleted_at is null and (is_active or private.is_admin()));
-- No direct INSERT/UPDATE/DELETE grants or policies, including for administrators.

create table public.settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text check (whatsapp_number ~ '^\+[1-9][0-9]{7,14}$')
);
insert into public.settings(id,whatsapp_number) values (1,null);
alter table public.settings enable row level security;
revoke all on public.settings from public, anon, authenticated;
grant select on public.settings to anon, authenticated;
create policy settings_read on public.settings for select to anon, authenticated using (true);

create table private.assets (
  id uuid primary key,
  product_id uuid not null,
  path text not null unique,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (path = product_id::text || '/' || id::text || '.webp')
);
alter table private.assets enable row level security;
revoke all on private.assets from public, anon, authenticated;

create function private.validate_product_images() returns trigger
language plpgsql security definer set search_path = '' as $$
declare paths text[];
begin
  paths := array_prepend(new.main_image,new.gallery_images);
  if array_position(paths,null) is not null or cardinality(paths) <> (select count(distinct p) from unnest(paths) p)
    or exists(select 1 from unnest(paths) p where not exists (
      select 1 from private.assets a where a.path = p and a.product_id = new.id
    )) then raise exception using errcode = '22023', message = 'Invalid image references'; end if;
  return new;
end;
$$;
revoke all on function private.validate_product_images() from public;
create trigger validate_product_images before insert or update of main_image,gallery_images on public.products
  for each row execute function private.validate_product_images();

create function private.can_read_asset(object_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.assets a where a.path = object_path and (
    private.is_admin() or exists(select 1 from public.products p where p.id = a.product_id
      and p.is_active and p.deleted_at is null and (p.main_image = a.path or a.path = any(p.gallery_images)))
  ));
$$;
revoke all on function private.can_read_asset(text) from public;
grant execute on function private.can_read_asset(text) to anon, authenticated, service_role;

-- Private bucket. This statement is a migration, not permission to create a remote bucket now.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('bambu-products','bambu-products',false,4194304,array['image/webp']);
create policy bambu_image_read on storage.objects for select to authenticated
  using (bucket_id = 'bambu-products' and private.is_admin() and private.can_read_asset(name));
-- Restrictive policies also constrain any pre-existing broad permissive policies.
create policy bambu_image_read_guard on storage.objects as restrictive for select to anon, authenticated
  using (bucket_id <> 'bambu-products' or (private.is_admin() and private.can_read_asset(name)));
create policy bambu_image_insert_guard on storage.objects as restrictive for insert to anon, authenticated
  with check (bucket_id <> 'bambu-products');
create policy bambu_image_update_guard on storage.objects as restrictive for update to anon, authenticated
  using (bucket_id <> 'bambu-products') with check (bucket_id <> 'bambu-products');
create policy bambu_image_delete_guard on storage.objects as restrictive for delete to anon, authenticated
  using (bucket_id <> 'bambu-products');

-- Only the server's privileged client can register a decoded/re-encoded upload.
create function public.register_asset(p_id uuid,p_product_id uuid,p_uploaded_by uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare object_path text := p_product_id::text || '/' || p_id::text || '.webp';
begin
  if not exists(select 1 from private.admin_users where user_id = p_uploaded_by)
    or not exists(select 1 from storage.objects where bucket_id = 'bambu-products' and name = object_path)
    then raise exception using errcode = '42501',message = 'Unauthorized asset'; end if;
  insert into private.assets(id,product_id,path,uploaded_by) values (p_id,p_product_id,object_path,p_uploaded_by);
  return object_path;
end;
$$;
revoke all on function public.register_asset(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.register_asset(uuid,uuid,uuid) to service_role;

create function public.image_path(p_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select a.path from private.assets a where a.id = p_id and private.can_read_asset(a.path);
$$;
revoke all on function public.image_path(uuid) from public;
grant execute on function public.image_path(uuid) to anon, authenticated;

create function public.save_product(p_id uuid,p_input jsonb,p_create boolean) returns public.products
language plpgsql security definer set search_path = '' as $$
declare result public.products; value public.products; k text;
begin
  if not private.is_admin() then raise exception using errcode = '42501',message = 'Administrator required'; end if;
  if jsonb_typeof(p_input) is distinct from 'object' or p_create is null then
    raise exception using errcode = '22023',message = 'Invalid product'; end if;
  for k in select jsonb_object_keys(p_input) loop
    if not (k = any(array['title','category','brand','price','condition','description','specs','main_image','gallery_images','is_active','is_sold']))
      then raise exception using errcode = '22023',message = 'Forbidden field'; end if;
  end loop;
  if (select count(*) from jsonb_object_keys(p_input)) <> 11
    or jsonb_typeof(p_input->'price') is distinct from 'number'
    or jsonb_typeof(p_input->'is_active') is distinct from 'boolean'
    or jsonb_typeof(p_input->'is_sold') is distinct from 'boolean'
    or jsonb_typeof(p_input->'gallery_images') is distinct from 'array'
    or exists(select 1 from jsonb_array_elements(p_input->'gallery_images') item where jsonb_typeof(item) <> 'string')
    or exists(select 1 from unnest(array['title','category','brand','condition','description','main_image']) field
      where jsonb_typeof(p_input->field) is distinct from 'string')
    then raise exception using errcode = '22023',message = 'Invalid product fields'; end if;
  if (p_input->>'price')::numeric * 100 <> trunc((p_input->>'price')::numeric * 100)
    then raise exception using errcode = '22023',message = 'Invalid price precision'; end if;
  value := jsonb_populate_record(null::public.products,p_input);
  if p_create then
    insert into public.products(id,title,category,brand,price,condition,description,specs,main_image,gallery_images,is_active,is_sold)
    values(p_id,value.title,value.category,value.brand,value.price,value.condition,value.description,value.specs,
      value.main_image,value.gallery_images,value.is_active,value.is_sold) returning * into result;
  else
    update public.products set title=value.title,category=value.category,brand=value.brand,price=value.price,
      condition=value.condition,description=value.description,specs=value.specs,main_image=value.main_image,
      gallery_images=value.gallery_images,is_active=value.is_active,is_sold=value.is_sold
      where id=p_id and deleted_at is null returning * into result;
    if not found then raise exception using errcode = 'P0002',message = 'Product not found'; end if;
  end if;
  return result;
end;
$$;
revoke all on function public.save_product(uuid,jsonb,boolean) from public;
grant execute on function public.save_product(uuid,jsonb,boolean) to authenticated;

create function public.set_product_states(p_id uuid,p_is_active boolean,p_is_sold boolean) returns public.products
language plpgsql security definer set search_path = '' as $$
declare result public.products;
begin
  if not private.is_admin() then raise exception using errcode = '42501',message = 'Administrator required'; end if;
  if p_is_active is null or p_is_sold is null then raise exception using errcode = '22023',message = 'States required'; end if;
  update public.products set is_active=p_is_active,is_sold=p_is_sold
    where id=p_id and deleted_at is null returning * into result;
  if not found then raise exception using errcode = 'P0002',message = 'Product not found'; end if;
  return result;
end;
$$;
revoke all on function public.set_product_states(uuid,boolean,boolean) from public;
grant execute on function public.set_product_states(uuid,boolean,boolean) to authenticated;

create function public.delete_product(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception using errcode = '42501',message = 'Administrator required'; end if;
  update public.products set deleted_at=now() where id=p_id and deleted_at is null;
  if not found then raise exception using errcode = 'P0002',message = 'Product not found'; end if;
end;
$$;
revoke all on function public.delete_product(uuid) from public;
grant execute on function public.delete_product(uuid) to authenticated;

create function public.save_whatsapp(p_number text) returns public.settings
language plpgsql security definer set search_path = '' as $$
declare result public.settings;
begin
  if not private.is_admin() then raise exception using errcode = '42501',message = 'Administrator required'; end if;
  update public.settings set whatsapp_number=p_number where id=1 returning * into result;
  return result;
end;
$$;
revoke all on function public.save_whatsapp(text) from public;
grant execute on function public.save_whatsapp(text) to authenticated;

create function public.increment_product_views(p_id uuid) returns void
language sql volatile security definer set search_path = '' as $$
  update public.products set views_count=views_count+1 where id=p_id and is_active and deleted_at is null;
$$;
revoke all on function public.increment_product_views(uuid) from public;
grant execute on function public.increment_product_views(uuid) to anon, authenticated;

create function public.inventory_metrics() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception using errcode = '42501',message = 'Administrator required'; end if;
  return (select jsonb_build_object('total',count(*),'available',count(*) filter(where is_active and not is_sold),
    'sold',count(*) filter(where is_sold),'views',coalesce(sum(views_count),0)) from public.products where deleted_at is null);
end;
$$;
revoke all on function public.inventory_metrics() from public;
grant execute on function public.inventory_metrics() to authenticated;
commit;
