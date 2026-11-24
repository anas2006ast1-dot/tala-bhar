-- Read-only query for Supabase SQL Editor > Explorer > source: Logs.
-- Set the time picker to the affected billing period before running.
-- Results include client IPs and user agents; keep them private and share
-- only aggregates if you send diagnostics back.

select
  log_attributes['request.path'] as object_path,
  log_attributes['response.headers.cf_cache_status'] as cdn_cache_status,
  log_attributes['response.status_code'] as status_code,
  log_attributes['request.headers.user_agent'] as user_agent,
  log_attributes['request.headers.cf_connecting_ip'] as client_ip,
  count() as request_count,
  sum(toUInt64OrZero(log_attributes['response.headers.content_length'])) as estimated_response_bytes
from logs
where source = 'edge_logs'
  and log_attributes['request.method'] = 'GET'
  and (
    startsWith(log_attributes['request.path'], '/storage/v1/object/')
    or startsWith(log_attributes['request.path'], '/storage/v1/render/')
  )
group by object_path, cdn_cache_status, status_code, user_agent, client_ip
order by estimated_response_bytes desc
limit 250;
