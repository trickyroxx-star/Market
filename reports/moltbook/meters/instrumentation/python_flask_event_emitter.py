# Flask before/after request example to emit metering events
# Register with app.before_request and app.after_request
from flask import request, g
import uuid, time, json

def estimate_tokens(text):
    if not text:
        return 0
    return max(1, (len(text) + 3) // 4)

def metering_emit(event, emit_fn):
    # emit_fn should be an async-safe function that pushes to queue or HTTP endpoint
    try:
        emit_fn(event)
    except Exception as e:
        print('metering emit error', e)

def before_request_handler():
    g._metering_start = time.time()
    g._metering_request_id = str(uuid.uuid4())

def after_request_handler(response, emit_fn):
    try:
        duration_ms = int((time.time() - g._metering_start) * 1000)
        request_id = g._metering_request_id
        input_tokens = estimate_tokens(request.get_data(as_text=True))
        output_tokens = getattr(g, 'output_tokens', None)
        total_tokens = (input_tokens or 0) + (output_tokens or 0)

        event = {
            'event_type': 'api_call',
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'request_id': request_id,
            'customer_id': getattr(request, 'user', None) and request.user.id or 'anonymous',
            'account_type': getattr(request, 'user', None) and request.user.plan or 'free',
            'product': 'api',
            'endpoint': request.path,
            'model': request.json.get('model') if request.is_json else None,
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'total_tokens': total_tokens,
            'duration_ms': duration_ms,
            'response_status': response.status_code,
            'raw_event': {
                'method': request.method,
                'headers': {k:v for k,v in request.headers.items() if k.lower() in ['content-type','user-agent','x-workspace-id']}
            }
        }
        metering_emit(event, emit_fn)
    except Exception as e:
        print('metering after_request error', e)
    return response

# Example wiring:
# app.before_request(before_request_handler)
# app.after_request(lambda r: after_request_handler(r, my_emit_fn))
