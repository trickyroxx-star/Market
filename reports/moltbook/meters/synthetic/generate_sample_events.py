# Generates synthetic metering events JSON lines for testing the ETL
# Usage: python generate_sample_events.py > sample_events.jsonl

import uuid, json, random, time

models = ['gpt-4.1','gpt-4o-mini']
plans = ['free','pro','pro_plus']

def make_event(customer_id, model):
    input_len = random.randint(10,2000)
    output_len = random.randint(5,1500)
    ev = {
        'event_type': 'api_call',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'request_id': str(uuid.uuid4()),
        'customer_id': customer_id,
        'account_type': random.choice(plans),
        'product': 'api',
        'endpoint': '/v1/agents/run',
        'model': model,
        'model_version': '1.0',
        'input_tokens': input_len,
        'output_tokens': output_len,
        'total_tokens': input_len + output_len,
        'duration_ms': random.randint(50, 2000),
        'response_status': 200,
        'raw_event': {'method':'POST'}
    }
    return ev

if __name__ == '__main__':
    customers = ['cust_%02d' % i for i in range(1,11)]
    for _ in range(1000):
        c = random.choice(customers)
        m = random.choices(models, weights=[0.3,0.7])[0]
        print(json.dumps(make_event(c,m)))
