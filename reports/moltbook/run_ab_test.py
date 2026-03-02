import os, json, time, requests
from pathlib import Path
KEY=open('/data/.openclaw/workspace/secrets/openai.key').read().strip()
MODEL='gpt-4o'
PROMPTS_DIR=Path('/data/.openclaw/workspace/reports/moltbook/prompts')
PROMPTS_DIR.mkdir(exist_ok=True)
# load prompt variants from support-triage-prompts.md quickly
variants={
 'A': 'You are an assistant that classifies support tickets into one of: [bug, feature_request, billing, account, usability, cancellation, other]. Reply as JSON: {"intent":..., "confidence":0.0, "notes": ""}\nTicket:\n{ticket}\nReturn only JSON.',
 'B': 'You are an assistant that classifies support tickets into one of: [bug, feature_request, billing, account, usability, cancellation, other]. Consider customer metadata when classifying. Reply as JSON with intent/confidence/notes.\nTicket:\n{ticket}\nReturn only JSON.',
 'C': 'First extract key facts from the ticket, then classify into [bug, feature_request, billing, account, usability, cancellation, other]. Return JSON {"intent":"","confidence":0.0,"facts":[],"notes":""}.\nTicket:\n{ticket}\nReturn only JSON.'
}
for k,v in variants.items():
    open(PROMPTS_DIR/f'prompt_{k}.txt','w').write(v)
# load synthetic tickets
tickets=json.load(open('/data/.openclaw/workspace/reports/moltbook/synthetic_tickets.json'))
results=[]
headers={'Authorization':f'Bearer {KEY}','Content-Type':'application/json'}
url='https://api.openai.com/v1/chat/completions'
for variant,prompt in variants.items():
    for t in tickets:
        msg=prompt.replace('{ticket}', t['subject']+"\n\n"+t['body'])
        payload={
            'model':MODEL,
            'messages':[{'role':'system','content':'You are Moltbook Support Assistant.'},{'role':'user','content':msg}],
            'max_tokens': 300,
            'temperature':0.0
        }
        r=requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
        if r.status_code==200:
            resp=r.json()
            text=resp['choices'][0]['message']['content']
            # try parse json
            try:
                parsed=json.loads(text)
            except:
                parsed={'_raw':text}
            usage=resp.get('usage',{})
            results.append({'variant':variant,'ticket_id':t['id'],'response':parsed,'usage':usage})
        else:
            results.append({'variant':variant,'ticket_id':t['id'],'error':r.text})
        time.sleep(0.05)
# save
open('/data/.openclaw/workspace/reports/moltbook/support-triage-ab-results.json','w').write(json.dumps(results,indent=2))
print('done, wrote results')
