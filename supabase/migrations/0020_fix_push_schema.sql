-- Fix: pg_net installs its function as net.http_post, not extensions.net.http_post.

create or replace function create_notification(
  p_recipient_id uuid, p_type text, p_title text, p_body text, p_related_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  push_token text;
begin
  insert into notifications (recipient_id, type, title, body, related_id)
  values (p_recipient_id, p_type, p_title, p_body, p_related_id);

  select expo_push_token into push_token from profiles where id = p_recipient_id;

  if push_token is not null then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb,
      body := jsonb_build_object('to', push_token, 'title', p_title, 'body', coalesce(p_body, ''), 'data', jsonb_build_object('type', p_type, 'relatedId', p_related_id))
    );
  end if;
end;
$$;
